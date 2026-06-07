const nodemailer = require("nodemailer");
const dns = require("dns");

// Force Node.js to prefer IPv4 addresses over IPv6.
// Render containers do not have IPv6 routing enabled by default, which causes ENETUNREACH errors when connecting to Google's SMTP IPv6 addresses.
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

const service = process.env.EMAIL_SERVICE || "gmail";

const transportConfig = (service === "gmail")
  ? {
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // Use STARTTLS on port 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        // Prevent SSL handshake failures or certificate rejects
        rejectUnauthorized: false
      },
      connectionTimeout: 10000, // 10 seconds timeout limit
      greetingTimeout: 10000,
      socketTimeout: 10000
    }
  : {
      service,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    };

const transporter = nodemailer.createTransport(transportConfig);

module.exports = transporter;
