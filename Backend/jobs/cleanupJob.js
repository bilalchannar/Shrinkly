const cron = require("node-cron");
const Link = require("../models/Link");

/**
 * Starts the hourly cron job to mark expired links.
 */
const startCleanupJob = () => {
  // Run every hour
  cron.schedule("0 * * * *", async () => {
    try {
      const expiredLinks = await Link.find({ expiresAt: { $lte: new Date() }, status: "active" });
      if (expiredLinks.length > 0) {
        const linkIds = expiredLinks.map(l => l._id);
        await Link.updateMany({ _id: { $in: linkIds } }, { $set: { status: "expired" } });
        
        const { createNotification } = require("../services/notificationService");
        for (const link of expiredLinks) {
          if (link.userId) {
            await createNotification(
              link.userId,
              "warning",
              "Link Expired",
              `Your short link /r/${link.shortCode} has expired.`,
              { linkId: link._id, slug: link.shortCode }
            );
          }
        }
        console.log(`⏰ Cron: marked ${expiredLinks.length} link(s) as expired`);
      }
    } catch (err) {
      console.error("Cron expiry job error:", err);
    }
  });
  console.log("⏰ Cleanup job scheduled (hourly)");
};

module.exports = startCleanupJob;
