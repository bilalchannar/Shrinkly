const sendEmail = require("../utils/sendEmail");
const { verificationEmailTemplate, passwordResetEmailTemplate } = require("../utils/emailTemplates");

/**
 * Send account verification email.
 */
const sendVerificationEmail = async (email, username, verificationUrl) => {
  await sendEmail(
    email,
    "Verify your Shrinkly account",
    verificationEmailTemplate(username, verificationUrl)
  );
};

/**
 * Send password reset email.
 */
const sendPasswordResetEmail = async (email, username, resetUrl) => {
  await sendEmail(
    email,
    "Reset your Shrinkly password",
    passwordResetEmailTemplate(username, resetUrl)
  );
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail
};
