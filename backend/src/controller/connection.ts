import { Request, Response } from 'express';
import pool from '../config/database';

export async function checkDatabaseConnectivity(req: Request,res: Response): Promise<void> {
  try {
    const result = await pool.query('SELECT CURRENT_DATABASE();');
    const currentDB = result.rows[0].current_database;
    res.status(200).json({ status: 'connected', database: currentDB });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ status: 'error', message });
  }
}