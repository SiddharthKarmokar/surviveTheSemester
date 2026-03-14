import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma/prisma.js";

import {
  sendOtp,
  validateRegistrationData,
  checkOtpRegistrations,
  trackOtpRequests,
  verifyOtp,
  handleForgotPasswords,
  verifyForgotPasswordOtp
} from "../utils/auth.helper.js";

import {
  AuthenticationError,
  NotFoundError,
  ValidationError
} from "../errorHandlers/index.js";

import { setCookie } from "../utils/cookies/setCookies.js";
import { sendLog } from "../utils/logger.js";
import { sendGridMail, sendEmail } from "../utils/send-mail/index.js";

export const userRegistrations = async (req, res, next) => {
  try {
    validateRegistrationData(req.body);
    const { name, email } = req.body;

    const existingUser = await prisma.users.findUnique({
      where: {email},
    });

    if(existingUser) {
      throw new ValidationError("User already exists");
    }

    await checkOtpRegistrations(email);
    await trackOtpRequests(email, next);

    const version = req.query.v || "1";
    const mailer = version == "2" ? sendGridMail : sendEmail;

    await sendOtp(name, email, "user-activation-mail", mailer);
    res.status(200).json({
      message: "OTP sent to your email. Please verify your account.",
    });
  } catch (error) {
    next(error);
  }
};

export const verifyUser = async (req, res, next) => {
  try {
    const {email, otp, password, name, interest} = req.body;
    if(!email || !otp || !password || !name){
      return next(new ValidationError("Email, OTP and Password are required"));
    }

    const existingUser = await prisma.users.findUnique({where: {email}});

    if(existingUser){
      return next(new ValidationError("User already exists"));
    }

    await verifyOtp(email, otp, next);

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.users.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        friendlist: [],
        rating: 0,
        HighScore: [],
        streak: 0,
        maxStreak: 0,
        interest: interest || []  
      }
    });

    const accessToken = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email
      },
      process.env.ACCESS_TOKEN_SECRET,
      {expiresIn: "1d"}
    );
    
    const refreshToken = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    setCookie(res, "refreshToken", refreshToken);
    setCookie(res, "accessToken", accessToken);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  }catch(err){
    next(err);
  }
};

export const loginUser = async (req, res, next) => {
  try{
    const { email, password } = req.body;

    if(!email || !password){
      return next(new ValidationError("Missing Email or Password"));
    }
    
    const user = await prisma.users.findUnique({where: {email}});
    if(!user){
      return next(new NotFoundError("User not found"));
    }
    if (!user.passwordHash) {
      return next(new AuthenticationError("User registered via OTP without a password"));
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if(!isMatch){
      return next(new AuthenticationError("Invalid credentials"));
    } 
    
    const accessToken = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email
      },
      process.env.ACCESS_TOKEN_SECRET,
      {expiresIn: "3h"}
    );
    
    const refreshToken = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    setCookie(res, "refreshToken", refreshToken);
    setCookie(res, "accessToken", accessToken);

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
    });
  }catch(err) {
    next(err);
  }
};

export const refreshToken = async (req, res, next) => {
  try{
    const token = 
      req.cookies["refreshToken"] || 
      req.headers.authorization?.split(" ")[1];
    
    if(!token){
      return next(new AuthenticationError("Unauthorized"));
    }
    
    let decoded;
    try{
      decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    }catch(err){
      return next(new AuthenticationError("Invalid refresh token"));
    }

    let account = await prisma.users.findUnique({where: {id: decoded.id}});
    if(!account){
      return next(new AuthenticationError("User not found"));
    }
    req.user = account;

    const newAccessToken = jwt.sign(
      {id: decoded.id},
      process.env.ACCESS_TOKEN_SECRET,
      {expiresIn: "1d"}
    );

    setCookie(res, "accessToken", newAccessToken);

    res.status(200).json({
      success: true
    })

  }catch (err) {
    next(err);
  }
};

export const getUser = async (req, res, next) => {
  try{
    if(!req.user){
      return next(new AuthenticationError("Unauthorized"));
    }
    
    const { passwordHash, ...safeUser } = req.user;
    
    await sendLog({
      type: "success",
      message: `User fetched successfully ${req.user.email}`,
      source: `auth-service`
    });

    res.status(200).json({
      sucess: true,
      user: safeUser,
    });

  }catch(err){
    next(err);
  }
};



export const verifyUserForgotPasswordOtp = async (req, res, next) => {
  try{
    await verifyForgotPasswordOtp(req, res, next);
  }catch(err){
    next(err);
  }
};

export const userForgotPassword = async (req, res, next) => {
  try{
    await handleForgotPasswords(req, res, next);
  }catch(err){
    next(err);
  }
};

export const resetUserPassword = async (req, res, next) => {
  try{
    const body = req.body;
    const {email, newPassword} = body;
    if(!email || !newPassword){
      return next(new ValidationError("Email and Password are required"));
    }
    
    const user = await prisma.users.findUnique({where: {email}});
    if(!user){
      return next(new NotFoundError("User not found"));
    }
    
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword){
      return next(new ValidationError("Password cannot be same as old password"));
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.users.update({
      where: {email},
      data: {
        passwordHash: hashedPassword
      }
    });
    
    res.status(200).json({
      message: "Password reset successfully"
    });

  }catch(err){
    next(err);
  }
};

export const updateUserPassword = async(req, res, next) => {
  try{
    const userId = req.user.id;
    const {currentPassword, newPassword, confirmPassword} = req.body;
    
    if(!currentPassword || !newPassword || !confirmPassword){
      return next(new ValidationError("Current Password, New Password and Confirm Password are required"));
    }

    if(newPassword !== confirmPassword){
      return next(new ValidationError("New Password and Confirm Password do not match"));
    }

    if(currentPassword === newPassword){
      return next(new ValidationError("New password cannot be same as old password"));
    }

    const user = await prisma.users.findUnique({where: {id: userId}});

    if(!user || !user.passwordHash){
      return next(new NotFoundError("User not found"));
    }

    const isPasswordCorrect  = await bcrypt.compare(currentPassword, user.passwordHash);
    if(!isPasswordCorrect){
      return next(new AuthenticationError("Current password is incorrect"));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.users.update({
      where: {id: userId},
      data: {passwordHash: hashedPassword}
    });

    res.status(200).json({
      message: "Password updated successfully"
    });

  }catch(err){
    next(err);
  }
};

export const logOutUser = async (req, res, next) => {
  try{

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: true,
      sameSite: "strict"
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "strict"
    });
    res.status(200).json({
      success:true,
      message:"Logged out successfully",
    });
  }catch(err){
    next(err);
  }
};
