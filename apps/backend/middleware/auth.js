import jwt from "jsonwebtoken";
import { prisma } from "../prisma/prisma.js";

export const isAuthenticated = async (req, res, next) => {
    try{
        const token = 
            req.cookies?.accessToken ||
            req.headers.authorization?.split(" ")[1];

        if(!token){
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        let decoded;
        try{
            decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        }catch(err){
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Invalid or Expired token"
            });
        }

        let account = await prisma.users.findUnique({where: {id: decoded.id}});
        
        if(!account){
            return res.status(401).json({
                success: false,
                message: "Unauthorized. User not found"
            });
        }

        req.user = account;
        next();
    }catch(err){
        next(err);
    }
} 