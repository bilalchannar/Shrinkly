const nodemailer = require("nodemailer");
const dns = require("dns");

// Custom lookup function that forces IPv4 (family: 4)
// Render containers do not have IPv6 routing enabled by default. Since Node.js may resolve 
// hostnames to IPv6 by default, this forces Nodemailer to resolve only IPv4 addresses.
const customLookup = (hostname, options, callback) => {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  return dns.lookup(hostname, { ...options, family: 4 }, callback);
};

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
      lookup: customLookup, // Force IPv4 resolution
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
      lookup: customLookup, // Force IPv4 resolution
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    };

const transporter = nodemailer.createTransport(transportConfig);

module.exports = transporter;
