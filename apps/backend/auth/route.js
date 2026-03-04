import isAuthenticated from "../../middlewares/auth";
import {
    userRegistrations,
    verifyUser,
    loginUser,
    logOutUser,
    refreshToken,
    userForgotPassword,
    resetUserPassword,
    verifyUserForgotPassword,
    updateUserPassword,
    getUser
} from "./controller";

const express = require('express');
const router = express.Router();

router.post('/register', userRegistrations);
router.post('/verify', verifyUser);
router.post('/login', loginUser);
router.post('/logout', logOutUser);
router.post('/refresh', refreshToken);
router.post('/logout', logOutUser);
router.post('/forgot-password', userForgotPassword);
router.post('/reset-password', resetUserPassword);
router.post('/verify-forgot-password', verifyUserForgotPassword);
router.post('/update-password', isAuthenticated, updateUserPassword);
router.get('/me', isAuthenticated, getUser);

module.exports = router;