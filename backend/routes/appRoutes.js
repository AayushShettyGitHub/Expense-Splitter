const express = require('express');
const router = express.Router();
const { 
  registerUser, update, loginUser, googleSignIn, forgotPassword,
  resetPassword, verifyOtp, getCurrentUser, logout 
} = require('../Controller/authController');
const { protect } = require('../middleware/protect');
const { addExpense, getExpenses } = require('../Controller/expenseController');
const { 
  addExpenseEvent, getExpensesByEvent, getOptimizedEventSettlements,
  getSettlementsByEvent, markEventSettlementPaid,getEventById
} = require('../Controller/splitController'); 
const { addBudget, getBudget, updateBudget, deleteBudget } = require('../Controller/budgetController');
const { 
  createGroup, getMyGroups, acceptInvite, getGroupById, sendInvite, kickUser ,createEvent, getEventsByGroup,setActiveEvent,
  removeActiveEvent,
  getActiveEvents,getUserActiveEvents ,setTargetEvent
} = require('../Controller/groupController');
const { handleAssistantQuery } = require('../services/gemini');
const { upload } = require('../middleware/multer');

// Authentication routes
router.post('/register', registerUser);
router.put("/update", protect, upload.single("profileImage"), update);
router.post('/login', loginUser);
router.post('/google', googleSignIn);
router.get('/getUser', protect, getCurrentUser);
router.post('/logout', protect, logout);

// Personal Expenses routes
router.post('/expenses', protect, addExpense); 
router.get('/getExpenses', protect, getExpenses);

// Budget routes
router.post("/add", protect, addBudget);
router.get("/get", protect, getBudget);
router.put("/update/:id", protect, updateBudget);
router.delete("/delete/:id", protect, deleteBudget);

// Group routes
router.post("/create", protect, createGroup); 
router.get("/my-groups", protect, getMyGroups);
router.get("/groups/:id", protect, getGroupById );
router.post("/accept-invite/:id", protect, acceptInvite);
router.post("/send-invite/:id", protect, sendInvite);
router.post('/kick/:groupId/:userId', protect, kickUser);
router.post("/groups/:groupId/events/:eventId/active", protect,setActiveEvent); // set active event
router.delete("/groups/:groupId/events/:eventId/active",protect, removeActiveEvent); // remove active event
router.get("/groups/:groupId/events/active", getActiveEvents); // list active events
router.get("/user/active-events", protect, getUserActiveEvents);
router.patch("/target/:eventId", protect, setTargetEvent);

// Event routes 
router.post("/group/:groupId/event", protect, createEvent);
router.get("/group/:groupId/events", protect, getEventsByGroup);

// Event-based expense and settlement routes
router.post("/event/:eventId/expense", protect, addExpenseEvent);
router.get("/event/:eventId", protect, getEventById);
router.get("/event/:eventId/expenses", protect, getExpensesByEvent);
router.get("/event/:eventId/settlements", protect, getOptimizedEventSettlements);
router.get("/event/settlements/:eventId", protect, getSettlementsByEvent);
router.patch("/event/mark-paid/:eventId/:settlementId", protect, markEventSettlementPaid);

// Assistant routes
router.post("/ask", protect, handleAssistantQuery);

module.exports = router;
