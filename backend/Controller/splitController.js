const Expense = require("../models/splitSchema");
const Group = require("../models/groupSchema");
const User = require("../models/schema"); 
const Settlement = require("../models/settlement");

exports.addExpenseGroup = async (req, res) => {
  const { id } = req.params;
  const { description, amount, paidBy, splitBetween } = req.body;

  console.log("🔁 [addExpenseGroup] Incoming request:");
  console.log("Group ID:", id);
  console.log("Body:", { description, amount, paidBy, splitBetween });

  if (!description || !amount || !paidBy || !Array.isArray(splitBetween) || splitBetween.length === 0) {
    console.warn("⚠️ [addExpenseGroup] Missing or invalid fields");
    return res.status(400).json({ message: "Missing or invalid fields" });
  }

  try {
    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }



    const expense = new Expense({
      group: id,
      description,
      amount,
      paidBy,
      splitBetween,
    });

    await expense.save();

    console.log("✅ [addExpenseGroup] Expense saved successfully:", expense);

    res.status(201).json({ message: "Expense added successfully", expense });
  } catch (err) {
    console.error("❌ [addExpenseGroup] Error:", err);
    res.status(500).json({ message: "Failed to add expense", error: err.message });
  }
};


exports.getExpensesByGroup = async (req, res) => {
  const { groupId } = req.params;

  try {
    const expenses = await Expense.find({ group: groupId })
      .populate("paidBy", "name email")
      .populate("splitBetween", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(expenses);
  } catch (err) {
    console.error("Fetch Expenses Error:", err);
    res.status(500).json({ message: "Failed to fetch expenses", error: err.message });
  }
};



exports.getOptimizedSettlements = async (req, res) => {
  const { groupId } = req.params;

  try {
    console.log("🔍 Checking for existing settlements");

    // ✅ Check if a settlement already exists
    const existingSettlement = await Settlement.findOne({ group: groupId }).sort({ createdAt: -1 });

    if (existingSettlement) {
      return res.status(200).json({ 
        message: "Settlement already exists", 
        settlements: existingSettlement.settlements,
        settlementEnded: existingSettlement.settlementEnded
      });
    }

    // ✅ If no settlement, calculate it
    const expenses = await Expense.find({ group: groupId })
      .populate("paidBy", "_id name")
      .populate("splitBetween", "_id name");

    if (!expenses.length) {
      return res.status(404).json({ message: "No expenses found for this group" });
    }

    const netBalance = {};

    expenses.forEach((expense) => {
      const amountPerPerson = expense.amount / expense.splitBetween.length;

      expense.splitBetween.forEach((user) => {
        if (!netBalance[user._id]) {
          netBalance[user._id] = { balance: 0, name: user.name };
        }
        netBalance[user._id].balance -= amountPerPerson;
      });

      const payer = expense.paidBy;
      if (!netBalance[payer._id]) {
        netBalance[payer._id] = { balance: 0, name: payer.name };
      }
      netBalance[payer._id].balance += expense.amount;
    });

    const debtors = [], creditors = [];

    for (const [id, { balance, name }] of Object.entries(netBalance)) {
      if (balance < -0.01) debtors.push({ id, name, balance });
      else if (balance > 0.01) creditors.push({ id, name, balance });
    }

    const settlements = [];

    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(-debtor.balance, creditor.balance);

      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: Math.round(amount),
        status: "pending", // ✅ Default status
      });

      debtor.balance += amount;
      creditor.balance -= amount;

      if (Math.abs(debtor.balance) < 0.01) i++;
      if (Math.abs(creditor.balance) < 0.01) j++;
    }

    const saved = new Settlement({
      group: groupId,
      settlements,
      settlementEnded: false,
    });

    await saved.save();

    res.status(200).json({ 
      message: "Settlements calculated and stored", 
      settlements: saved.settlements,
      settlementEnded: saved.settlementEnded
    });
  } catch (err) {
    console.error("❌ Error in getOptimizedSettlements:", err);
    res.status(500).json({ message: "Failed to compute settlements", error: err.message });
  }
};


exports.getSettlementsByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const settlements = await Settlement.find({ group: groupId }).sort({ createdAt: -1 });

    if (!settlements || settlements.length === 0) {
      return res.status(404).json({ message: "No settlements found for this group." });
    }

    // Return the latest one only, assuming only one active settlement at a time
    const latest = settlements[0];

    res.status(200).json({
      settlements: latest.settlements,
      settlementEnded: latest.settlementEnded,
    });
  } catch (err) {
    console.error("❌ Error fetching settlements:", err.message);
    res.status(500).json({ message: "Failed to fetch settlements." });
  }
};

// routes/settlement.js
exports.markSettlements= async (req, res) => {
  try {
    const { groupId } = req.params;
    const { from, to } = req.body;

    const settlement = await Settlement.findOne({ group: groupId }).sort({ createdAt: -1 });
    if (!settlement) return res.status(404).json({ message: "Settlement not found" });

    // Update specific settlement transaction status
    const transaction = settlement.settlements.find(
      s => s.from === from && s.to === to && s.status === "pending"
    );

    if (!transaction) return res.status(404).json({ message: "Transaction not found or already completed" });

    transaction.status = "completed";

    // Check if all are completed
    const allDone = settlement.settlements.every(s => s.status === "completed");
    settlement.settlementEnded = allDone;

    await settlement.save();

    res.status(200).json({ message: "Transaction marked as completed", settlement });
  } catch (err) {
    console.error("❌ Error updating settlement:", err.message);
    res.status(500).json({ message: "Failed to update settlement status." });
  }
};
