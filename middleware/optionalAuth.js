const jwt = require("jsonwebtoken");

const JWT_TOKEN_KEY = process.env.JWT_TOKEN_KEY;

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header("x-auth-token");
    if (!token) return next();

    const verified = jwt.verify(token, JWT_TOKEN_KEY);
    if (!verified) return next();

    req.user = verified.id;
    req.token = token;
    next();
  } catch (err) {
    // Invalid token = treat as guest
    next();
  }
};

module.exports = optionalAuth;
