import fs from 'fs';
import path from 'path';
import pool from '../config/database';

export async function runMigrations() {
    const migrationClient = await pool.connect();
    try {
        await migrationClient.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                filename TEXT UNIQUE NOT NULL,
                executed_at TIMESTAMP DEFAULT NOW()
            );    
        `);
        
        const executedRes = await migrationClient.query(`SELECT filename FROM migrations;`);
        const executed = new Set(executedRes.rows.map(r => r.filename));
        
        const migrationDir = path.join(__dirname, '../migrations');
        const files = fs.readdirSync(migrationDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

        for (const file of files) {
            if (executed.has(file)) continue;
            const filePath = path.join(migrationDir, file);
            const sql = fs.readFileSync(filePath, 'utf-8');

            console.log(`Running migration: ${file}`);
            
            try {
                await migrationClient.query('BEGIN');
                await migrationClient.query(sql);
                await migrationClient.query(
                'INSERT INTO migrations (filename) VALUES ($1)',
                [file]
                );
                await migrationClient.query('COMMIT');
            } catch (err) {
                await migrationClient.query('ROLLBACK');
                console.error(`Error in migration ${file}:`, err);
                throw err;
            }
        }

        console.log('migrations complete');


    } catch(err) {
        console.log(`migration error: ${err}`);
    } finally {
        migrationClient.release();
    }
}