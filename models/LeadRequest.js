const mongoose = require("mongoose");

const leadRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    location: String,
    businessType: String,
    count: Number,
    leads: [
      {
        Name: String,
        Phone: String,
        Address: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("LeadRequest", leadRequestSchema);
