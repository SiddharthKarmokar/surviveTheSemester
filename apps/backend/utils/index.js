import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

export const OTP_CONFIG = {
  OTP_TTL: 300,           // 5 minutes
  COOLDOWN: 60,           // resend cooldown
  MAX_ATTEMPTS: 5,
  LOCK_TIME: 1800,        // 30 min
  SPAM_LOCK: 3600,        // 1 hour
  MAX_REQUESTS: 2
};

export const SWAGGER_UI_OPTIONS = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "surviveTheSemester API's",
      version: "1.0.0",
      description: "Authentication microservice documentation"
    },
    servers: [
      {
        url: "http://localhost:3000"
      }
    ]
  },
  apis: ["./auth/*.js"] // where swagger comments exist
};