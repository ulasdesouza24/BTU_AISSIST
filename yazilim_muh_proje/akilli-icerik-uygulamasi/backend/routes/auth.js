const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Kullanıcı kaydı
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validasyon
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Tüm alanlar gereklidir!' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Şifre en az 6 karakter olmalıdır!' });
    }

    // E-posta kontrolü
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanılıyor!' });
    }

    // Şifre hash'leme
    const hashedPassword = await bcrypt.hash(password, 12);

    // Kullanıcı oluşturma
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword
    });

    // JWT token oluşturma
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Kullanıcı başarıyla oluşturuldu!',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    });

  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası!' });
  }
});

// Kullanıcı girişi
router.post('/login', async (req, res) => {
  try {
    console.log('Login isteği alındı:', req.body);
    const { email, password } = req.body;

    // Validasyon
    if (!email || !password) {
      console.log('Eksik bilgi:', { email: !!email, password: !!password });
      return res.status(400).json({ message: 'E-posta ve şifre gereklidir!' });
    }

    // Kullanıcı arama
    const user = await User.findOne({ where: { email } });
    console.log('Kullanıcı bulundu:', !!user);
    
    if (!user) {
      return res.status(400).json({ message: 'Geçersiz e-posta veya şifre!' });
    }

    // Şifre kontrolü
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Şifre kontrolü:', isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Geçersiz e-posta veya şifre!' });
    }

    // JWT token oluşturma
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    console.log('Login başarılı, token oluşturuldu');
    res.json({
      message: 'Giriş başarılı!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login hatası:', error);
    res.status(500).json({ 
      message: 'Sunucu hatası!',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Token doğrulama
router.get('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Token bulunamadı!' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Kullanıcı bulunamadı!' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Token doğrulama hatası:', error);
    res.status(401).json({ message: 'Geçersiz token!' });
  }
});

module.exports = router; 