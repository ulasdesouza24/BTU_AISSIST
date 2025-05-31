require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path');

// Route'ları import et
const authRoutes = require('./routes/auth');
const analysisRoutes = require('./routes/analysis');
const reportRoutes = require('./routes/report');
const translationRoutes = require('./routes/translation');
const emailRoutes = require('./routes/email');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploads klasörünü statik olarak sun
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MySQL bağlantısı
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'akilli_icerik',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// MySQL bağlantısını test et
pool.getConnection((err, connection) => {
  if (err) {
    console.error('MySQL bağlantı hatası:', err);
    return;
  }
  console.log('MySQL bağlantısı başarılı');
  connection.release();
});

// Veritabanı tablolarını oluştur
const createTables = async () => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;

  const createAnalysisTable = `
    CREATE TABLE IF NOT EXISTS analysis (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      file_name VARCHAR(255) NOT NULL,
      file_type VARCHAR(50) NOT NULL,
      analysis_result TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `;

  try {
    await pool.promise().query(createUsersTable);
    await pool.promise().query(createAnalysisTable);
    console.log('Veritabanı tabloları oluşturuldu');
  } catch (error) {
    console.error('Tablo oluşturma hatası:', error);
  }
};

createTables();

// Route'ları kullan
app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/translation', translationRoutes);
app.use('/api/email', emailRoutes);

// Test endpoint'i
app.get('/api/test', (req, res) => {
  console.log('Test endpoint\'i çağrıldı');
  res.json({ message: 'API çalışıyor!' });
});

// Ana route
app.get('/', (req, res) => {
  console.log('Ana sayfa çağrıldı');
  res.json({ message: 'Akıllı İçerik Analiz ve Üretim API' });
});

// Hata yakalama middleware'i
app.use((err, req, res, next) => {
  console.error('Hata oluştu:', err);
  res.status(500).json({
    message: 'Bir hata oluştu!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Sunucu hatası'
  });
});

// 404 handler
app.use((req, res) => {
  console.log('404 - Sayfa bulunamadı:', req.url);
  res.status(404).json({ message: 'Sayfa bulunamadı' });
});

// Uploads klasörünü oluştur
const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Server'ı başlat
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
}); 