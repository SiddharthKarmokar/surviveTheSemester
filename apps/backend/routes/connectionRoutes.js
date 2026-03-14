import express from 'express';
import { sendRequest, acceptRequest, declineRequest, getNotifications, markNotificationsRead } from '../controllers/connectionController.js';
import { isAuthenticated } from '../middleware/auth.js'; 

const router = express.Router();

router.post('/request', isAuthenticated, sendRequest);
router.post('/accept', isAuthenticated, acceptRequest);
router.post('/decline', isAuthenticated, declineRequest);
router.get('/notifications', isAuthenticated, getNotifications);
router.post('/notifications/read', isAuthenticated, markNotificationsRead);

export default router;
