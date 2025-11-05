import dotenv from 'dotenv';
import jwt, { SignOptions } from 'jsonwebtoken';
import { JwtPayload } from '../types/auth';
 
dotenv.config({ quiet: true });

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
const ACCESS_EXP = process.env.ACCESS_TOKEN_EXP || "15m";
const REFRESH_EXP = process.env.REFRESH_TOKEN_EXP || "7d";

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