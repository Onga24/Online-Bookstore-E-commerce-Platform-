const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Access denied. No token." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;