const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'akilli_icerik_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    logging: false,
    define: {
      underscored: true,
      timestamps: true
    }
  }
);

// Veritabanı bağlantısını test et
sequelize.authenticate()
  .then(() => {
    console.log('MySQL bağlantısı başarılı');
  })
  .catch(err => {
    console.error('MySQL bağlantı hatası:', err);
  });

module.exports = { sequelize }; 