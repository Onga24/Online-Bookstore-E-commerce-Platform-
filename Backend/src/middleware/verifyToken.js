import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  console.log("Cookies:", req.cookies);
  const token =
    req.cookies.token || req.headers["Authorization"]?.split(" ")[1];
  console.log("Token found:", token);
  console.log("Loaded JWT_SECRET_KEY:", process.env.JWT_SECRET_KEY);

  if (!token) {
    return res.status(401).send("Unauthorized: No token provided");
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!decoded) {
      return res.status(403).send("Forbidden: Invalid token");
    }
    req.userId = decoded.id;
    next();
  } catch (err) {
    console.error("Error verifying token:", err);
    res.status(403).send("Forbidden: Invalid token");
  }
};

export default verifyToken;
