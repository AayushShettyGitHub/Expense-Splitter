const Expense = require("../models/splitSchema");
const Group = require("../models/groupSchema");
const Settlement = require("../models/settlement");
const { User, Expense: Transaction } = require('../models/schema');

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

  
    const existingSettlement = await Settlement.findOne({ group: groupId }).sort({ createdAt: -1 });

    if (existingSettlement) {
      return res.status(200).json({ 
        message: "Settlement already exists", 
        settlements: existingSettlement.settlements,
        settlementEnded: existingSettlement.settlementEnded
      });
    }

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
  from: debtor.id,
  to: creditor.id,
  fromName: debtor.name,
  toName: creditor.name,
  amount: Math.round(amount),
  status: "pending"
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

    for (const s of settlements) {
      const fromUserId = s.from; 
      const toUserId = s.to;     

      const settlementExpense = new Transaction({
        userId: fromUserId,
        amount: s.amount,
        category: "Settlement",
        date: new Date(),
        description: `You paid ₹${s.amount} to ${s.toName}`,
        paymentMode: "Other",
      });

      await settlementExpense.save();
    }

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

  
    const latest = settlements[0];

    res.status(200).json({
      settlements: latest.settlements,
      settlementEnded: latest.settlementEnded,
    });
  } catch (err) {
    console.error("Error fetching settlements:", err.message);
    res.status(500).json({ message: "Failed to fetch settlements." });
  }
};


exports.markSettlementPaid = async (req, res) => {
  console.log("Marking settlement as paid");
  try {
    const { groupId, settlementId } = req.params;
    const userId = req.userId;

    console.log("Group ID:", groupId);
    console.log("Settlement ID:", settlementId);
    console.log("User ID:", userId);

    // Get the settlement doc for the group
    const settlementDoc = await Settlement.findOne({ group: groupId });
    if (!settlementDoc) {
      return res.status(404).json({ message: "Settlement document not found" });
    }

    // Find the specific settlement in the array
    const settlement = settlementDoc.settlements.id(settlementId);
    if (!settlement) {
      return res.status(404).json({ message: "Settlement not found" });
    }

    // Ensure only the receiver can mark as paid
    if (settlement.to.toString() !== userId) {
      return res.status(403).json({
        message: "You are not authorized to mark this settlement as paid"
      });
    }

    // Mark settlement as paid
    settlement.status = "paid";
    settlement.updatedAt = new Date();

    // If all settlements are paid, mark settlementEnded as true
    const allPaid = settlementDoc.settlements.every(s => s.status === "paid");
    if (allPaid) {
      settlementDoc.settlementEnded = true;
    }

    await settlementDoc.save();

    res.status(200).json({
      message: "Settlement marked as paid",
      settlement,
      settlementEnded: settlementDoc.settlementEnded
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
