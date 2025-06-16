const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { uploadImageToCloudinary } = require('../Controller/cloudinary'); 

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    match: [/.+@.+\..+/, 'Please provide a valid email address'],
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters long'],
  },
  googleId: {
    type: String,
  },
  profileImage: {
    type: String,
    default: '',
  },
  age: {
    type: Number,
    min: [18, 'You must be at least 18 years old to sign up'],
  },


  description: {
    type: String,
    default: '',
    trim: true,
  },
  nationality: {
    type: String,
    default: '',
    trim: true,
  },
  address: {
    type: String,
    default: '',
    trim: true,
  },
  phone: {
    type: String,
    default: '',
    trim: true,
  },
  interest: {
    type: String,
    default: '',
    trim: true,
  },
  profession: {
    type: String,
    default: '',
    trim: true,
  },

  resetOTP: String,
  resetOTPExpiry: Date,
}, {
  timestamps: true,
});

UserSchema.pre('save', async function (next) {
  if (this.password && this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  next();
});


module.exports = mongoose.model('User', UserSchema);
