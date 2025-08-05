const Budget = require("../models/budgetSchema");

// POST /budget/add
exports.addBudget = async (req, res) => {
  console.log("Yooooooo add")
  const { month, year, amount } = req.body;

  try {
    const parsedMonth = parseInt(month, 10);
    const parsedYear = parseInt(year, 10);

    const existing = await Budget.findOne({
      userId: req.userId,
      month: parsedMonth,
      year: parsedYear,
    });

    if (existing) {
      return res.status(400).json({ message: "Budget already exists for this month." });
    }

    const budget = new Budget({
      userId: req.userId,
      month: parsedMonth,
      year: parsedYear,
      amount,
    });

    await budget.save();
    res.status(201).json(budget);
  } catch (error) {
    console.error("Error adding budget:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// GET /budget/get?month=6&year=2025
exports.getBudget = async (req, res) => {
  console.log("Yooooooo get")
  const userId = req.userId;    
  const { month, year } = req.query;

  try {
    const budget = await Budget.findOne({
      userId,
      month: parseInt(month),
      year: parseInt(year),
    });

    if (!budget) {
      return res.status(404).json({ message: "No budget found" });
    }

    res.status(200).json({
      _id: budget._id,
      amount: budget.amount,
      month: budget.month,
      year: budget.year,
    });
  } catch (err) {
    console.error("🔥 Error in getBudget:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};


// PUT /budget/update/:id
exports.updateBudget = async (req, res) => {
  console.log("Yooooooo update")
  const { id } = req.params;
  const { amount } = req.body;

  try {
    const updated = await Budget.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { amount },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Budget not found" });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating budget:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /budget/delete/:id
exports.deleteBudget = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Budget.findOneAndDelete({ _id: id, userId: req.userId });

    if (!deleted) {
      return res.status(404).json({ message: "Budget not found" });
    }

    res.status(200).json({ message: "Budget deleted successfully" });
  } catch (error) {
    console.error("Error deleting budget:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// PUT /budget/update/:id
exports.updateBudget = async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  try {
    const updated = await Budget.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { amount },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Budget not found" });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating budget:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /budget/delete/:id
exports.deleteBudget = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Budget.findOneAndDelete({ _id: id, userId: req.userId });

    if (!deleted) {
      return res.status(404).json({ message: "Budget not found" });
    }

    res.status(200).json({ message: "Budget deleted successfully" });
  } catch (error) {
    console.error("Error deleting budget:", error);
    res.status(500).json({ message: "Server error" });
  }
};
