const jwt = require("jsonwebtoken");

exports.generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  res.cookie("jwt", token, {
    maxAge: 24 * 60 * 60 * 1000, 
    httpOnly: true,
    sameSite: "none"   
  
  });

  return token;
};