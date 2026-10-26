import Notification from "../models/Notification.js";
import express from "express";
import mongoose from "mongoose";
import Connection from "../models/Connection.js";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Send a connection request
router.post("/:userId", authMiddleware, async (req, res) => {
  try {
    const senderId = req.user.userId;
    const receiverId = req.params.userId;

    if (!mongoose.isValidObjectId(receiverId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid member ID.",
      });
    }

    if (senderId === receiverId) {
      return res.status(400).json({
        success: false,
        message: "You cannot connect with yourself.",
      });
    }

    const receiver = await User.findById(receiverId).select("_id");

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "Member not found.",
      });
    }

    // Check requests in both directions.
    const existing = await Connection.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          existing.status === "accepted"
            ? "You are already connected."
            : "A connection request already exists between you.",
      });
    }

    const connection = await Connection.create({
  sender: senderId,
  receiver: receiverId,
});

await Notification.create({
  recipient: receiverId,
  actor: senderId,
  type: "connection_request",
  connection: connection._id,
  message: "Someone sent you a connection request.",
});

    return res.status(201).json({
      success: true,
      message: "Connection request sent.",
      connection,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A connection request already exists.",
      });
    }

    console.error("Send connection request error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to send connection request.",
    });
  }
});

// View incoming and outgoing requests
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const connections = await Connection.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate("sender", "name role bio skills location")
      .populate("receiver", "name role bio skills location")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      connections,
    });
  } catch (error) {
    console.error("Load connections error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load connection requests.",
    });
  }
});

// Accept or reject an incoming request
router.patch("/:connectionId", authMiddleware, async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;

    if (!mongoose.isValidObjectId(connectionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid connection ID.",
      });
    }

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be accepted or rejected.",
      });
    }

    const connection = await Connection.findOne({
      _id: connectionId,
      receiver: userId,
      status: "pending",
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Pending incoming request not found.",
      });
    }

    connection.status = status;
await connection.save();

if (status === "accepted") {
  await Notification.create({
    recipient: connection.sender,
    actor: connection.receiver,
    type: "connection_accepted",
    connection: connection._id,
    message: "Your connection request was accepted.",
  });
}

    return res.status(200).json({
      success: true,
      message: `Connection request ${status}.`,
      connection,
    });
  } catch (error) {
    console.error("Update connection request error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update connection request.",
    });
  }
});

export default router;
