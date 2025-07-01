const jwt = require("jsonwebtoken");

exports.protect = (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded JWT:", decoded);
req.userId = decoded.userId; // ✅ Fix this line

    next();
  } catch (error) {
    res.status(403).json({ message: "Unauthorized: Invalid token" });
  }
};
