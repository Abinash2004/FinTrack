import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;

export interface AuthRequest extends Request {
    user?: { userId: number; email: string };
}

export function verifyAccessToken(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            status: "failed",
            message: "Missing token."
        });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, ACCESS_SECRET) as AuthRequest["user"];
        req.user = decoded;
        next();
    } catch {
        return res.status(403).json({
            status: "failed",
            message: "Invalid or expired token."
        });
    }
}
