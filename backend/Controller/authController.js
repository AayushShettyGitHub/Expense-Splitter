require('dotenv').config();
const streamifier = require("streamifier");
const { generateToken } = require('../config/utils');
const { uploadImageToCloudinary } = require('./cloudinary');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/schema');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const strongPasswordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!strongPasswordRegex.test(password)) {
      return res.status(400).json({
        message: "Password must have letters, numbers, and a special character"
      });
    }

    const user = new User({ name, email, password });
    await user.save();

    const token = generateToken(user._id, res);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(400).json({ message: 'Could not complete registration' });
  }
};

exports.update = async (req, res) => {
  try {
    const userId = req.userId;
    const updates = { ...req.body };

    if (req.file) {
      const imageUrl = await uploadImageToCloudinary(req.file.buffer, "profile_images");
      updates.profileImage = imageUrl;
    }

    delete updates.password;
    delete updates.resetOTP;
    delete updates.resetOTPExpiry;
    delete updates.email;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password -resetOTP -resetOTPExpiry");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile" });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
   
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
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
    res.status(400).json({ message: 'Login failed' });
  }
};

exports.logout = (req, res) => {
  try {
    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: "strict",
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Logout failed" });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch user data" });
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

    let user = await User.findOne({ email });

    if (!user) {
      const newUser = new User({
        name,
        email,
        googleId: payload.sub,
        profileImage: picture,
      });

      user = await newUser.save();
    }

    const token = generateToken(user._id, res);

    res.status(200).json({ token, user });
  } catch (err) {
    res.status(400).json({ message: 'Google sign-in failed' });
  }
};
