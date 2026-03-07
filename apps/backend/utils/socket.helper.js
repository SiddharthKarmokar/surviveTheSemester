import crypto from "crypto";


export const generateSocketId = () => {
    return crypto.randomBytes(16).toString("hex");
};