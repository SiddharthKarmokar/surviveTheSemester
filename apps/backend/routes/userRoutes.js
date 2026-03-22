import express from 'express';
import { searchUsers } from '../controllers/searchController.js';

import { isAuthenticated } from '../middleware/auth.js'; 

const router = express.Router();
import { prisma } from '../prisma/prisma.js';

router.get('/friends', isAuthenticated, async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
      select: { friendlist: true }
    });

    if (!user || !user.friendlist || user.friendlist.length === 0) {
      return res.status(200).json([]);
    }

    const friends = await prisma.users.findMany({
      where: { id: { in: user.friendlist } },
      select: { id: true, name: true, avatar: { select: { url: true } } }
    });

    res.status(200).json(friends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch friends" });
  }
});

router.get('/search', isAuthenticated, searchUsers);

export default router;
