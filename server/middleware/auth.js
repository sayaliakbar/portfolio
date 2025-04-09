const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Auth middleware
const authMiddleware = async (req, res, next) => {
  // Get token from header
  const token = req.header("x-auth-token");

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Set user data from decoded token
    req.user = decoded.user;

    // Optionally verify that the user still exists in the database
    const userExists = await User.exists({ _id: req.user.id });
    if (!userExists) {
      return res.status(401).json({ msg: "User no longer exists" });
    }

    next();
  } catch (err) {
    console.error("Token verification error:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ msg: "Token has expired" });
    }

    return res.status(401).json({ msg: "Token is not valid" });
  }
};

module.exports = authMiddleware;
