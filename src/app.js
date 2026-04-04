import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/task.routes.js";

const app = express();


// 🔹 CORS
app.use(
  cors({
    origin: "*", // in production use whitelist
    credentials: true,
  })
);

// 🔹 Security headers
app.use(helmet());

// 🔹 Compression
app.use(compression());

// 🔹 Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // limit each IP
});
app.use(limiter);

// 🔹 Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔹 Cookies
app.use(cookieParser());


// 🔹 Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);


// 🔹 Health check (nice to have)
app.get("/", (req, res) => {
  res.send("API is running...");
});

export default app;