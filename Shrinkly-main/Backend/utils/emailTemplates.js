/**
 * Email HTML templates for Shrinkly
 */

const verificationEmailTemplate = (username, verificationUrl) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: 'Segoe UI', sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #512da8, #7b4fd4); padding: 36px 40px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px; }
    .header p { color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 14px; }
    .body { padding: 40px; color: #333; }
    .body h2 { font-size: 22px; margin: 0 0 12px; color: #1a1a2e; }
    .body p { font-size: 15px; line-height: 1.6; color: #555; margin: 0 0 20px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #512da8, #7b4fd4); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 600; font-size: 15px; letter-spacing: 0.5px; }
    .footer { text-align: center; padding: 24px 40px; font-size: 12px; color: #999; border-top: 1px solid #f0f0f0; }
    .expire-note { background: #f8f4ff; border-left: 4px solid #512da8; padding: 12px 16px; border-radius: 0 6px 6px 0; font-size: 13px; color: #666; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🔗 Shrinkly</h1>
      <p>URL Shortener & Analytics</p>
    </div>
    <div class="body">
      <h2>Hi ${username}, verify your email! 👋</h2>
      <p>Thanks for creating your Shrinkly account. Click the button below to verify your email address and activate your account.</p>
      <a href="${verificationUrl}" class="btn">Verify My Email</a>
      <div class="expire-note">
        ⏰ This link expires in <strong>24 hours</strong>. If you didn't create an account, you can safely ignore this email.
      </div>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Shrinkly. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

const passwordResetEmailTemplate = (username, resetUrl) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: 'Segoe UI', sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #d32f2f, #f44336); padding: 36px 40px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px; }
    .header p { color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 14px; }
    .body { padding: 40px; color: #333; }
    .body h2 { font-size: 22px; margin: 0 0 12px; color: #1a1a2e; }
    .body p { font-size: 15px; line-height: 1.6; color: #555; margin: 0 0 20px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #d32f2f, #f44336); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 600; font-size: 15px; letter-spacing: 0.5px; }
    .footer { text-align: center; padding: 24px 40px; font-size: 12px; color: #999; border-top: 1px solid #f0f0f0; }
    .expire-note { background: #fff5f5; border-left: 4px solid #f44336; padding: 12px 16px; border-radius: 0 6px 6px 0; font-size: 13px; color: #666; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🔗 Shrinkly</h1>
      <p>Password Reset Request</p>
    </div>
    <div class="body">
      <h2>Reset your password, ${username}</h2>
      <p>We received a request to reset your password. Click the button below to choose a new password. If you didn't request this, you can safely ignore this email.</p>
      <a href="${resetUrl}" class="btn">Reset My Password</a>
      <div class="expire-note">
        ⏰ This link expires in <strong>1 hour</strong>. For security, do not share this link with anyone.
      </div>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Shrinkly. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

module.exports = { verificationEmailTemplate, passwordResetEmailTemplate };
