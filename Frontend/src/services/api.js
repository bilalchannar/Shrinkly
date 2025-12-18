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
  signup: async (username, email, password) => {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: getHeaders(false),
      body: JSON.stringify({ username, email, password }),
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

  getStats: async () => {
    const response = await fetch(`${API_URL}/links/stats`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  export: async () => {
    const response = await fetch(`${API_URL}/links/export`, {
      headers: getHeaders(),
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
      method: "PUT",
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

  getStats: async () => {
    const response = await fetch(`${API_URL}/qrcode/stats`, {
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
      headers: getHeaders(false), // No auth needed for contact form
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

export default {
  auth: authAPI,
  profile: profileAPI,
  links: linksAPI,
  qrCode: qrCodeAPI,
  contact: contactAPI,
  analytics: analyticsAPI,
  dashboard: dashboardAPI,
};
