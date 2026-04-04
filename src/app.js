import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/task.routes.js";
import { swaggerDocs } from "./config/swagger.js";
const app = express();

// CORS - ⚠️ allow localhost for credentials
app.use(cors({
  origin: "http://localhost:3000", 
  credentials: true
}));

app.use(helmet());
app.use(compression());

const limiter = rateLimit({ windowMs: 15*60*1000, max: 100 });
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// Swagger docs
swaggerDocs(app, 3000);

app.get("/", (req, res) => res.send("API is running..."));

export default app;