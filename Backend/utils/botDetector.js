/**
 * Bot Detection Utility
 * Identifies bot and crawler traffic based on User Agent patterns
 */

const BOT_PATTERNS = {
  'Facebook': /facebookexternalhit|facebookexternalhit\/|Facebot/i,
  'Twitter': /Twitterbot|Twittercrawler/i,
  'WhatsApp': /WhatsApp/i,
  'Telegram': /Telegrambot|telegram\//i,
  'LinkedIn': /LinkedInBot|Linkedbot/i,
  'Google': /Googlebot|Google-Structured-Data-Plugin|Google-Read-Aloud/i,
  'Bing': /Bingbot|msnbot|ms-bot/i,
  'Slack': /Slackbot|Slack-Imgproxy/i,
  'Pinterest': /Pinterestbot/i,
  'Discord': /Discordbot/i,
  'Curl': /^curl/i,
  'Wget': /wget/i,
  'Python': /python-requests|python-urllib|aiohttp|scrapy/i,
  'Node': /node-fetch|axios|fetch/i,
  'Scrapy': /Scrapy|scrapy/i,
  'Generic Crawler': /bot|crawler|spider|scraper|fetch|parser|scanner|indexer|archiver|monitor/i
};

/**
 * Detect if a user agent is a bot
 * @param {string} userAgent - User agent string from request
 * @returns {{ isBot: boolean, botName: string | null }}
 */
exports.detectBot = (userAgent) => {
  if (!userAgent) {
    return { isBot: false, botName: null };
  }

  // Check against known bot patterns (order matters - more specific first)
  const botChecks = [
    'Facebook', 'Twitter', 'WhatsApp', 'Telegram', 'LinkedIn',
    'Google', 'Bing', 'Slack', 'Pinterest', 'Discord',
    'Curl', 'Wget', 'Python', 'Node', 'Scrapy'
  ];

  for (const botName of botChecks) {
    if (BOT_PATTERNS[botName].test(userAgent)) {
      return { isBot: true, botName };
    }
  }

  // Check generic crawler pattern last
  if (BOT_PATTERNS['Generic Crawler'].test(userAgent)) {
    return { isBot: true, botName: 'Crawler' };
  }

  return { isBot: false, botName: null };
};

/**
 * Get all known bot names
 * @returns {string[]}
 */
exports.getBotNames = () => {
  return Object.keys(BOT_PATTERNS);
};

/**
 * Check if a specific bot name matches the user agent
 * @param {string} userAgent
 * @param {string} botName
 * @returns {boolean}
 */
exports.isSpecificBot = (userAgent, botName) => {
  if (!userAgent || !BOT_PATTERNS[botName]) {
    return false;
  }
  return BOT_PATTERNS[botName].test(userAgent);
};
