import {ValidationError} from "../errorHandlers/index"
import crypto from "crypto"
import { Request, Response, NextFunction } from "express"; 
import prisma from "../../prisma/prisma"
import { createRedisClient } from "../../redis/index";

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const redisClient = createRedisClient();

exports.validateRegistrationData = (data) => {
    const {name, email, password, phoneNumber} = data;
    if(
        !name ||
        !email ||
        !password ||
        !phoneNumber
    ){
        throw new ValidationError("Missing required fields");
    }
    if(!emailRegex.test(email)){
        throw new ValidationError("Invalid email");
    }
} 

exports.checkOtpRegistrations = async(email) =>{
    if(await redisClient.get(`otp_lock:${email}`)){
        throw new ValidationError("Account locked due to multiple failed attempts! Please try again after 30 minutes");
    }
    if(await redisClient.get(`otp_spam_lock:${email}`)){
        throw new ValidationError("Too many OTP requests! Please try again after 1 hour.");
    }
    if(await redisClient.get(`otp_cooldown:${email}`)){
        throw new ValidationError("Otp already sent");
    }
};

exports.sendOtp = async(name, email, template) => {
    const otp = crypto.randomInt(1000, 9999).toString();
    await sendEmail(email, "Verify your Email", {name, otp});
  
    await redisClient.set(`otp:${email}`, otp, "EX", 300);
    await redisClient.set(`otp_cooldown:${email}`, 1, "EX", 60);
};

exports.trackOtpRequests = async (email) => {
    const otpRequestKey = `otp_request_count:${email}`;
    let otpRequests = parseInt((await redisClient.get(otpRequestKey)) || "0");
    if(otpRequests >= 2){
        await redisClient.set(`otp_spam_lock:${email}`, 1, "EX", 3600);
        throw new  ValidationError("Too many OTP requests! Please try again after 1 hour.");
    }
    await redisClient.set(otpRequestKey, otpRequests + 1, "EX", 3600);
}

exports.verifyOtp = async(email, otp, next) => {
    const storeOtp = await redisClient.get(`otp:${email}`);
    
    if(!storeOtp){
        return next(new ValidationError("Invalid or Expired OTP"));
    }

    const failedAttemptsKey = `otp_attemps:${email}`;
    const failedAttempts = parseInt((await redisClient.get(failedAttemptsKey)) || "0"); 
    if(storeOtp !== otp){
        if(failedAttempts >= 5){
            await redisClient.set(`otp_lock:${email}`, 1, "EX", 1800);
            await redisClient.del(`otp:${email}`, failedAttemptsKey);

            return next(
                new ValidationError("Account locked due to multiple failed attempts! Please try again after 30 minutes")
            );
        }
        
        await redisClient.set(failedAttemptsKey, failedAttempts + 1, "EX", 300);
        await redisClient.del(`otp:${email}`, failedAttemptsKey);

        return next(new ValidationError(`Incorrect OTP. You have ${5 - failedAttempts} attempts left`));
    }

    await redisClient.del(`otp:${email}`, failedAttemptsKey);
    await redisClient.del(`otp_cooldown:${email}`);
};

exports.handleForgotPasswords = async (req, res, next) => {
    try {
        const { email } = req.body;
        if(!email){
            throw new ValidationError("Email is required");
        }

        const user = await prisma.user.findUnique({where: {email}});
        if(!user){
            throw new ValidationError("User not found");
        }
        
        await exports.checkOtpRegistrations(email);
        await exports.trackOtpRequests(email);

        await exports.sendOtp(
            user.name,
            email,
            "forgot-password-mail"
        );

        res.status(200).json({
            message: "OTP sent to your email. Please verify your account.",
        });

    } catch(err){
        next(err);
    }
};


exports.verifyForgotPasswordOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        if(!email || !otp){
            throw new ValidationError("Email and OTP are required");
        }
        const storeOtp = await redisClient.get(`otp:${email}`);

        if(!storeOtp || storeOtp !== otp){
            throw new ValidationError("Invalid or Expired OTP!");
        }

        res.status(200).json({
            message: "OTP verified successfully. Please reset your password.",
        });
    }catch(err){
        next(err);
    }
};