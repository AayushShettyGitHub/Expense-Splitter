const Expense = require("../models/splitSchema");
const Group = require("../models/groupSchema");
const Settlement = require("../models/settlement");
const { User, Expense: Transaction } = require('../models/schema');
const Event = require("../models/Event");

exports.addExpenseEvent = async (req, res) => {
  const { eventId } = req.params;
  const { description, amount, paidBy, splitBetween } = req.body;

  if (!description || !amount || !paidBy || !Array.isArray(splitBetween) || splitBetween.length === 0) {
    return res.status(400).json({ message: "Invalid expense data" });
  }

  try {
    const event = await Event.findById(eventId).populate("members", "_id");
    if (!event) return res.status(404).json({ message: "Trip not found" });

    const isMember = event.members.some(m => m._id.toString() === req.userId.toString());
    if (!isMember) return res.status(403).json({ message: "Not a member of this trip" });

    const expense = new Expense({
      event: eventId,
      description,
      amount,
      paidBy,
      splitBetween,
    });

    await expense.save();
    res.status(201).json({ message: "Expense logged successfully", expense });
  } catch (err) {
    res.status(500).json({ message: "Failed to log expense" });
  }
};

exports.getEventById = async (req, res) => {
  const { eventId } = req.params;

  try {
    const event = await Event.findById(eventId).populate("members", "_id");
    if (!event) return res.status(404).json({ message: "Trip not found" });

    const isMember = event.members.some(m => m._id.toString() === req.userId.toString());
    if (!isMember) return res.status(403).json({ message: "Access denied to this trip" });

    res.status(200).json(event);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving trip particulars" });
  }
};

exports.getExpensesByEvent = async (req, res) => {
  const { eventId } = req.params;

  try {
    const event = await Event.findById(eventId).populate("members", "_id");
    if (!event) return res.status(404).json({ message: "Trip not found" });

    const isMember = event.members.some(m => m._id.toString() === req.userId.toString());
    if (!isMember) return res.status(403).json({ message: "Access denied" });

    const expenses = await Expense.find({ event: eventId })
      .populate("paidBy", "name email")
      .populate("splitBetween", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(expenses);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch trip history" });
  }
};

exports.getOptimizedEventSettlements = async (req, res) => {
  const { eventId } = req.params;

  try {
    const event = await Event.findById(eventId).populate("members", "_id");
    if (!event) return res.status(404).json({ message: "Trip not found" });

    const isMember = event.members.some(m => m._id.toString() === req.userId.toString());
    if (!isMember) return res.status(403).json({ message: "Unauthorized access" });

    const existingBatch = await Settlement.findOne({ event: eventId, settlementEnded: false }).sort({ createdAt: -1 });
    if (existingBatch && existingBatch.settlements.length > 0) {
      return res.status(200).json({ 
        message: "Settlement calculation in progress", 
        settlements: existingBatch.settlements,
        settlementEnded: false
      });
    }

    const expenses = await Expense.find({ event: eventId, settled: false })
      .populate("paidBy", "_id name")
      .populate("splitBetween", "_id name");

    if (!expenses.length) return res.status(404).json({ message: "Nothing to settle" });

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

    if (settlements.length === 0) {
      await Expense.updateMany(
        { _id: { $in: expenses.map(e => e._id) } },
        { $set: { settled: true } }
      );
      return res.status(200).json({ 
        message: "Expenses settled internally. No transactions required.", 
        settlements: [],
        settlementEnded: true
      });
    }

    const saved = new Settlement({
      event: eventId,
      settlements,
      settlementEnded: false,
    });

    await saved.save();

    await Expense.updateMany(
      { _id: { $in: expenses.map(e => e._id) } },
      { $set: { settled: true } }
    );

    res.status(200).json({ 
      message: "Settlements computed successfully", 
      settlements: saved.settlements,
      settlementEnded: saved.settlementEnded
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to compute settlements" });
  }
};

exports.markEventSettlementPaid = async (req, res) => {
  const { eventId, settlementId } = req.params;
  const userId = req.userId;

  try {
    const event = await Event.findById(eventId).populate("members", "_id");
    if (!event) return res.status(404).json({ message: "Trip not found" });

    const isMember = event.members.some(m => m._id.toString() === userId.toString());
    if (!isMember) return res.status(403).json({ message: "Unauthorized member" });

    const settlementDoc = await Settlement.findOne({
      event: eventId,
      "settlements._id": settlementId
    });
    if (!settlementDoc) return res.status(404).json({ message: "Settlement record not found" });

    const settlement = settlementDoc.settlements.id(settlementId);
    if (!settlement) return res.status(404).json({ message: "Transaction not found" });

    if (settlement.status === "paid") {
      return res.status(400).json({ message: "This transaction is already marked as paid" });
    }

    const group = await Group.findOne({ members: userId, _id: event.group });
    const isAdmin = group?.admin?.toString() === userId.toString();

    if (String(settlement.to) !== String(userId) && !isAdmin) {
      return res.status(403).json({ message: "No permission to mark this paid" });
    }

    settlement.status = "paid";
    settlement.updatedAt = new Date();
    settlementDoc.settlementEnded = settlementDoc.settlements.every(s => s.status === "paid");

    await settlementDoc.save();

    const debtorRecord = new Transaction({
      userId: settlement.from,
      amount: settlement.amount,
      category: "Settlement",
      date: new Date(),
      description: `Paid ₹${settlement.amount} to ${settlement.toName} (Settlement)`,
      paymentMode: "Other",
    });
    await debtorRecord.save();

    const creditorRecord = new Transaction({
      userId: settlement.to,
      amount: settlement.amount,
      category: "Settlement",
      date: new Date(),
      description: `Received ₹${settlement.amount} from ${settlement.fromName} (Settlement)`,
      paymentMode: "Other",
    });
    await creditorRecord.save();

    res.status(200).json({ message: "Payment confirmed", settlement, settlementEnded: settlementDoc.settlementEnded });
  } catch (err) {
    res.status(500).json({ message: "Failed to confirm payment" });
  }
};

exports.getSettlementsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId).populate("members", "_id");
    if (!event) return res.status(404).json({ message: "Trip not found" });

    const isMember = event.members.some(m => m._id.toString() === req.userId.toString());
    if (!isMember) return res.status(403).json({ message: "Access forbidden" });

    const settlements = await Settlement.find({ event: eventId }).sort({ createdAt: -1 }).lean();

    if (!settlements || settlements.length === 0) {
      return res.status(200).json({ settlementCycles: [], allSettled: false });
    }

    const allSettled = settlements.every(s => s.settlementEnded);

    return res.status(200).json({
      settlementCycles: settlements,
      allSettled
    });
  } catch (err) {
    return res.status(500).json({ message: "Retrieval failed" });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { eventId, expenseId } = req.params;
    const expense = await Expense.findById(expenseId);
    if (!expense) return res.status(404).json({ message: "Expense entry not found" });

    const event = await Event.findById(eventId);
    const group = await Group.findById(event.group);
    
    if (expense.paidBy.toString() !== req.userId && group.admin.toString() !== req.userId) {
      return res.status(403).json({ message: "Deletion unauthorized" });
    }

    if (expense.settled) {
      return res.status(400).json({ message: "Settled expenses cannot be deleted" });
    }

    await Expense.findByIdAndDelete(expenseId);
    res.json({ message: "Expense record deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete expense entry" });
  }
};
