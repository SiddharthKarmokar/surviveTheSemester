import { isAuthenticated } from "../middleware/auth.js";
import {
    userRegistrations,
    verifyUser,
    loginUser,
    logOutUser,
    refreshToken,
    userForgotPassword,
    resetUserPassword,
    verifyUserForgotPasswordOtp,
    updateUserPassword,
    getUser
} from "../auth/controller.js";

import express from "express";

const router = express.Router();

router.post('/register', userRegistrations);
router.post('/verify', verifyUser);
router.post('/login', loginUser);
router.post('/refresh', refreshToken);
router.post('/forgot-password', userForgotPassword);
router.post('/verify-forgot-password', verifyUserForgotPasswordOtp);
router.post('/reset-password', resetUserPassword);
router.post('/update-password', isAuthenticated, updateUserPassword);
router.get('/logout', logOutUser);
router.get('/me', isAuthenticated, getUser);

export const authRoutes = router;