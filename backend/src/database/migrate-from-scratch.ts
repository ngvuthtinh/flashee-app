// Bài tập học: viết lại phiên bản rút gọn của node-pg-migrate để hiểu cơ chế.
// KHÔNG dùng cho việc thật — migrate.ts vẫn là script chính thức.
// Dùng bảng tracking riêng (migrations_scratch) để không đụng vào pgmigrations thật.

import fs from 'fs';
import path from 'path';
import pool from '../config/db';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const MIGRATIONS_TABLE = 'migrations_scratch';

// Tách 1 file .sql thành 2 phần Up / Down, giống cách sqlMigration.js thật làm
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
    // 1. Đảm bảo bảng tracking tồn tại
    await client.query(`
      CREATE TABLE IF NOT EXISTS "${MIGRATIONS_TABLE}" (
        name TEXT PRIMARY KEY,
        run_on TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // 2. Lấy danh sách đã chạy (theo bảng tracking RIÊNG này, không phải pgmigrations thật)
    const { rows } = await client.query(`SELECT name FROM "${MIGRATIONS_TABLE}"`);
    const applied = new Set(rows.map((r) => r.name as string));

    // 3. Lấy danh sách file, sort theo số ở đầu tên (giống cơ chế thật, không phải sort chuỗi)
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

    // 4. Lọc ra file cần chạy tuỳ theo direction
    const toRun = direction === 'up'
      ? files.filter((f) => !applied.has(f))
      : files.filter((f) => applied.has(f)).reverse(); // rollback: chạy ngược, mới nhất trước

    if (toRun.length === 0) {
      console.log('Không có migration nào để chạy.');
      return;
    }

    // 5. Chạy từng file, mỗi file 1 transaction riêng
    for (const file of toRun) {
      const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      const { up, down } = parseUpDown(content);

      if (direction === 'down' && !down) {
        console.log(`Bỏ qua ${file}: không có phần Down Migration.`);
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
