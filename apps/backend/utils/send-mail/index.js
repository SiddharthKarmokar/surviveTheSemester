import "dotenv/config.js";
import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";
import { __dirname } from "../index.js";

const transporter = nodemailer.createTransport({
    host:process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    service: process.env.SMTP_SERVICE,
    auth:{
        user:process.env.SMTP_USER,
        pass:process.env.SMTP_PASS
    }
})

const renderEmailTemplates = async(templateName, data) => {
    const templatePath = path.join(
    __dirname,
    "email-templates",
    `${templateName}.ejs`
    );
    return ejs.renderFile(templatePath, data);
};

export const sendEmail = async(to, subject, templateName, data)=>{
    try{
        const html = await renderEmailTemplates(templateName, data);
        await transporter.sendMail({
            from: `<${process.env.SMTP_USER}>`,
            to,
            subject,
            html
        });
        return true;
    }catch(err){
        console.error(err);
        return false;
    }
};