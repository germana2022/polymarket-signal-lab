import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { pool } from './pool.js';

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = await readFile(schemaPath, 'utf8');
  await pool.query(sql);
  await pool.query(`
    ALTER TABLE signals
    ADD COLUMN IF NOT EXISTS data_confidence TEXT NOT NULL DEFAULT 'MEDIUM';
  `);
  await pool.query(`
    ALTER TABLE signal_exit_rules
    ADD COLUMN IF NOT EXISTS close_near_resolution_if_risk_unknown BOOLEAN DEFAULT TRUE;
  `);
  console.log('Database migration completed.');
  await pool.end();
}

main().catch(async (error) => {
  console.error('Migration failed:', error);
  await pool.end();
  process.exit(1);
});
