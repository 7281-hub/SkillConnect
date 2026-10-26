
import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate requests between the same two users.
connectionSchema.index(
  { sender: 1, receiver: 1 },
  { unique: true }
);

const Connection = mongoose.model("Connection", connectionSchema);

export default Connection;
