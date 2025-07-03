
const express = require('express');
const { registerUser,updateUser, loginUser, googleSignIn ,forgotPassword,resetPassword,verifyOtp} = require('../Controller/authController');
const {protect} = require('../middleware/protect');
const { addExpense,getExpenses } = require('../Controller/expenseController');
const {addBudget,getBudget,updateBudget,deleteBudget} = require('../Controller/budgetController');
const { createGroup,getMyGroups ,acceptInvite,getGroupById} = require('../Controller/groupController');
const router = express.Router();



// router.get("/protected-route", (req, res) => {
//   res.status(200).json({ message: "Welcome to the protected route!" });
// });


router.post('/register', registerUser);
router.post('/update',protect, updateUser);
router.post('/login', loginUser);
router.post('/google', googleSignIn);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-otp', verifyOtp);

router.post('/expenses', protect, addExpense); 
router.get('/getExpenses', protect, getExpenses);



router.post("/add", protect, addBudget);
router.get("/get", protect, getBudget);
router.put("/update/:id", protect, updateBudget);
router.delete("/delete/:id", protect, deleteBudget);

router.post("/create", protect,createGroup); 
router.get("/my-groups", protect, getMyGroups);
router.get("/groups/:groupId", protect,getGroupById );
router.post("/accept-invite/:groupId", protect, acceptInvite);



module.exports = router;
