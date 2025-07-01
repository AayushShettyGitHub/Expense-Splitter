
const { Expense } = require('../models/schema');



const addExpense = async (req, res) => {
  try {
    const { amount, category, date, description, paymentMode } = req.body;

    if (!amount || !category) {
      return res.status(400).json({ message: 'Amount and category are required.' });
    }

   const expense = new Expense({
  userId: req.userId, 
  amount,
  category,
  date,
  description,
  paymentMode,
});

console.log("Creating expense for userId:", req.userId);

    const savedExpense = await expense.save();
    res.status(201).json(savedExpense);
  } catch (error) {
    console.error("Error adding expense:", error);
    res.status(500).json({ message: 'Server error. Could not add expense.' });
  }
};

const getExpenses = async (req, res) => {
  try {
    const { category, month, year } = req.query;

    const filter = { userId: req.userId };

    if (category) {
      filter.category = category;
    }

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });

    res.status(200).json(expenses);
  } catch (error) {
    console.error("Error fetching filtered expenses:", error);
    res.status(500).json({ message: 'Server error. Could not fetch expenses.' });
  }
};



module.exports = { addExpense , getExpenses };
