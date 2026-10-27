
import express from "express";
import Job from "./Job.js";
import authMiddleware from "../../middleware/authMiddleware.js";

const router = express.Router();

// Create a job — employers only
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({
        success: false,
        message: "Only employers can post jobs",
      });
    }

    const {
      title,
      company,
      description,
      requiredSkills,
      location,
      jobType,
      experienceLevel,
      salary,
    } = req.body;

    const job = await Job.create({
      employer: req.user.userId,
      title,
      company,
      description,
      requiredSkills: Array.isArray(requiredSkills)
        ? requiredSkills
            .filter((skill) => typeof skill === "string")
            .map((skill) => skill.trim())
            .filter(Boolean)
        : [],
      location,
      jobType,
      experienceLevel,
      salary,
    });

    res.status(201).json({
      success: true,
      message: "Job posted successfully",
      job,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Get all open jobs
router.get("/", authMiddleware, async (req, res) => {
  try {
    const jobs = await Job.find({ status: "open" })
      .populate("employer", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
    });
  }
});

// Get jobs posted by the logged-in employer
router.get("/my-jobs", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({
        success: false,
        message: "Only employers can view their posted jobs",
      });
    }

    const jobs = await Job.find({ employer: req.user.userId })
      .sort({ createdAt: -1 });

    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch your jobs",
    });
  }
});

// Close a job posted by the logged-in employer
router.patch("/:jobId/close", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({
        success: false,
        message: "Only employers can close jobs",
      });
    }

    const job = await Job.findOneAndUpdate(
      {
        _id: req.params.jobId,
        employer: req.user.userId,
        status: "open",
      },
      { $set: { status: "closed" } },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Open job not found or you do not own it",
      });
    }

    res.json({
      success: true,
      message: "Job closed successfully",
      job,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid job ID",
    });
  }
});

export default router;
