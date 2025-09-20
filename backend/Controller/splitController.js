const Expense = require("../models/splitSchema");
const Group = require("../models/groupSchema");
const Settlement = require("../models/settlement");
const { User, Expense: Transaction } = require('../models/schema');
const Event = require("../models/Event");


exports.addExpenseEvent = async (req, res) => {
  const { eventId } = req.params;
  const { description, amount, paidBy, splitBetween } = req.body;

  if (!description || !amount || !paidBy || !Array.isArray(splitBetween) || splitBetween.length === 0) {
    return res.status(400).json({ message: "Missing or invalid fields" });
  }

  try {
    const event = await Event.findById(eventId).populate("members", "_id");
    if (!event) return res.status(404).json({ message: "Event not found" });

    const isMember = event.members.some(m => m._id.toString() === req.userId.toString());
    if (!isMember) return res.status(403).json({ message: "You are not a member of this event" });

    const expense = new Expense({
      event: eventId,
      description,
      amount,
      paidBy,
      splitBetween,
    });

    await expense.save();

    res.status(201).json({ message: "Expense added successfully", expense });
  } catch (err) {
    console.error("Error adding expense:", err);
    res.status(500).json({ message: "Failed to add expense", error: err.message });
  }
};

exports.getEventById = async (req, res) => {
  const { eventId } = req.params;

  try {
    const event = await Event.findById(eventId).populate("members", "_id");
    if (!event) return res.status(404).json({ message: "Event not found" });

    const isMember = event.members.some(m => m._id.toString() === req.userId.toString());
    if (!isMember) return res.status(403).json({ message: "You are not a member of this event" });

    res.status(200).json(event);
  } catch (err) {
    console.error("Error fetching event:", err);
    res.status(500).json({ message: "Failed to fetch event", error: err.message });
  }
};

exports.getExpensesByEvent = async (req, res) => {
  const { eventId } = req.params;

  try {
    const event = await Event.findById(eventId).populate("members", "_id");
    if (!event) return res.status(404).json({ message: "Event not found" });

    const isMember = event.members.some(m => m._id.toString() === req.userId.toString());
    if (!isMember) return res.status(403).json({ message: "You are not a member of this event" });

    const expenses = await Expense.find({ event: eventId })
      .populate("paidBy", "name email")
      .populate("splitBetween", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(expenses);
  } catch (err) {
    console.error("Error fetching expenses:", err);
    res.status(500).json({ message: "Failed to fetch expenses", error: err.message });
  }
};

exports.getOptimizedEventSettlements = async (req, res) => {
  const { eventId } = req.params;

  try {
    const event = await Event.findById(eventId).populate("members", "_id");
    if (!event) return res.status(404).json({ message: "Event not found" });

    const isMember = event.members.some(m => m._id.toString() === req.userId.toString());
    if (!isMember) return res.status(403).json({ message: "You are not a member of this event" });

    const existingSettlement = await Settlement.findOne({ event: eventId }).sort({ createdAt: -1 });
    if (existingSettlement) {
      return res.status(200).json({ 
        message: "Settlement already exists", 
        settlements: existingSettlement.settlements,
        settlementEnded: existingSettlement.settlementEnded
      });
    }

    const expenses = await Expense.find({ event: eventId })
      .populate("paidBy", "_id name")
      .populate("splitBetween", "_id name");

    if (!expenses.length) return res.status(404).json({ message: "No expenses found for this event" });

    const netBalance = {};
    expenses.forEach(exp => {
      const amountPerPerson = exp.amount / exp.splitBetween.length;
      exp.splitBetween.forEach(user => {
        if (!netBalance[user._id]) netBalance[user._id] = { balance: 0, name: user.name };
        netBalance[user._id].balance -= amountPerPerson;
      });

      const payer = exp.paidBy;
      if (!netBalance[payer._id]) netBalance[payer._id] = { balance: 0, name: payer.name };
      netBalance[payer._id].balance += exp.amount;
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
      event: eventId,
      settlements,
      settlementEnded: false,
    });

    await saved.save();

    for (const s of settlements) {
      const settlementExpense = new Transaction({
        userId: s.from,
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
    console.error("Error in getOptimizedEventSettlements:", err);
    res.status(500).json({ message: "Failed to compute settlements", error: err.message });
  }
};

exports.markEventSettlementPaid = async (req, res) => {
  const { eventId, settlementId } = req.params;
  const userId = req.userId;

  try {
    const event = await Event.findById(eventId).populate("members", "_id");
    if (!event) return res.status(404).json({ message: "Event not found" });

    const isMember = event.members.some(m => m._id.toString() === userId.toString());
    if (!isMember) return res.status(403).json({ message: "You are not a member of this event" });

    const settlementDoc = await Settlement.findOne({ event: eventId });
    if (!settlementDoc) return res.status(404).json({ message: "Settlement not found" });

    const settlement = settlementDoc.settlements.id(settlementId);
    if (!settlement) return res.status(404).json({ message: "Settlement not found" });

    if (settlement.to.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to mark as paid" });
    }

    settlement.status = "paid";
    settlement.updatedAt = new Date();

    settlementDoc.settlementEnded = settlementDoc.settlements.every(s => s.status === "paid");

    await settlementDoc.save();
    res.status(200).json({ message: "Settlement marked as paid", settlement, settlementEnded: settlementDoc.settlementEnded });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getSettlementsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId).populate("members", "_id");
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const isMember = event.members.some(m => m._id.toString() === req.userId.toString());
    if (!isMember) return res.status(403).json({ message: "You are not a member of this event" });

    const settlements = await Settlement.find({ event: eventId }).sort({ createdAt: -1 }).lean();

    if (!settlements || settlements.length === 0) {
      return res.status(200).json({ settlements: [], settlementEnded: false });
    }

    const latest = settlements[0] || {};
    return res.status(200).json({
      settlements: Array.isArray(latest.settlements) ? latest.settlements : [],
      settlementEnded: !!latest.settlementEnded,
    });
  } catch (err) {
    console.error("Error fetching settlements:", err);
    return res.status(500).json({ message: "Failed to fetch settlements." });
  }
};
