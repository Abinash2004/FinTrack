import dotenv from 'dotenv';
import { Request, Response } from 'express';
import { parseExpiryToMs } from '../utils/auth';
import { signAccess, signRefresh } from '../utils/jwt';

dotenv.config({ quiet: true });

const REFRESH_EXP = process.env.REFRESH_TOKEN_EXP || '7d';

export async function authenticateOAuthUser(req: Request, res: Response) {
    const user = req.user as any;

    if (!user) {
        return res.status(400).json({ status: 'failed', message: 'User not found.' });
    }

    const accessToken = signAccess({ userId: user.id, email: user.email });
    const refreshToken = signRefresh({ userId: user.id, email: user.email });

    return res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: parseExpiryToMs(REFRESH_EXP),
    }).json({
        status: 'success',
        message: 'User authenticated via Google',
        accessToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            provider: user.provider,
            created_at: user.created_at
        }
    });
}
