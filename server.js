const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
// Render sẽ tự động cấp Port, nếu không có thì mặc định là 3000
const PORT = process.env.PORT || 3000;

// 1. Cấu hình kết nối Database (PostgreSQL)
// DATABASE_URL sẽ được lấy từ file docker-compose hoặc Render
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// 2. Middleware
app.use(cors());
app.use(bodyParser.json());
// Phục vụ giao diện tĩnh từ thư mục 'public' (nơi chứa index.html của bạn)
app.use(express.static(path.join(__dirname, 'public')));

// 3. API ROUTES (CRUD)

// READ: Lấy danh sách tin nhắn
app.get('/api/messages', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM messages ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi khi lấy tin nhắn từ Database" });
    }
});

// CREATE: Gửi tin nhắn mới
app.post('/api/messages', async (req, res) => {
    const { user, content } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO messages (username, content) VALUES ($1, $2) RETURNING *',
            [user, content]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi khi lưu tin nhắn" });
    }
});

// DELETE: Xóa một tin nhắn (Để đạt chuẩn CRUD)
app.delete('/api/messages/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM messages WHERE id = $1', [id]);
        res.json({ message: "Đã xóa tin nhắn thành công" });
    } catch (err) {
        res.status(500).json({ error: "Lỗi khi xóa tin nhắn" });
    }
});

// 4. Khởi tạo bảng dữ liệu nếu chưa có (Chỉ dùng cho bản demo)
const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                username TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Database đã sẵn sàng!");
    } catch (err) {
        console.log("Đang đợi Database khởi động...");
    }
};
initDb();

// 5. Chạy Server
app.listen(PORT, () => {
    console.log(`Server LGBT App Chat đang chạy tại: http://localhost:${PORT}`);
});