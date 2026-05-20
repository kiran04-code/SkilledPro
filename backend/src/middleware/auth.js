const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) return res.status(401).json({ message: 'Not authorized, no token' });
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) return next();
  return res.status(403).json({ message: 'Admin access only' });
};

const isClient = (req, res, next) => {
  // A client is someone who hasn't set up a worker profile (no skills/category)
  const isWorker = (req.user.skills && req.user.skills.length > 0) || req.user.category;
  if (!isWorker || req.user.isAdmin) return next();
  return res.status(403).json({ message: 'Access restricted to clients only' });
};

const isWorker = (req, res, next) => {
  const isWorkerProfile = (req.user.skills && req.user.skills.length > 0) || req.user.category;
  if (isWorkerProfile || req.user.isAdmin) return next();
  return res.status(403).json({ message: 'Access restricted to workers only' });
};

module.exports = { protect, isAdmin, isClient, isWorker };
