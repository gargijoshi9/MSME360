'use strict';
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * JWT authentication middleware.
 * Verifies the Bearer token in the Authorization header and attaches
 * req.user = { id, email } to the request object.
 *
 * Usage: apply to any route that requires a logged-in, verified user.
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('_id email emailVerified');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    req.user = { id: user._id.toString(), email: user.email };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

module.exports = protect;
