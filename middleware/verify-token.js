// middleware/verify-token.js
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if(!token) return res.status(401).json({msg: 'No Token'})
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.payload;
    next();
  } catch (err) {
    res.status(401).json({ err: 'Invalid token.' });
  }
}

module.exports = verifyToken;
