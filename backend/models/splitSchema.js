const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  splitBetween: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Split", expenseSchema);
