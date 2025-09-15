// testMail.js
const { sendMail } = require("./utils/mailer");

(async () => {
  try {
    const info = await sendMail({
      to: "adhilshahanj@gmail.com", 
      subject: "SMTP Test from ERPEaz",
      text: "Hello, this is a plain text test email.",
      html: `
        <h2>Test Email from ERPEaz</h2>
        <p>If you received this, SMTP is working correctly ✅</p>
      `,
    });

    console.log("Test email sent successfully:", info.messageId);
  } catch (err) {
    console.error("Error sending test email:", err);
  }
})();
