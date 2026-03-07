import express from 'express';
import { sendRequest, acceptRequest, declineRequest, getNotifications, markNotificationsRead } from '../controllers/connectionController.js';
import { isAuthenticated } from '../middleware/auth.js'; 
import { socialRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

router.post('/request', isAuthenticated, socialRateLimit, sendRequest);
router.post('/accept', isAuthenticated, socialRateLimit, acceptRequest);
router.post('/decline', isAuthenticated, socialRateLimit, declineRequest);
router.get('/notifications', isAuthenticated, getNotifications);
router.post('/notifications/read', isAuthenticated, socialRateLimit, markNotificationsRead);

export default router;
