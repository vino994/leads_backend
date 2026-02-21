require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { connectRedis } = require("./config/redis");

const authRoutes = require("./routes/authRoutes");
const leadRoutes = require("./routes/leadRoutes");

const app = express();

/* ---------------- CORS CONFIG ---------------- */

const allowedOrigins = [
  "http://localhost:5173",
  "https://jleeds.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser requests

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

/* IMPORTANT: Handle preflight requests */
app.options("*", cors());

/* ---------------- GLOBAL MIDDLEWARE ---------------- */

app.use(express.json());

/* ---------------- RATE LIMITER ---------------- */

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, try again later"
});

/* ---------------- ROUTES ---------------- */

app.use("/api/auth", authRoutes);
app.use("/api/leads", limiter, leadRoutes);

app.get("/test", (req, res) => {
  res.json({ message: "Server working fine" });
});

app.get("/", (req, res) => {
  res.send("Lead SaaS Backend Live 🚀");
});

/* ---------------- DB CONNECTION ---------------- */

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected");
   if (process.env.REDIS_URL) {
  await connectRedis();
}
    console.log("Redis Connected");
  })
  .catch(err => console.log(err));

/* ---------------- SERVER START ---------------- */

const PORT = process.env.PORT || 8001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});