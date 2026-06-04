const phishingKeywords = [
  "paypal", "netflix", "bankofamerica", "chase", "wellsfargo", 
  "verify-account", "login-secure", "signin-security", "update-credentials",
  "secure-billing", "appleid", "microsoft-login"
];

const isPrivateIP = (host) => {
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    return true;
  }
  
  // IPv4 check
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = host.match(ipv4Regex);
  if (match) {
    const parts = match.slice(1).map(Number);
    if (parts.some(p => p > 255)) return false;
    
    // 127.0.0.0/8 (Loopback)
    if (parts[0] === 127) return true;
    // 10.0.0.0/8 (Private)
    if (parts[0] === 10) return true;
    // 172.16.0.0/12 (Private)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 169.254.0.0/16 (Link-local)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 0.0.0.0/8
    if (parts[0] === 0) return true;
  }
  
  // IPv6 check
  if (host === "::1" || host === "::" || host.startsWith("fe80:") || host.startsWith("fc00:") || host.startsWith("fd00:")) {
    return true;
  }
  
  return false;
};

const containsPhishingKeywords = (urlStr) => {
  const lowercaseUrl = urlStr.toLowerCase();
  try {
    const parsed = new URL(lowercaseUrl);
    const domain = parsed.hostname;
    return phishingKeywords.some(keyword => {
      if (domain.includes(keyword)) {
        if (domain === `${keyword}.com` || domain.endsWith(`.${keyword}.com`)) {
          return false;
        }
        return true;
      }
      return false;
    });
  } catch {
    return false;
  }
};

const validateURL = (urlStr) => {
  try {
    // Block javascript: and data: URIs before URL parsing
    const lowerUrl = urlStr.toLowerCase().trim();
    if (lowerUrl.startsWith('javascript:')) {
      return { isValid: false, message: "JavaScript URLs are not allowed." };
    }
    if (lowerUrl.startsWith('data:')) {
      return { isValid: false, message: "Data URIs are not allowed." };
    }
    
    const url = new URL(urlStr);
    
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { isValid: false, message: "Only HTTP and HTTPS protocols are allowed." };
    }
    
    const host = url.hostname;
    
    if (isPrivateIP(host)) {
      return { isValid: false, message: "Local or private network URLs are blocked." };
    }
    
    if (containsPhishingKeywords(urlStr)) {
      return { isValid: false, message: "URL flagged as potential security risk." };
    }
    
    return { isValid: true };
  } catch (err) {
    return { isValid: false, message: "Invalid URL format." };
  }
};

module.exports = { validateURL };
