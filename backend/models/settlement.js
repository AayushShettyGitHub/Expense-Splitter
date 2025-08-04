const mongoose = require("mongoose");

const individualSettlementSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fromName: {
    type: String,
  },
  toName: {
    type: String,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending",
  },
});

const settlementSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    settlements: [individualSettlementSchema],
    settlementEnded: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settlement", settlementSchema);
