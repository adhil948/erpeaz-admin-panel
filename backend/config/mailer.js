// config/mailer.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // e.g., smtp.office365.com / smtp.gmail.com
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

module.exports = transporter;
