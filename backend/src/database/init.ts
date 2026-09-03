import fs from 'fs';
import path from 'path';
import pool from '../config/db';

async function initDatabase() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('⏳ Đang khởi tạo bảng vào database...');
    await pool.query(sql);
    console.log('✅ Khởi tạo toàn bộ bảng thành công!');
  } catch (error) {
    console.error('❌ Lỗi khi khởi tạo database:', error);
  } finally {
    await pool.end();
  }
}

initDatabase();
