const transporter = require("../config/email");

/**
 * Send an email using the configured transporter.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML body content
 */
const sendEmail = async (to, subject, html) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  
  // Mock email if credentials are missing or placeholders
  const isMock = !user || !pass || user.includes("your_email") || pass.includes("your_gmail_app_password");

  if (isMock) {
    console.log(`✉️ [MOCK EMAIL DISPATCH]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content Preview: ${html.substring(0, 150).replace(/<[^>]*>/g, '')}...`);
    return;
  }

  const mailOptions = {
    from: `"Shrinkly" <${user}>`,
    to,
    subject,
    html
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`✉️ Email sent successfully to ${to}. Message ID: ${info.messageId}. Response: ${info.response}`);
};

module.exports = sendEmail;
