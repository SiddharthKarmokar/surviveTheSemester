import express from "express";
import { prisma } from "../prisma/prisma.js";

const router = express.Router();

router.get("/history/:friendId", async (req, res) => {
  try {
    const { userId } = req.query; // Assuming user ID is passed in query, or use auth middleware
    const { friendId } = req.params;

    if (!userId || !friendId) {
      return res.status(400).json({ error: "Missing userId or friendId" });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Fetch history error:", error);
    res.status(500).json({ error: "Could not fetch chat history" });
  }
});

export default router;
