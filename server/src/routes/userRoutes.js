
import express from "express";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/* GET /api/users
   Search and filter SkillConnect members */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { search = "", role = "" } = req.query;

    const filter = {
      _id: { $ne: req.user.userId },
    };

    if (role && ["student", "worker", "employer"].includes(role)) {
      filter.role = role;
    }

    if (search.trim()) {
      const escapedSearch = search.trim().replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const searchRegex = new RegExp(escapedSearch, "i");

      filter.$or = [
        { name: searchRegex },
        { bio: searchRegex },
        { skills: searchRegex },
        { location: searchRegex },
      ];
    }

    const users = await User.find(filter)
      .select("name role bio skills experience location")
      .sort({ name: 1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      success: true,
      count: users.length,
      users: users.map((user) => ({
        id: user._id,
        name: user.name,
        role: user.role,
        bio: user.bio,
        skills: user.skills,
        experience: user.experience,
        location: user.location,
      })),
    });
  } catch (error) {
    console.error("Discover members error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load members.",
    });
  }
});

// GET /api/users/me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        skills: user.skills,
        experience: user.experience,
        location: user.location,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
});

router.put("/me", authMiddleware, async (req, res) => {
  try {
    const { name, bio, skills, experience, location } = req.body;

    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }
      updates.name = name.trim();
    }

    if (bio !== undefined) {
      if (typeof bio !== "string" || bio.length > 500) {
        return res.status(400).json({
          success: false,
          message: "Bio must be a string of at most 500 characters",
        });
      }
      updates.bio = bio.trim();
    }

    if (skills !== undefined) {
      if (
        !Array.isArray(skills) ||
        !skills.every((skill) => typeof skill === "string") ||
        skills.length > 30 ||
        skills.some((skill) => skill.trim().length > 50)
      ) {
        return res.status(400).json({
          success: false,
          message: "Provide up to 30 valid skills",
        });
      }

      updates.skills = [
        ...new Set(
          skills.map((skill) => skill.trim()).filter(Boolean)
        ),
      ];
    }

    if (experience !== undefined) {
      if (typeof experience !== "string" || experience.length > 1000) {
        return res.status(400).json({
          success: false,
          message: "Experience must be at most 1000 characters",
        });
      }
      updates.experience = experience.trim();
    }

    if (location !== undefined) {
      if (typeof location !== "string" || location.length > 100) {
        return res.status(400).json({
          success: false,
          message: "Location must be at most 100 characters",
        });
      }
      updates.location = location.trim();
    }

    const updatedUser = await User.findByIdAndUpdate(
  req.user.userId,
  { $set: updates },
  { returnDocument: "after", runValidators: true }
);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
  id: updatedUser._id,
  name: updatedUser.name,
  email: updatedUser.email,
  role: updatedUser.role,
  bio: updatedUser.bio,
  skills: updatedUser.skills,
  experience: updatedUser.experience,
  location: updatedUser.location,
},
    });
  } catch (error) {
    console.error("Profile update error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update profile",
    });
  }
});

export default router;
