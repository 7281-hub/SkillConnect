
import express from "express";
import User from "../../models/User.js";
import authMiddleware from "../../middleware/authMiddleware.js";

const router = express.Router();

// Get the logged-in user's profile
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "name email role bio skills experience location"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("Get worker profile error:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// Update the logged-in user's profile
router.put("/", authMiddleware, async (req, res) => {
  try {
    const { name, bio, skills, experience, location } = req.body;

    const updates = {};

    if (name !== undefined) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (experience !== undefined) updates.experience = experience;
    if (location !== undefined) updates.location = location;

    if (skills !== undefined) {
      if (!Array.isArray(skills)) {
        return res.status(400).json({
          message: "Skills must be an array",
        });
      }

      updates.skills = skills
        .filter((skill) => typeof skill === "string")
        .map((skill) => skill.trim())
        .filter(Boolean);
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("name email role bio skills experience location");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update worker profile error:", error);
    res.status(400).json({ message: error.message });
  }
});

export default router;
