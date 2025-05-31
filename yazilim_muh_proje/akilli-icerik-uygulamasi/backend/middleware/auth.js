const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Erişim reddedildi. Token bulunamadı!' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Geçersiz token!' });
    }

    req.user = user;
    next();
    
  } catch (error) {
    console.error('Auth middleware hatası:', error);
    res.status(401).json({ message: 'Geçersiz token!' });
  }
};

module.exports = authMiddleware; 