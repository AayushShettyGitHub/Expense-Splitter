const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    name: { type: String, required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    startDate: Date,
    endDate: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", EventSchema);
