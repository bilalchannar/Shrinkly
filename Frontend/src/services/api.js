const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Get auth token from localStorage
const getToken = () => localStorage.getItem("authToken");

// Create headers with auth token
const getHeaders = (includeAuth = true) => {
  const headers = {
    "Content-Type": "application/json",
  };
  
  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// Handle API response
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    // Handle token expiry
    if (response.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("loggedInUser");
      window.location.href = "/";
    }
    throw new Error(data.message || "Something went wrong");
  }
  
  return data;
};

// ==================== AUTH ====================
export const authAPI = {
  signup: async (username, email, password, plan = "free") => {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: getHeaders(false),
      body: JSON.stringify({ username, email, password, plan }),
    });
    return handleResponse(response);
  },

  login: async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: getHeaders(false),
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  verifyEmail: async (token) => {
    const response = await fetch(`${API_URL}/auth/verify-email?token=${token}`, {
      method: "GET",
      headers: getHeaders(false),
    });
    return handleResponse(response);
  },

  resendVerification: async (email) => {
    const response = await fetch(`${API_URL}/auth/resend-verification`, {
      method: "POST",
      headers: getHeaders(false),
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  forgotPassword: async (email) => {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: getHeaders(false),
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  resetPassword: async (token, password) => {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: getHeaders(false),
      body: JSON.stringify({ token, password }),
    });
    return handleResponse(response);
  },
};


// ==================== PROFILE ====================
export const profileAPI = {
  getProfile: async () => {
    const response = await fetch(`${API_URL}/profile`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  updateProfile: async (data) => {
    const response = await fetch(`${API_URL}/profile`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateEmail: async (email, password) => {
    const response = await fetch(`${API_URL}/profile/email`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await fetch(`${API_URL}/profile/password`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse(response);
  },

  deleteAccount: async (password) => {
    const response = await fetch(`${API_URL}/profile`, {
      method: "DELETE",
      headers: getHeaders(),
      body: JSON.stringify({ password }),
    });
    return handleResponse(response);
  },

  getDashboard: async () => {
    const response = await fetch(`${API_URL}/profile/dashboard`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ==================== USERS SETTINGS ====================
export const usersAPI = {
  getProfile: async () => {
    const response = await fetch(`${API_URL}/users/profile`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  updateProfile: async (data) => {
    const response = await fetch(`${API_URL}/users/profile`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await fetch(`${API_URL}/users/change-password`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse(response);
  },

  deleteAccount: async (password) => {
    const response = await fetch(`${API_URL}/users/account`, {
      method: "DELETE",
      headers: getHeaders(),
      body: JSON.stringify({ password }),
    });
    return handleResponse(response);
  },

  exportData: async () => {
    const response = await fetch(`${API_URL}/users/export-data`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ==================== ADMIN SYSTEM ====================
export const adminAPI = {
  getDashboard: async () => {
    const response = await fetch(`${API_URL}/admin/dashboard`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getUsers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/admin/users?${queryString}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  suspendUser: async (userId, reason = "Violated terms of service") => {
    const response = await fetch(`${API_URL}/admin/users/${userId}/suspend`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    });
    return handleResponse(response);
  },

  activateUser: async (userId) => {
    const response = await fetch(`${API_URL}/admin/users/${userId}/activate`, {
      method: "PATCH",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getLinks: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/admin/links?${queryString}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  disableLink: async (id) => {
    const response = await fetch(`${API_URL}/admin/links/${id}/disable`, {
      method: "PATCH",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  enableLink: async (id) => {
    const response = await fetch(`${API_URL}/admin/links/${id}/enable`, {
      method: "PATCH",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getTickets: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/admin/tickets?${queryString}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  updateTicketStatus: async (id, status, adminNotes = "") => {
    const response = await fetch(`${API_URL}/admin/tickets/${id}/status`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ status, adminNotes }),
    });
    return handleResponse(response);
  },

  getReports: async () => {
    const response = await fetch(`${API_URL}/admin/reports/logs`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getPlatformAnalytics: async () => {
    const response = await fetch(`${API_URL}/admin/platform-analytics`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getAbuseReports: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/admin/abuse-reports?${queryString}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  updateAbuseReportStatus: async (id, status) => {
    const response = await fetch(`${API_URL}/admin/abuse-reports/${id}/status`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },

  updateLinkSafety: async (linkId, safetyStatus, safetyReason = "") => {
    const response = await fetch(`${API_URL}/admin/links/${linkId}/safety`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ safetyStatus, safetyReason }),
    });
    return handleResponse(response);
  },
};

// ==================== LINKS ====================
export const linksAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/links?${queryString}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_URL}/links/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await fetch(`${API_URL}/shorten`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (id, data) => {
    const response = await fetch(`${API_URL}/links/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/links/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  bulkDelete: async (ids) => {
    const response = await fetch(`${API_URL}/links/bulk-delete`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ ids }),
    });
    return handleResponse(response);
  },

  bulkUpdateStatus: async (ids, status) => {
    const response = await fetch(`${API_URL}/links/bulk-status`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ ids, status }),
    });
    return handleResponse(response);
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/links/stats?${queryString}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  export: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/links/export?${queryString}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  checkPassword: async (code, password) => {
    const response = await fetch(`${API_URL}/links/check-password/${code}`, {
      method: "POST",
      headers: getHeaders(false),
      body: JSON.stringify({ password }),
    });
    return handleResponse(response);
  },
};

// ==================== QR CODES ====================
export const qrCodeAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/qrcode?${queryString}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_URL}/qrcode/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await fetch(`${API_URL}/qrcode`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (id, data) => {
    const response = await fetch(`${API_URL}/qrcode/${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/qrcode/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  trackDownload: async (id) => {
    const response = await fetch(`${API_URL}/qrcode/${id}/download`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/qrcode/stats?${queryString}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  bulkDelete: async (ids) => {
    const response = await fetch(`${API_URL}/qrcode/bulk-delete`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ ids }),
    });
    return handleResponse(response);
  },
};

// ==================== CONTACT ====================
export const contactAPI = {
  submit: async (data) => {
    const response = await fetch(`${API_URL}/contact`, {
      method: "POST",
      headers: getHeaders(true), // Include auth token if logged in
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Admin endpoints
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/contact?${queryString}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_URL}/contact/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  update: async (id, data) => {
    const response = await fetch(`${API_URL}/contact/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/contact/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getStats: async () => {
    const response = await fetch(`${API_URL}/contact/stats`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ==================== ANALYTICS ====================
export const analyticsAPI = {
  getOverall: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/analytics?${queryString}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getForLink: async (linkId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/analytics/link/${linkId}?${queryString}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getHeatmap: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/analytics/heatmap?${queryString}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getInsights: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/analytics/insights?${queryString}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  export: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/analytics/export?${queryString}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ==================== REPORTS ====================
export const reportsAPI = {
  getSettings: async () => {
    const response = await fetch(`${API_URL}/reports/settings`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  createSettings: async (data) => {
    const response = await fetch(`${API_URL}/reports/settings`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateSettings: async (data) => {
    const response = await fetch(`${API_URL}/reports/settings`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  sendNow: async () => {
    const response = await fetch(`${API_URL}/reports/send-now`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getLogs: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/reports/logs?${queryString}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ==================== DASHBOARD ====================
export const dashboardAPI = {
  getPublicStats: async () => {
    const response = await fetch(`${API_URL}/dashboard/public`, {
      headers: getHeaders(false),
    });
    return handleResponse(response);
  },

  getUserDashboard: async () => {
    const response = await fetch(`${API_URL}/dashboard`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ==================== WORKSPACES ====================
export const workspaceAPI = {
  createWorkspace: async (name) => {
    const response = await fetch(`${API_URL}/workspaces`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ name }),
    });
    return handleResponse(response);
  },

  getAllWorkspaces: async () => {
    const response = await fetch(`${API_URL}/workspaces`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getWorkspaceById: async (id) => {
    const response = await fetch(`${API_URL}/workspaces/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  updateWorkspace: async (id, name) => {
    const response = await fetch(`${API_URL}/workspaces/${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ name }),
    });
    return handleResponse(response);
  },

  deleteWorkspace: async (id) => {
    const response = await fetch(`${API_URL}/workspaces/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  inviteMember: async (id, email, role) => {
    const response = await fetch(`${API_URL}/workspaces/${id}/invite`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ email, role }),
    });
    return handleResponse(response);
  },

  updateMemberRole: async (id, memberId, role) => {
    const response = await fetch(`${API_URL}/workspaces/${id}/members/${memberId}/role`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ role }),
    });
    return handleResponse(response);
  },

  removeMember: async (id, memberId) => {
    const response = await fetch(`${API_URL}/workspaces/${id}/members/${memberId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  acceptInvite: async (id) => {
    const response = await fetch(`${API_URL}/workspaces/${id}/accept`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  declineInvite: async (id) => {
    const response = await fetch(`${API_URL}/workspaces/${id}/decline`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ==================== CUSTOM DOMAINS ====================
export const domainsAPI = {
  add: async (domain, workspaceId) => {
    const response = await fetch(`${API_URL}/domains`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ domain, workspaceId }),
    });
    return handleResponse(response);
  },

  getAll: async (workspaceId) => {
    const url = workspaceId 
      ? `${API_URL}/domains?workspaceId=${workspaceId}` 
      : `${API_URL}/domains`;
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_URL}/domains/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  verify: async (id) => {
    const response = await fetch(`${API_URL}/domains/${id}/verify`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  setDefault: async (id) => {
    const response = await fetch(`${API_URL}/domains/${id}/default`, {
      method: "PATCH",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/domains/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ==================== API KEYS ====================
export const apiKeysAPI = {
  create: async (name) => {
    const response = await fetch(`${API_URL}/api-keys`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ name }),
    });
    return handleResponse(response);
  },

  getAll: async () => {
    const response = await fetch(`${API_URL}/api-keys`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  revoke: async (id) => {
    const response = await fetch(`${API_URL}/api-keys/${id}/revoke`, {
      method: "PATCH",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/api-keys/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ==================== ABUSE REPORTING ====================
export const abuseAPI = {
  report: async (data) => {
    const response = await fetch(`${API_URL}/abuse/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

// ==================== EXPORT & IMPORT ====================
export const exportImportAPI = {
  downloadFile: async (path) => {
    const token = getToken();
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}/${path}`, { headers });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || "Failed to download export file");
    }
    return response.blob();
  },

  importLinks: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    
    const token = getToken();
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}/import/links`, {
      method: "POST",
      headers,
      body: formData,
    });
    return handleResponse(response);
  },
};

// ==================== NOTIFICATIONS ====================
export const notificationsAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/notifications?${queryString}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getUnreadCount: async () => {
    const response = await fetch(`${API_URL}/notifications/unread-count`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  markAsRead: async (id) => {
    const response = await fetch(`${API_URL}/notifications/${id}/read`, {
      method: "PATCH",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  markAllRead: async () => {
    const response = await fetch(`${API_URL}/notifications/read-all`, {
      method: "PATCH",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/notifications/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  clearRead: async () => {
    const response = await fetch(`${API_URL}/notifications/clear-read`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ==================== SMART FEATURES ====================
export const smartAPI = {
  getSlugSuggestions: async (title, originalUrl) => {
    const response = await fetch(`${API_URL}/smart/slug-suggestions`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ title, originalUrl }),
    });
    return handleResponse(response);
  },

  getTagSuggestions: async (originalUrl) => {
    const response = await fetch(`${API_URL}/smart/tag-suggestions`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ originalUrl }),
    });
    return handleResponse(response);
  },

  getBestTime: async () => {
    const response = await fetch(`${API_URL}/smart/best-time`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getAnomalies: async () => {
    const response = await fetch(`${API_URL}/smart/anomalies`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ==================== PUBLIC LINK ====================
export const publicAPI = {
  getLinkInfo: async (slug) => {
    const response = await fetch(`${API_URL}/public/links/${slug}/info`, {
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse(response);
  },

  verifyPassword: async (slug, password) => {
    const response = await fetch(`${API_URL}/public/links/${slug}/verify-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    return handleResponse(response);
  },
};

export default {
  auth: authAPI,
  profile: profileAPI,
  links: linksAPI,
  qrCode: qrCodeAPI,
  contact: contactAPI,
  analytics: analyticsAPI,
  reports: reportsAPI,
  dashboard: dashboardAPI,
  users: usersAPI,
  admin: adminAPI,
  workspace: workspaceAPI,
  domains: domainsAPI,
  apiKeys: apiKeysAPI,
  abuse: abuseAPI,
  exportImport: exportImportAPI,
  notifications: notificationsAPI,
  smart: smartAPI,
  public: publicAPI,
};

