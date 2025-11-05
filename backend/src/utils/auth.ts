import {Response} from 'express';

export function validateUserCredential(value: string, res: Response): boolean {
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

export function parseExpiryToMs(exp: string): number {
  const match = exp.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error("Invalid expiry format. Use formats like 15m, 7d, 10h, 30s");

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error("Invalid expiry unit.");
  }
}

export function generateOTP(length = 6): string {
  return Math.floor(10 ** (length - 1) + Math.random() * 9 * 10 ** (length - 1)).toString();
}