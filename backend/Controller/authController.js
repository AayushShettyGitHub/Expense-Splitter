require('dotenv').config();

const { sendResetEmail } = require('../config/sendMail');
const { generateToken } = require('../config/utils');
const { uploadImageToCloudinary } = require('./cloudinary');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Schema = require('../models/schema');
const { OAuth2Client } = require('google-auth-library');


const clientID = process.env.GOOGLE_CLIENT_ID;
const jwtSecret = process.env.JWT_SECRET;
const client = new OAuth2Client(clientID);

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await Schema.findOne({ email });

    if (!user || user.resetOTP !== otp || Date.now() > user.resetOTPExpiry) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    user.resetOTP = null;
    user.resetOTPExpiry = null;
    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify OTP', error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await Schema.findOne({ email });
    if (!user || Date.now() > user.resetOTPExpiry) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    
    user.password = newPassword;
   
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset password', error: error.message });
  }
};



exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await Schema.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Email not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); 
    const expiry = Date.now() + 10 * 60 * 1000; 

    user.resetOTP = otp;
    user.resetOTPExpiry = expiry;
    await user.save();

    await sendResetEmail(email, otp);

    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending OTP', error: error.message });
  }
};


exports.registerUser = async (req, res) => {
  const { name, email, password} = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await Schema.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

  

    const user = new Schema({ name, email, password });


    await user.save();

 
    const token = generateToken(user._id, res);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      
      },
    });
  } catch (err) {
    res.status(400).json({ error: 'Registration failed', details: err.message });
  }
};
/*
{
  "name": "Janer Doe",
  "email": "janer.doe@example.com",
  "password": "securepassword123",
  "age": 28,
  "profileImage": "https://picsum.photos/200/300" 
}*/
exports.updateUser = async (req, res) => {
  const {
    name,
    email,
    age,
    profileImage,
    description,
    nationality,
    address,
    phone,
    interest,
    profession
  } = req.body;

  try {
    const user = await Schema.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (age) user.age = age;
    if (description) user.description = description;
    if (nationality) user.nationality = nationality;
    if (address) user.address = address;
    if (phone) user.phone = phone;
    if (interest) user.interest = interest;
    if (profession) user.profession = profession;

    if (profileImage) {
      try {
        const uploadedImageUrl = await uploadImageToCloudinary(profileImage);
        user.profileImage = uploadedImageUrl;
      } catch (error) {
        return res.status(500).json({ message: 'Image upload failed', error: error.message });
      }
    }

    await user.save();

    res.status(200).json({
      message: 'User updated successfully',
      user: {
        name: user.name,
        email: user.email,
        age: user.age,
        profileImage: user.profileImage,
        description: user.description,
        nationality: user.nationality,
        address: user.address,
        phone: user.phone,
        interest: user.interest,
        profession: user.profession,
      },
    });
  } catch (error) {
    console.error('Update User Error:', error);
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
};


exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Schema.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id, res);

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        profileImage: user.profileImage,
      },
    });
  } catch (err) {
    res.status(400).json({ error: 'Login failed', details: err.message });
  }
};

exports.logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.googleSignIn = async (req, res) => {
  const { googleToken } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { name, email, picture } = payload;

    let user = await Schema.findOne({ email });

    if (!user) {
      
      const newUser = new Schema({
        name,
        email,
        googleId: payload.sub,
        profileImage: picture,
      });

      user = await newUser.save(); 
    }

    
    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(400).json({ error: 'Failed to authenticate with Google', details: err.message });
  }
};  