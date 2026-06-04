const QRCode = require("../models/QRCode");
const QRScan = require("../models/QRScan");
const geoip = require("geoip-lite");
const { parseUserAgent, extractReferrerDomain } = require("./analyticsService");

/**
 * Record a QR code scan.
 */
const recordScan = async (qrCodeId, ip, userAgent, referrer) => {
  const { device, browser, os } = parseUserAgent(userAgent);
  const referrerDomain = extractReferrerDomain(referrer);

  // Geo-IP lookup
  const geo = geoip.lookup(ip);
  const country = geo?.country || "Unknown";
  const city = geo?.city || "Unknown";

  // Track analytics
  const scanEntry = new QRScan({
    qrCodeId,
    device,
    browser,
    os,
    country,
    city,
    referrer: referrerDomain,
    scannedAt: new Date()
  });
  await scanEntry.save();

  // Increment scanCount and scans atomically
  const updatedQr = await QRCode.findByIdAndUpdate(
    qrCodeId, 
    { $inc: { scanCount: 1, scans: 1 } },
    { new: true }
  );
  
  try {
    if (updatedQr && updatedQr.scanCount >= 100 && (updatedQr.scanCount === 100 || updatedQr.scanCount % 100 === 0)) {
      const { createNotification } = require("./notificationService");
      if (updatedQr.userId) {
        await createNotification(
          updatedQr.userId,
          "success",
          "QR Code Milestone!",
          `Your QR Code "${updatedQr.name || updatedQr.title || "QR Code"}" has been scanned ${updatedQr.scanCount} times!`,
          { qrCodeId: updatedQr._id }
        );
      }
    }
  } catch (err) {
    console.error("Error creating QR milestone notification:", err);
  }
  
  return scanEntry;
};

module.exports = {
  recordScan
};
