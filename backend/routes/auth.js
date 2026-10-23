const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = db.prepare('SELECT id, email, name, company, role, password_hash FROM users WHERE email = ?').get(email);
    if (!user || user.password_hash !== password) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = Buffer.from(`${user.id}:${user.email}:${Date.now()}`).toString('base64');
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Demo 1-Click Login
router.post('/demo', (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, name, company, role FROM users WHERE email = ?').get('demo@zentropy.io');
    const token = Buffer.from(`${user.id}:${user.email}:${Date.now()}`).toString('base64');
    res.json({
      success: true,
      token,
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Current User Profile
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const token = authHeader.replace('Bearer ', '');
    const decoded = Buffer.from(token, 'base64').toString('ascii');
    const [userId] = decoded.split(':');

    const user = db.prepare('SELECT id, email, name, company, role FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid session' });
  }
});

module.exports = router;
