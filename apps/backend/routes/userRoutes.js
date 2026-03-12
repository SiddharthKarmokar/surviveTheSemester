import express from 'express';
import { searchUsers } from '../controllers/searchController.js';

import { isAuthenticated } from '../middleware/auth.js'; 

const router = express.Router();

router.get('/search', isAuthenticated, searchUsers);

export default router;
