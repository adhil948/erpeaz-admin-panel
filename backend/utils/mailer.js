// utils/mailer.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.office365.com", // Outlook SMTP
  port: 587,
  secure: false, // STARTTLS (not SSL)
  auth: {
    user: "info@erpeaz.com", // login user
    pass: "cymttpjcbyxxrksq", // app password
  },
  tls: {
    ciphers: "SSLv3",
  },
});

async function sendMail({ to, subject, text, html }) {
  try {
    const info = await transporter.sendMail({
      from: '"ERPEaz Notifications" <noreply@erpeaz.com>', // alias as FROM
      to, // can be admin list
      subject,
      text,
      html,
    });
    console.log("Mail sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("Mail failed:", err.message);
    throw err;
  }
}

module.exports = { sendMail };
