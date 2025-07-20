import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
  const authHeader =
    req.headers["Authorization"] || req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send("Access denied. No token provided.");
  }

  const token = authHeader.split(" ")[1];
  try {
    const currentUser = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = currentUser;
    next();
  } catch (err) {
    return res.status(403).send("Invalid token.");
  }
};

module.exports = verifyToken;
