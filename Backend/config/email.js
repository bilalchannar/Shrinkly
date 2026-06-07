const nodemailer = require("nodemailer");
const dns = require("dns");

// Force Node.js to prefer IPv4 addresses over IPv6.
// Render containers do not have IPv6 routing enabled by default, which causes ENETUNREACH errors when connecting to Google's SMTP IPv6 addresses.
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

module.exports = transporter;
