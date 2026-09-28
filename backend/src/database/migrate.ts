import {runner} from 'node-pg-migrate';
import pool from '../config/db';
import path from 'path';

async function migrate() {
  const direction = process.argv[2] === 'down' ? 'down' : 'up';


  await runner({
    dbClient: pool as any,
    dir: path.join(__dirname, 'migrations'),
    direction,
    migrationsTable: 'pgmigrations',
  });
  await pool.end();
}
migrate();
