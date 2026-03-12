import crypto from "crypto";
import { ValidationError } from "../errorHandlers/index.js";
import { prisma } from "../prisma/prisma.js";
import { createRedisClient } from "../redis/index.js";
import { sendEmail } from "../utils/send-mail/index.js";
import { OTP_CONFIG } from "../utils/index.js";

const redisClient = createRedisClient();

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const validateRegistrationData = (data) => {
  if (!data) {
    throw new ValidationError("Request body missing");
  }

  const { name, email } = data;

  if (!name || !email) {
    throw new ValidationError("Missing required fields");
  }

  if (!emailRegex.test(email)) {
    throw new ValidationError("Invalid email");
  }
};


export const checkOtpRegistrations = async (email) => {
  if (await redisClient.get(`otp_lock:${email}`)) {
    throw new ValidationError(
      "Account locked due to multiple failed attempts! Please try again after 30 minutes"
    );
  }

  if (await redisClient.get(`otp_spam_lock:${email}`)) {
    throw new ValidationError(
      "Too many OTP requests! Please try again after 1 hour."
    );
  }

  if (await redisClient.get(`otp_cooldown:${email}`)) {
    const ttl = await redisClient.ttl(`otp_cooldown:${email}`);
    throw new ValidationError(
      `OTP already sent. Try again in ${ttl}s`
    );
  }
};


export const sendOtp = async (name, email, template, mailer) => {
  const otp = crypto.randomInt(1000, 9999).toString();

  await mailer(
    email,
    "Verify your Email",
    template,
    { name, otp }
  );

  await redisClient.set(`otp:${email}`, otp, {
    EX: OTP_CONFIG.OTP_TTL
  });

  await redisClient.set(`otp_cooldown:${email}`, "1", {
    EX: OTP_CONFIG.COOLDOWN
  });
};


export const trackOtpRequests = async (email) => {
  const otpRequestKey = `otp_request_count:${email}`;

  let otpRequests = parseInt(
    (await redisClient.get(otpRequestKey)) || "0"
  );

  if (otpRequests >= OTP_CONFIG.MAX_REQUESTS) {
    await redisClient.set(`otp_spam_lock:${email}`, "1", {
      EX: OTP_CONFIG.SPAM_LOCK
    });

    throw new ValidationError(
      "Too many OTP requests! Please try again after 1 hour."
    );
  }

  await redisClient.set(
    otpRequestKey,
    otpRequests + 1,
    { EX: OTP_CONFIG.SPAM_LOCK }
  );
};

export const verifyOtp = async (email, otp, next) => {
  const storedOtp = await redisClient.get(`otp:${email}`);

  if (!storedOtp) {
    throw new ValidationError("Invalid or expired OTP");
  }

  const failedAttemptsKey = `otp_attempts:${email}`;

  const failedAttempts = parseInt(
    (await redisClient.get(failedAttemptsKey)) || "0"
  );

  if (storedOtp !== otp) {
    if (failedAttempts >= OTP_CONFIG.MAX_ATTEMPTS) {
      await redisClient.set(`otp_lock:${email}`, "1", {
        EX: OTP_CONFIG.LOCK_TIME
      });

      await redisClient.del(`otp:${email}`);
      await redisClient.del(failedAttemptsKey);

      throw new ValidationError(
          "Account locked due to multiple failed attempts! Please try again after 30 minutes"
        );
    }

    await redisClient.set(
      failedAttemptsKey,
      failedAttempts + 1,
      { EX: OTP_CONFIG.OTP_TTL }
    );

    throw new ValidationError(
        `Incorrect OTP. You have ${
            OTP_CONFIG.MAX_ATTEMPTS - failedAttempts
        } attempts left`
    );
  }

  await redisClient.del(`otp:${email}`);
  await redisClient.del(failedAttemptsKey);
  await redisClient.del(`otp_cooldown:${email}`);
};

export const handleForgotPasswords = async (req,res,next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ValidationError("Email is required");
    }

    const user = await prisma.users.findUnique({
      where: { email }
    });

    if (!user) {
      throw new ValidationError("User not found");
    }

    await checkOtpRegistrations(email);
    await trackOtpRequests(email);

    const version = req.query.v || "1";
    const mailer = version == "2" ? sendGridMail : sendEmail;

    await sendOtp(
      user.name,
      email,
      "forgot-password-mail",
      mailer  
    );

    res.status(200).json({
      message:
        "OTP sent to your email. Please verify your account."
    });

  } catch (err) {
    next(err);
  }
};

export const verifyForgotPasswordOtp = async (req,res,next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new ValidationError(
        "Email and OTP are required"
      );
    }

    const storedOtp = await redisClient.get(
      `otp:${email}`
    );

    if (!storedOtp || storedOtp !== otp) {
      throw new ValidationError(
        "Invalid or expired OTP!"
      );
    }

    res.status(200).json({
      message:
        "OTP verified successfully. Please reset your password."
    });

  } catch (err) {
    next(err);
  }
};