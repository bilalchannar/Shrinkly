import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Components/Sidebar";
import Footer from "../Components/Footer";
import { profileAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../Css/Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUser, logout, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const originalData = useRef(null);

  const [formData, setFormData] = useState({
    displayName: user?.displayName || user?.username || "",
    username: user?.username || "",
    bio: user?.bio || "",
    email: user?.email || "",
    phone: user?.phone || "",
    company: user?.company || "",
    location: user?.location || ""
  });

  const [stats, setStats] = useState({
    totalLinks: 0,
    totalClicks: 0,
    totalQRCodes: 0
  });

  const [activeTab, setActiveTab] = useState("profile");
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [deletePassword, setDeletePassword] = useState("");

  useEffect(() => {
    if (!authLoading) {
      fetchProfile();
    }
  }, [authLoading]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await profileAPI.getProfile();
      if (data.success) {
        const fetched = {
          displayName: data.user.displayName || "",
          username: data.user.username || "",
          bio: data.user.bio || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
          company: data.user.company || "",
          location: data.user.location || ""
        };
        setFormData(fetched);
        originalData.current = fetched;
        if (data.stats) {
          setStats({
            totalLinks: data.stats.totalLinks || 0,
            totalClicks: data.stats.totalClicks || 0,
            totalQRCodes: data.stats.totalQRCodes || 0
          });
        }
      } else {
        if (user) {
          const fallback = {
            displayName: user.displayName || user.username || "",
            username: user.username || "",
            bio: user.bio || "",
            email: user.email || "",
            phone: user.phone || "",
            company: user.company || "",
            location: user.location || ""
          };
          setFormData(fallback);
          originalData.current = fallback;
        }
        showMessage("error", data.message || "Failed to load profile");
      }
    } catch (error) {
      if (user) {
        const fallback = {
          displayName: user.displayName || user.username || "",
          username: user.username || "",
          bio: user.bio || "",
          email: user.email || "",
          phone: user.phone || "",
          company: user.company || "",
          location: user.location || ""
        };
        setFormData(fallback);
        originalData.current = fallback;
      }
      showMessage("error", error.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleCancel = () => {
    if (originalData.current) {
      setFormData(originalData.current);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const data = await profileAPI.updateProfile({
        username: formData.username,
        displayName: formData.displayName,
        bio: formData.bio,
        phone: formData.phone,
        company: formData.company,
        location: formData.location
      });
      if (data.success) {
        updateUser(data.user);
        originalData.current = { ...formData };
        showMessage("success", "Profile updated successfully!");
      }
    } catch (error) {
      showMessage("error", error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage("error", "New passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      showMessage("error", "Password must be at least 6 characters");
      return;
    }
    try {
      setSaving(true);
      const data = await profileAPI.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      if (data.success) {
        showMessage("success", "Password changed successfully!");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (error) {
      showMessage("error", error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      showMessage("error", "Please enter your password to confirm");
      return;
    }
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }
    try {
      setDeleting(true);
      const data = await profileAPI.deleteAccount(deletePassword);
      if (data.success) {
        logout();
        navigate("/");
      }
    } catch (error) {
      showMessage("error", error.message);
    } finally {
      setDeleting(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num;
  };

  if (loading && !formData.email) {
    return (
      <>
        <Sidebar />
        <div className="main-content">
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
            <p>Loading profile...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <div className="main-content">
        <div className="profile-page">
          <header className="profile-header">
            <div className="profile-header-left">
              <h1>Account Settings</h1>
              <p>Manage your personal information and security</p>
            </div>
            <div className="profile-header-right">
              <span className="last-login">Last active: Just now</span>
            </div>
          </header>

          {message.text && (
            <div className={`alert alert-${message.type}`} style={{
              padding: "12px 20px",
              margin: "0 20px 20px",
              borderRadius: "8px",
              backgroundColor: message.type === "success" ? "#d4edda" : "#f8d7da",
              color: message.type === "success" ? "#155724" : "#721c24",
              border: `1px solid ${message.type === "success" ? "#c3e6cb" : "#f5c6cb"}`
            }}>
              {message.text}
            </div>
          )}

          <div className="profile-container">
            <div className="profile-sidebar">
              <nav className="profile-nav">
                <button
                  className={`profile-nav-item ${activeTab === "profile" ? "active" : ""}`}
                  onClick={() => setActiveTab("profile")}
                >
                  <span className="nav-item-icon">👤</span>
                  <span>Profile Info</span>
                </button>
                <button
                  className={`profile-nav-item ${activeTab === "security" ? "active" : ""}`}
                  onClick={() => setActiveTab("security")}
                >
                  <span className="nav-item-icon">🔒</span>
                  <span>Security</span>
                </button>
                <button
                  className={`profile-nav-item ${activeTab === "notifications" ? "active" : ""}`}
                  onClick={() => setActiveTab("notifications")}
                >
                  <span className="nav-item-icon">🔔</span>
                  <span>Notifications</span>
                </button>
                <button
                  className={`profile-nav-item ${activeTab === "billing" ? "active" : ""}`}
                  onClick={() => setActiveTab("billing")}
                >
                  <span className="nav-item-icon">💳</span>
                  <span>Billing</span>
                </button>
              </nav>

              <div className="profile-stats-card">
                <h3>Your Stats</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-value">{formatNumber(stats.totalLinks)}</span>
                    <span className="stat-label">Links Created</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{formatNumber(stats.totalClicks)}</span>
                    <span className="stat-label">Total Clicks</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{formatNumber(stats.totalQRCodes)}</span>
                    <span className="stat-label">QR Codes</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{user?.plan || "Free"}</span>
                    <span className="stat-label">Plan</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-main-content">
              {activeTab === "profile" && (
                <div className="profile-card">
                  <div className="avatar-section">
                    <div className="avatar-wrapper">
                      <div className="profile-avatar">
                        <span>
                          {formData.displayName && formData.displayName.trim() ? (
                            formData.displayName.trim().split(/\s+/).length > 1 ? 
                              (formData.displayName.trim().split(/\s+/)[0][0] || "").toUpperCase() + (formData.displayName.trim().split(/\s+/)[1][0] || "").toUpperCase() : 
                              (formData.displayName.trim()[0] || "").toUpperCase()
                          ) : (formData.username ? (formData.username[0] || "").toUpperCase() : "U")}
                        </span>
                      </div>
                      <button className="edit-avatar-btn">📷</button>
                    </div>
                    <div className="avatar-info">
                      <h2>{formData.displayName || formData.username}</h2>
                      <p>@{formData.username}</p>
                      <span className="member-badge">{user?.plan === "pro" ? "Pro" : "Free"} Member</span>
                    </div>
                  </div>

                  <form className="profile-form" onSubmit={handleSubmit}>
                    <div className="form-section-title">Personal Information</div>

                    <div className="form-row">
                      <div className="form-field">
                        <label className="field-label">Display Name</label>
                        <input
                          className="field-input"
                          type="text"
                          name="displayName"
                          value={formData.displayName}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="form-field">
                        <label className="field-label">Username</label>
                        <div className="username-row">
                          <span className="username-prefix">@</span>
                          <input
                            className="field-input username-input"
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label className="field-label">Email</label>
                        <input
                          className="field-input"
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          disabled
                          style={{ backgroundColor: "#f0f0f0" }}
                        />
                        <small style={{ color: "#666" }}>Email cannot be changed here</small>
                      </div>
                      <div className="form-field">
                        <label className="field-label">Phone</label>
                        <input
                          className="field-input"
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label className="field-label">Company</label>
                        <input
                          className="field-input"
                          type="text"
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="form-field">
                        <label className="field-label">Location</label>
                        <input
                          className="field-input"
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="form-field full-width">
                      <label className="field-label">Bio</label>
                      <textarea
                        className="field-input textarea"
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows="3"
                      />
                    </div>

                    <div className="form-actions">
                      <button type="button" className="btn-cancel" onClick={handleCancel}>Cancel</button>
                      <button type="submit" className="btn-save" disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === "security" && (
                <div className="profile-card">
                  <h2 style={{ marginBottom: "20px" }}>Change Password</h2>
                  <form className="profile-form" onSubmit={handleChangePassword}>
                    <div className="form-field full-width">
                      <label className="field-label">Current Password</label>
                      <input
                        className="field-input"
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-field">
                        <label className="field-label">New Password</label>
                        <input
                          className="field-input"
                          type="password"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          required
                          minLength={6}
                        />
                      </div>
                      <div className="form-field">
                        <label className="field-label">Confirm New Password</label>
                        <input
                          className="field-input"
                          type="password"
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn-save" disabled={saving}>
                        {saving ? "Changing..." : "Change Password"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="profile-card">
                  <h2 style={{ marginBottom: "20px" }}>Notification Preferences</h2>
                  <p style={{ color: "#666" }}>Notification settings coming soon...</p>
                </div>
              )}

              {activeTab === "billing" && (
                <div className="profile-card">
                  <h2 style={{ marginBottom: "20px" }}>Billing & Plans</h2>
                  <p style={{ color: "#666" }}>Billing features coming soon...</p>
                </div>
              )}

              <div className="danger-zone">
                <h3>Danger Zone</h3>
                <p>Once you delete your account, there is no going back. Please be certain.</p>
                <div style={{ display: "flex", gap: "10px", marginTop: "15px", alignItems: "center" }}>
                  <input
                    type="password"
                    placeholder="Enter password to confirm"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    style={{
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                      width: "250px"
                    }}
                  />
                  <button className="btn-danger" onClick={handleDeleteAccount} disabled={deleting}>
                    {deleting ? "Deleting..." : "Delete Account"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}