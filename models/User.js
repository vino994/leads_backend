const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: { 
      type: String, 
      unique: true, 
      required: true 
    },

    password: { 
      type: String, 
      required: true 
    },

    plan: { 
      type: String, 
      enum: ["free", "pro", "premium"], 
      default: "free" 
    },

    monthlyLeadsUsed: { 
      type: Number, 
      default: 0 
    },

    monthlyResetDate: { 
      type: Date, 
      default: Date.now 
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);