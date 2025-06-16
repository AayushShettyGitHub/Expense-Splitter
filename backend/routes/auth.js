
const express = require('express');
const { registerUser,updateUser, loginUser, googleSignIn ,forgotPassword,resetPassword,verifyOtp} = require('../Controller/authController');


const router = express.Router();



// router.get("/protected-route", (req, res) => {
//   res.status(200).json({ message: "Welcome to the protected route!" });
// });


router.post('/register', registerUser);
router.post('/update', updateUser);
router.post('/login', loginUser);
router.post('/google', googleSignIn);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-otp', verifyOtp);


module.exports = router;
