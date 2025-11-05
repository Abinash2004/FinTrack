import jwt from 'jsonwebtoken';
import redis from "../config/redis";
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import pool from '../config/database';
import { User } from '../types/db_types'
import { sendMail } from "../utils/mailer";
import { JwtPayload } from '../types/auth';
import { Request, Response } from 'express';
import { signAccess, signRefresh } from '../utils/jwt';
import { validateUserCredential, parseExpiryToMs, generateOTP } from '../utils/auth';

dotenv.config({ quiet: true });

const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
const REFRESH_EXP = process.env.REFRESH_TOKEN_EXP || "7d";

async function initiateUserSignUp(req: Request, res: Response) {

    try {
        const { name, email, password } = req.body;

        if (!validateUserCredential(name, res) ||
            !validateUserCredential(email, res) ||
            !validateUserCredential(password, res)) return;

        const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({
                status: 'failed',
                message: 'user already exists.'
            });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const otp = generateOTP(6);
        await redis.setex(`otp:${email}`, 300, JSON.stringify({ otp, name, password_hash }));

        await sendMail(
            email,
            "FinTrack OTP Verification",
            `Your OTP is ${otp}. It expires in 5 minutes.`
        );

        return res.status(200).json({
            status: "success",
            message: `OTP sent to ${email} (valid for 5 min).`,
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

async function verifyUserSignUp(req: Request, res: Response) {
    try {
        const { email, otp } = req.body;
        if (!validateUserCredential(email, res) || !validateUserCredential(otp, res)) return;

        const stored = await redis.get(`otp:${email}`);
        if (!stored) {
            return res.status(400).json({ status: "failed", message: "OTP expired or not found." });
        }

        const { otp: storedOtp, name, password_hash } = JSON.parse(stored);
        if (storedOtp !== otp) {
            return res.status(400).json({ status: "failed", message: "Invalid OTP." });
        }

        await redis.del(`otp:${email}`);

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
            maxAge: parseExpiryToMs(REFRESH_EXP),
        }).json({
            status: 'success',
            message: 'user authenticated successfully.',
            accessToken,
            user,
        });
    } catch (err) {
        const error = err as Error;
        return res.status(500).json({
            status: 'failed',
            message: 'internal server error',
            error: error.message,
        });
    }
}


async function userSignIn(req: Request, res: Response) {
    try {
        const { email, password } = req.body;

        if (!validateUserCredential(email, res) ||
            !validateUserCredential(password, res)) return;

        const result = await pool.query<User>('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user) {
            return res.status(404).json({
                status: 'failed',
                message: 'user not found.'
            });
        }

        if (user.provider === "google" && !user.password_hash) {
            return res.status(401).json({
                status: 'failed',
                message: 'This account uses Google login. Please sign in with Google.'
            });
        }

        const valid = await bcrypt.compare(password, user.password_hash!);
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
            maxAge: parseExpiryToMs(REFRESH_EXP),
        }).json({
            status: 'success',
            message: 'user authenticated successfully.',
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

async function refreshAccessToken(req: Request, res: Response) {
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
    initiateUserSignUp,
    verifyUserSignUp,
    userSignIn,
    refreshAccessToken
}