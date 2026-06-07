const https = require("https");
const transporter = require("../config/email");

/**
 * Send an HTTP POST request using Node's built-in https module (avoids extra dependencies)
 */
const sendHttpRequest = (url, headers, body) => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname,
      method: "POST",
      headers
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.write(JSON.stringify(body));
    req.end();
  });
};

/**
 * Send an email using the configured transporter or HTTP email API services.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML body content
 */
const sendEmail = async (to, subject, html) => {
  // 1. Try Resend API (HTTP-based, allowed on Render Free Tier)
  if (process.env.RESEND_API_KEY) {
    try {
      console.log(`✉️ Sending email via Resend API to ${to}...`);
      const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
      const headers = {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      };
      const body = {
        from: `Shrinkly <${fromEmail}>`,
        to,
        subject,
        html
      };
      await sendHttpRequest("https://api.resend.com/emails", headers, body);
      console.log(`✉️ Email sent successfully via Resend to ${to}`);
      return;
    } catch (err) {
      console.error("Failed to send via Resend API, falling back:", err.message);
    }
  }

  // 2. Try SendGrid API (HTTP-based, allowed on Render Free Tier)
  if (process.env.SENDGRID_API_KEY) {
    try {
      console.log(`✉️ Sending email via SendGrid API to ${to}...`);
      const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
      const headers = {
        "Authorization": `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json"
      };
      const body = {
        personalizations: [{ to: [{ email: to }] }],
        from: { email: fromEmail, name: "Shrinkly" },
        subject,
        content: [{ type: "text/html", value: html }]
      };
      await sendHttpRequest("https://api.sendgrid.com/v3/mail/send", headers, body);
      console.log(`✉️ Email sent successfully via SendGrid to ${to}`);
      return;
    } catch (err) {
      console.error("Failed to send via SendGrid API, falling back:", err.message);
    }
  }

  // 3. Fallback to standard Nodemailer SMTP (works locally or on Render Paid Tier)
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
