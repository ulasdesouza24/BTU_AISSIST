const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const { connectDB } = require('./config/database');

// Route imports
const authRoutes = require('./routes/auth');
const analysisRoutes = require('./routes/analysis');
const reportRoutes = require('./routes/report');
const shortcutRoutes = require('./routes/shortcuts');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Database bağlantısı
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/shortcuts', shortcutRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server çalışıyor!', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Sunucu hatası!', error: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint bulunamadı!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server ${PORT} portunda çalışıyor!`);
}); 