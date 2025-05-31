require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'akilli_icerik_db',
      port: process.env.DB_PORT || 3306
    });

    console.log('MySQL bağlantısı başarılı!');
    
    // Tabloları kontrol et
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('Mevcut tablolar:', tables);

    // Users tablosunu kontrol et
    const [columns] = await connection.execute('DESCRIBE users');
    console.log('Users tablosu yapısı:', columns);

    await connection.end();
  } catch (error) {
    console.error('MySQL bağlantı hatası:', error);
  }
}

testConnection(); 