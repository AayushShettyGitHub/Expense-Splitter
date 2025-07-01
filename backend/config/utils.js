const jwt = require("jsonwebtoken");
require('dotenv').config();

exports.generateToken = (userId, res) => {
  console.log("JWT_SECRET is:", process.env.JWT_SECRET);
  console.log("Generating token for userId:", userId);


  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
 console.log("JWT_SECRET is:", process.env.JWT_SECRET);
  console.log("Generating token for userId:", userId);
  res.cookie("jwt", token, {
    maxAge: 24 * 60 * 60 * 1000, 
    httpOnly: true,
    sameSite: "none"   
  
  });

  return token;
};