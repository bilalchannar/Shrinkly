/**
 * Calculate the next run time based on frequency settings.
 * Returns a Date for when the next report should be sent.
 * @param {Object} settings - ReportSettings database instance
 * @returns {Date} The next run date
 */
const calculateNextRunAt = (settings) => {
  const now = new Date();
  const [hours, minutes] = (settings.time || "09:00").split(":").map(Number);
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);

  if (settings.frequency === "daily") {
    if (next <= now) next.setDate(next.getDate() + 1);
  } else if (settings.frequency === "weekly") {
    const targetDay = settings.dayOfWeek != null ? settings.dayOfWeek : 1; // Monday default
    let daysUntilTarget = targetDay - now.getDay();
    if (daysUntilTarget < 0 || (daysUntilTarget === 0 && next <= now)) {
      daysUntilTarget += 7;
    }
    next.setDate(next.getDate() + daysUntilTarget);
  } else if (settings.frequency === "monthly") {
    const targetDate = settings.dayOfMonth || 1;
    next.setDate(targetDate);
    if (next <= now) {
      next.setMonth(next.getMonth() + 1);
    }
  } else {
    // Custom — default to weekly behavior
    if (next <= now) next.setDate(next.getDate() + 7);
  }

  return next;
};

module.exports = calculateNextRunAt;
