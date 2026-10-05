// Learning exercise: a stripped-down reimplementation of node-pg-migrate to understand how it works.
// NOT for real use — migrate.ts remains the official script.
// Uses its own tracking table (migrations_scratch) so it never touches the real pgmigrations table.

import fs from 'fs';
import path from 'path';
import pool from '../config/db';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const MIGRATIONS_TABLE = 'migrations_scratch';

// Split a .sql file into its Up / Down parts, the same way the real sqlMigration.js does
function parseUpDown(sql: string): { up: string; down?: string } {
  const upIndex = sql.search(/^\s*--\s*Up Migration/im);
  const downIndex = sql.search(/^\s*--\s*Down Migration/im);

  const up = upIndex >= 0 ? sql.slice(upIndex, downIndex >= 0 ? downIndex : undefined) : sql;
  const down = downIndex >= 0
    ? sql.slice(downIndex, upIndex >= 0 && upIndex > downIndex ? upIndex : undefined)
    : undefined;

  return { up, down };
}

async function migrate() {
  const direction = process.argv[2] === 'down' ? 'down' : 'up';
  const client = await pool.connect();

  try {
    // 1. Make sure the tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS "${MIGRATIONS_TABLE}" (
        name TEXT PRIMARY KEY,
        run_on TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // 2. Get the list of already-applied migrations (from THIS separate tracking table, not the real pgmigrations)
    const { rows } = await client.query(`SELECT name FROM "${MIGRATIONS_TABLE}"`);
    const applied = new Set(rows.map((r) => r.name as string));

    // 3. List the files, sorted by the leading number in the name (like the real mechanism, not a string sort)
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

    // 4. Pick the files to run depending on the direction
    const toRun = direction === 'up'
      ? files.filter((f) => !applied.has(f))
      : files.filter((f) => applied.has(f)).reverse(); // rollback: run in reverse order, newest first

    if (toRun.length === 0) {
      console.log('No migrations to run.');
      return;
    }

    // 5. Run each file, one transaction per file
    for (const file of toRun) {
      const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      const { up, down } = parseUpDown(content);

      if (direction === 'down' && !down) {
        console.log(`Skipping ${file}: no Down Migration section.`);
        continue;
      }

      const sqlToRun = direction === 'up' ? up : down!;

      await client.query('BEGIN');
      try {
        await client.query(sqlToRun);

        if (direction === 'up') {
          await client.query(`INSERT INTO "${MIGRATIONS_TABLE}" (name) VALUES ($1)`, [file]);
        } else {
          await client.query(`DELETE FROM "${MIGRATIONS_TABLE}" WHERE name = $1`, [file]);
        }

        await client.query('COMMIT');
        console.log(`✅ [${direction}] ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
