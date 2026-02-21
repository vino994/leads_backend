require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { connectRedis } = require("./config/redis");
const authRoutes = require("./routes/authRoutes");
const leadRoutes = require("./routes/leadRoutes");

const app = express();

// ---------------- GLOBAL MIDDLEWARE ----------------
app.use(cors({
  origin: ["http://localhost:5173", "https://your-frontend-url.vercel.app"],
  credentials: true
}));
app.use(express.json());

// ---------------- RATE LIMITER ----------------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, try again later"
});

// ---------------- ROUTES ----------------
app.use("/api/auth", authRoutes);
app.use("/api/leads", limiter, leadRoutes);

app.get("/test", (req, res) => {
  res.json({ message: "Server working fine" });
});

// ---------------- DB CONNECTION ----------------
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected");
    await connectRedis();
  })
  .catch(err => console.log(err));

// ---------------- SERVER START ----------------
const PORT = process.env.PORT || 8001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));