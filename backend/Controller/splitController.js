const Expense = require("../models/splitSchema");
const Group = require("../models/groupSchema");
const User = require("../models/schema"); // Optional: if validating paidBy/splitBetween

exports.addExpenseGroup = async (req, res) => {
  const { groupId } = req.params;
  const { description, amount, paidBy, splitBetween } = req.body;

  console.log("🔁 [addExpenseGroup] Incoming request:");
  console.log("Group ID:", groupId);
  console.log("Body:", { description, amount, paidBy, splitBetween });

  if (!description || !amount || !paidBy || !Array.isArray(splitBetween) || splitBetween.length === 0) {
    console.warn("⚠️ [addExpenseGroup] Missing or invalid fields");
    return res.status(400).json({ message: "Missing or invalid fields" });
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      console.warn("❌ [addExpenseGroup] Group not found:", groupId);
      return res.status(404).json({ message: "Group not found" });
    }

    // Optional User validation logs
    // const payer = await User.findById(paidBy);
    // const validSplitUsers = await User.find({ _id: { $in: splitBetween } });

    const expense = new Expense({
      group: groupId,
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
