import pool from '../config/database';
import dotenv from 'dotenv';
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '../types/db_types'
import { Request, Response } from 'express';

dotenv.config({ quiet: true });

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
const ACCESS_EXP = process.env.ACCESS_TOKEN_EXP || "15m";
const REFRESH_EXP = process.env.REFRESH_TOKEN_EXP || "7d";

interface JwtPayload {
    userId: number;
    email: string;
}

export const signAccess = (payload: JwtPayload): string => {
    return jwt.sign(payload, ACCESS_SECRET, {
        expiresIn: ACCESS_EXP as unknown as SignOptions["expiresIn"],
    });
};

export const signRefresh = (payload: JwtPayload): string => {
    return jwt.sign(payload, REFRESH_SECRET, {
        expiresIn: REFRESH_EXP as unknown as SignOptions["expiresIn"],
    });
};

function validateUserCredential(value: string, res: Response): boolean {
    if (!value) {
        res.status(400).json({
            status: 'failed',
            message: 'missing field are not allowed.'
        });
        return false;
    }

    if (typeof value !== "string") {
        res.status(400).json({
            status: "failed",
            message: "Invalid input types.",
        });
        return false;
    }
    return true;
}

async function userSignUp(req: Request, res: Response) {

    try {
        const { name, email, password } = req.body;

        if (!validateUserCredential(name, res) || !validateUserCredential(email, res) || !validateUserCredential(password, res)) return;

        const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({
                status: 'failed',
                message: 'user already exists.'
            });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const result = await pool.query<User>(
            'INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id, name, email, created_at',
            [name, email, password_hash]
        );
        const user = result.rows[0];

        const accessToken = signAccess({ userId: user.id!, email: user.email });
        const refreshToken = signRefresh({ userId: user.id!, email: user.email });

        return res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 3600 * 1000,
        })
            .json({
                status: 'success',
                message: 'authenticated',
                accessToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    created_at: user.created_at
                }
            });

    } catch (err: unknown) {
        const error = err as Error;
        return res.status(500).json({
            status: 'failed',
            message: 'internal server error',
            error: error.message
        });
    }
}

async function userSignIn(req: Request, res: Response) {
    try {
        const { email, password } = req.body;

        if (!validateUserCredential(email, res) || !validateUserCredential(password, res)) return;

        const result = await pool.query<User>('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user) {
            return res.status(404).json({
                status: 'failed',
                message: 'user not found.'
            });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({
                status: 'failed',
                message: 'incorrect password.'
            });
        }

        const accessToken = signAccess({ userId: user.id!, email: user.email });
        const refreshToken = signRefresh({ userId: user.id!, email: user.email });

        return res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 3600 * 1000,
        })
            .json({
                status: 'success',
                message: 'authenticated',
                accessToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    created_at: user.created_at
                }
            });

    } catch (err) {
        const error = err as Error;
        return res.status(500).json({
            status: 'failed',
            message: 'internal server error',
            error: error.message
        });
    }
}

export async function refreshAccessToken(req: Request, res: Response) {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({
                status: "failed", message: "Missing refresh token."
            });
        }

        const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as JwtPayload;
        const accessToken = signAccess({ userId: decoded.userId, email: decoded.email });

        return res.json({
            status: "success",
            message: "access token is refreshed.",
            accessToken,
        });
    } catch {
        return res.status(403).json({
            status: "failed",
            message: "Invalid or expired refresh token."
        });
    }
}

export {
    userSignUp,
    userSignIn
}