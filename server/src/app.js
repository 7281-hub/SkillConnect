import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import connectionRoutes from "./routes/connectionRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import workerProfileRoutes from "./modules/worker-profile/workerProfileRoutes.js";
import jobRoutes from "./modules/employer-jobs/jobRoutes.js";
const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
    ],
  })
);

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/worker-profile", workerProfileRoutes);
app.use("/api/jobs", jobRoutes);
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SkillConnect API is running",
  });
});

export default app;