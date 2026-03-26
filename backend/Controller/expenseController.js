const { Expense } = require('../models/schema');
const { processRecurringExpenses } = require('../services/recurringProcessor');

const getNextDate = (date, type) => {
  const next = new Date(date);
  switch (type) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      break;
  }
  return next;
};

const addExpense = async (req, res) => {
  try {
    const { amount, category, date, description, paymentMode } = req.body;

    if (!amount || !category) {
      return res.status(400).json({ message: 'Amount and category are required' });
    }

    const expense = new Expense({
      userId: req.userId,
      amount,
      category,
      date,
      description,
      paymentMode,
    });

    const savedExpense = await expense.save();
    res.status(201).json(savedExpense);
  } catch (error) {
    res.status(500).json({ message: 'Could not add expense' });
  }
};

const getExpenses = async (req, res) => {
  try {
    const { category, month, year } = req.query;
    const filter = { userId: req.userId };

    if (category) filter.category = { $regex: new RegExp(`^${category.trim()}$`, "i") };

    if (month && year) {
      const startDate = new Date(year, Number(month) - 1, 1);
      const endDate = new Date(year, Number(month), 0, 23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch expenses' });
  }
};

const addRecurringExpense = async (req, res) => {
  try {
    const userId = req.userId;
    const { amount, category, date, description, paymentMode, recurrenceType, endDate } = req.body;

    const startDate = date ? new Date(date) : new Date();
    const nextOccurrence = getNextDate(startDate, recurrenceType);

    const expense = new Expense({
      userId,
      amount,
      category,
      date: startDate,
      description,
      paymentMode,
      isRecurring: true,
      recurrenceType,
      endDate: endDate ? new Date(endDate) : null,
      nextOccurrence,
      isActive: true,
    });

    await expense.save();
    res.status(201).json({ message: 'Recurring expense set up successfully', expense });
  } catch (error) {
    res.status(500).json({ message: 'Could not set up recurring expense' });
  }
};

const getRecurringExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.userId, isRecurring: true });
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch recurring expenses' });
  }
};

const toggleRecurringExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense || !expense.isRecurring)
      return res.status(404).json({ message: 'Recurring expense not found' });

    expense.isActive = !expense.isActive;
    await expense.save();
    res.json({
      message: `Recurring expense ${expense.isActive ? 'resumed' : 'paused'} successfully`,
      expense,
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not update recurring expense' });
  }
};

const deleteRecurringExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense || !expense.isRecurring)
      return res.status(404).json({ message: 'Recurring expense not found' });

    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Recurring expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Could not delete recurring expense' });
  }
};

const processRecurring = async (req, res) => {
  try {
    await processRecurringExpenses();
    res.json({ message: "Recurring expenses processed" });
  } catch (err) {
    res.status(500).json({ message: "Error processing recurring expenses" });
  }
};

module.exports = {
  addExpense,
  getExpenses,
  addRecurringExpense,
  getRecurringExpenses,
  toggleRecurringExpense,
  deleteRecurringExpense,
  processRecurring,
};
