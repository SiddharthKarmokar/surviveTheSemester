import express from 'express';
import { searchUsers } from '../controllers/searchController.js';

import { isAuthenticated } from '../middleware/auth.js'; 
import { searchRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

router.get('/search', isAuthenticated, searchRateLimit, searchUsers);

export default router;
