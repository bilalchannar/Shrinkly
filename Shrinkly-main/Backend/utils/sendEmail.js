const transporter = require("../config/email");

/**
 * Send an email using the configured transporter.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML body content
 */
const sendEmail = async (to, subject, html) => {
  const mailOptions = {
    from: `"Shrinkly" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
