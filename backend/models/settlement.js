const mongoose = require("mongoose");

// Settlement.js (Mongoose model)
const settlementSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
  },
  settlements: [
    {
      from: String,
      to: String,
      amount: Number,
      status: {
        type: String,
        enum: ["pending", "completed"],
        default: "pending",
      },
    },
  ],
  settlementEnded: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model("Settlement", settlementSchema);

