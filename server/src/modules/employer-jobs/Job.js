
import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: 120,
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
      trim: true,
      maxlength: 5000,
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      trim: true,
      default: "Not specified",
      maxlength: 100,
    },
    jobType: {
      type: String,
      enum: ["Full-time", "Part-time", "Internship", "Contract"],
      default: "Full-time",
    },
    experienceLevel: {
      type: String,
      enum: ["Fresher", "Entry-level", "Experienced"],
      default: "Fresher",
    },
    salary: {
      type: String,
      trim: true,
      default: "Not disclosed",
      maxlength: 100,
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
  },
  { timestamps: true }
);

const Job = mongoose.model("Job", jobSchema);

export default Job;
