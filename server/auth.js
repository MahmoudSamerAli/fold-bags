const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = () => process.env.JWT_SECRET || 'fallback-dev-secret';

function generateToken(username) {
  return jwt.sign({ username }, JWT_SECRET(), { expiresIn: '24h' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET());
  } catch {
    return null;
  }
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const payload = verifyToken(auth.slice(7));
  if (!payload) return res.status(401).json({ error: 'Invalid token' });
  req.admin = payload;
  next();
}

function hashPassword(password) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function verifyPassword(plain, hash) {
  if (hash.startsWith('$2')) {
    return bcrypt.compare(plain, hash);
  }
  return hashPassword(plain) === hash;
}

module.exports = { generateToken, verifyToken, requireAdmin, hashPassword, verifyPassword };
