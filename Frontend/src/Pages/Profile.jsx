import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Components/Sidebar";
import Footer from "../Components/Footer";
import { usersAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import "../Css/Profile.css";

function formatLastActive(date) {
  if (!date) return 'Never';
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(date).toLocaleDateString();
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUser, logout, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  
  const [activeTab, setActiveTab] = useState("profile");

  // Profile data state
  const [formData, setFormData] = useState({
    displayName: "",
    username: "",
    bio: "",
    email: "",
    phone: "",
    company: "",
    location: ""
  });
  const [profileImage, setProfileImage] = useState("");

  // Preferences state
  const [timezone, setTimezone] = useState("UTC");
  const [defaultDomain, setDefaultDomain] = useState("shrinkly.link");
  const [defaultQrForegroundColor, setDefaultQrForegroundColor] = useState("#6f42c1");
  const [defaultQrBackgroundColor, setDefaultQrBackgroundColor] = useState("#ffffff");
  const [emailReportsEnabled, setEmailReportsEnabled] = useState(true);

  // Security state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Data & Privacy state
  const [deletePassword, setDeletePassword] = useState("");

  // Billing state
  const [billingPlan, setBillingPlan] = useState("free");

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!authLoading) {
      fetchProfile();
    }
  }, [authLoading]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await usersAPI.getProfile();
      if (data.success) {
        setFormData({
          displayName: data.user.displayName || "",
          username: data.user.username || "",
          bio: data.user.bio || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
          company: data.user.company || "",
          location: data.user.location || ""
        });
        setProfileImage(data.user.profileImage || data.user.avatar || "");
        setTimezone(data.user.timezone || "UTC");
        setDefaultDomain(data.user.defaultDomain || "shrinkly.link");
        setDefaultQrForegroundColor(data.user.defaultQrForegroundColor || "#6f42c1");
        setDefaultQrBackgroundColor(data.user.defaultQrBackgroundColor || "#ffffff");
        setEmailReportsEnabled(data.user.emailReportsEnabled ?? true);
        setBillingPlan(data.user.billingPlan || data.user.plan || "free");
      }
    } catch (error) {
      toast.error(error.message || "Failed to load profile settings");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error("Avatar image must be less than 1MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await usersAPI.updateProfile({
        displayName: formData.displayName.trim(),
        bio: formData.bio.trim(),
        phone: formData.phone.trim(),
        company: formData.company.trim(),
        location: formData.location.trim(),
        profileImage
      });
      if (res.success) {
        updateUser(res.user);
        toast.success("Profile details updated successfully!");
      }
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    try {
      setSaving(true);
      const res = await usersAPI.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      if (res.success) {
        toast.success("Password changed successfully!");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (error) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await usersAPI.updateProfile({
        timezone,
        defaultDomain,
        defaultQrForegroundColor,
        defaultQrBackgroundColor,
        emailReportsEnabled
      });
      if (res.success) {
        updateUser(res.user);
        toast.success("Preferences updated successfully!");
      }
    } catch (error) {
      toast.error(error.message || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      setSaving(true);
      const res = await usersAPI.exportData();
      if (res.success) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.exportData, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `shrinkly-data-${user?.username || 'user'}-${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        toast.success("Personal data exported successfully!");
      }
    } catch (error) {
      toast.error(error.message || "Failed to export data");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error("Please enter your current password to authorize deletion");
      return;
    }
    setConfirmAction({
      title: "Confirm Account Deletion",
      message: "Are you sure you want to permanently delete your account? This will erase your links, analytics records, customized QR codes, and report preferences. This action cannot be reversed.",
      onConfirm: async () => {
        setConfirmAction(null);
        try {
          setDeleting(true);
          const res = await usersAPI.deleteAccount(deletePassword);
          if (res.success) {
            toast.success("Account permanently deleted. Hope to see you again!");
            logout();
            navigate("/");
          }
        } catch (error) {
          toast.error(error.message || "Failed to delete account");
        } finally {
          setDeleting(false);
        }
      }
    });
  };

  const handleDemoPlanUpdate = async (planName) => {
    try {
      setSaving(true);
      const res = await usersAPI.updateProfile({ billingPlan: planName });
      if (res.success) {
        setBillingPlan(planName);
        updateUser(res.user);
        toast.success(`Demo membership changed to ${planName.toUpperCase()}!`);
      }
    } catch (error) {
      toast.error(error.message || "Failed to update subscription");
    } finally {
      setSaving(false);
    }
  };

  const commonTimezones = [
    { value: "UTC", label: "UTC (Coordinated Universal Time)" },
    { value: "America/New_York", label: "EST / EDT (Eastern Time)" },
    { value: "America/Chicago", label: "CST / CDT (Central Time)" },
    { value: "America/Denver", label: "MST / MDT (Mountain Time)" },
    { value: "America/Los_Angeles", label: "PST / PDT (Pacific Time)" },
    { value: "Europe/London", label: "GMT / BST (London)" },
    { value: "Europe/Paris", label: "CET / CEST (Paris, Berlin, Rome)" },
    { value: "Asia/Tokyo", label: "JST (Tokyo, Seoul)" },
    { value: "Asia/Kolkata", label: "IST (India Standard Time)" },
    { value: "Australia/Sydney", label: "AEST / AEDT (Sydney, Melbourne)" }
  ];

  if (loading && !formData.email) {
    return (
      <>
        <Sidebar />
        <div className="main-content">
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", flexDirection: 'column', gap: '15px' }}>
            <div className="loading-spinner"></div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading settings profile...</p>
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
          {/* Header */}
          <header className="profile-header">
            <div className="profile-header-left">
              <h1>Account Settings</h1>
              <p>Configure personal profiles, security preferences, and membership details</p>
            </div>
            <div className="profile-header-right">
              <span className="last-login">Last active: {formatLastActive(user?.lastLogin)}</span>
            </div>
          </header>

          <div className="profile-container">
            {/* Sidebar Navigation */}
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
                  className={`profile-nav-item ${activeTab === "preferences" ? "active" : ""}`}
                  onClick={() => setActiveTab("preferences")}
                >
                  <span className="nav-item-icon">⚙️</span>
                  <span>Preferences</span>
                </button>
                <button
                  className={`profile-nav-item ${activeTab === "privacy" ? "active" : ""}`}
                  onClick={() => setActiveTab("privacy")}
                >
                  <span className="nav-item-icon">🛡️</span>
                  <span>Data &amp; Privacy</span>
                </button>
                <button
                  className={`profile-nav-item ${activeTab === "billing" ? "active" : ""}`}
                  onClick={() => setActiveTab("billing")}
                >
                  <span className="nav-item-icon">💳</span>
                  <span>Billing Plan</span>
                </button>
              </nav>

              {/* Mini Stats Card */}
              <div className="profile-stats-card">
                <h3>Subscription Summary</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">Current Plan</span>
                    <span className="stat-value" style={{ textTransform: "capitalize", color: 'var(--primary-color)' }}>
                      {billingPlan}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Email Reports</span>
                    <span className="stat-value">{emailReportsEnabled ? "ON" : "OFF"}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Timezone</span>
                    <span className="stat-value" style={{ fontSize: '0.8rem' }}>{timezone.split("/").pop().replace("_", " ")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Details Panel */}
            <div className="profile-main-content">
              {/* ===== Tab 1: Profile ===== */}
              {activeTab === "profile" && (
                <div className="profile-card">
                  <div className="avatar-section">
                    <div className="avatar-wrapper">
                      <div className="profile-avatar">
                        {profileImage ? (
                          <img src={profileImage} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <span>
                            {formData.displayName && formData.displayName.trim() ? (
                              formData.displayName.trim().split(/\s+/).length > 1 ? 
                                (formData.displayName.trim().split(/\s+/)[0][0] || "").toUpperCase() + (formData.displayName.trim().split(/\s+/)[1][0] || "").toUpperCase() : 
                                (formData.displayName.trim()[0] || "").toUpperCase()
                            ) : (formData.username ? (formData.username[0] || "").toUpperCase() : "U")}
                          </span>
                        )}
                      </div>
                      <button className="edit-avatar-btn" onClick={() => fileInputRef.current && fileInputRef.current.click()}>📷</button>
                      <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef} 
                        onChange={handleAvatarUpload} 
                        style={{ display: 'none' }} 
                      />
                    </div>
                    <div className="avatar-info">
                      <h2>{formData.displayName || formData.username}</h2>
                      <p>@{formData.username}</p>
                      <span className="member-badge">{billingPlan.toUpperCase()} Member</span>
                    </div>
                  </div>

                  <form className="profile-form" onSubmit={handleProfileSubmit}>
                    <div className="form-section-title">Personal Profile Details</div>

                    <div className="form-row">
                      <div className="form-field">
                        <label className="field-label">Display Name</label>
                        <input
                          className="field-input"
                          type="text"
                          name="displayName"
                          placeholder="Your public display name"
                          value={formData.displayName}
                          onChange={handleProfileChange}
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
                            disabled
                            style={{ backgroundColor: "#f0f0f0", cursor: 'not-allowed' }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label className="field-label">Email Address</label>
                        <input
                          className="field-input"
                          type="email"
                          name="email"
                          value={formData.email}
                          disabled
                          style={{ backgroundColor: "#f0f0f0", cursor: 'not-allowed' }}
                        />
                        <small style={{ color: "#777" }}>Contact support to change your account email.</small>
                      </div>
                      <div className="form-field">
                        <label className="field-label">Phone Number</label>
                        <input
                          className="field-input"
                          type="tel"
                          name="phone"
                          placeholder="E.g., +1 234 567 890"
                          value={formData.phone}
                          onChange={handleProfileChange}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label className="field-label">Company / Organization</label>
                        <input
                          className="field-input"
                          type="text"
                          name="company"
                          placeholder="Company name"
                          value={formData.company}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div className="form-field">
                        <label className="field-label">Location</label>
                        <input
                          className="field-input"
                          type="text"
                          name="location"
                          placeholder="E.g., New York, USA"
                          value={formData.location}
                          onChange={handleProfileChange}
                        />
                      </div>
                    </div>

                    <div className="form-field full-width">
                      <label className="field-label">Bio (Brief description)</label>
                      <textarea
                        className="field-input textarea"
                        name="bio"
                        placeholder="Tell us about yourself..."
                        value={formData.bio}
                        onChange={handleProfileChange}
                        rows="3"
                      />
                    </div>

                    {profileImage && (
                      <div className="form-field">
                        <label className="field-label">Avatar URL</label>
                        <input 
                          className="field-input" 
                          type="text" 
                          value={profileImage.substring(0, 150) + (profileImage.length > 150 ? "..." : "")}
                          disabled 
                        />
                        <button type="button" className="btn-cancel" onClick={() => setProfileImage("")} style={{ marginTop: '8px', padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
                          Remove Image
                        </button>
                      </div>
                    )}

                    <div className="form-actions">
                      <button type="submit" className="btn-save" disabled={saving}>
                        {saving ? "Saving..." : "Save Profile"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ===== Tab 2: Security ===== */}
              {activeTab === "security" && (
                <div className="profile-card">
                  <h2 style={{ marginBottom: "8px", fontWeight: 800 }}>Change Password</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                    Ensure your account is protected with a secure and complex password.
                  </p>
                  
                  <form className="profile-form" onSubmit={handlePasswordSubmit}>
                    <div className="form-field full-width">
                      <label className="field-label">Current Password</label>
                      <input
                        className="field-input"
                        type="password"
                        name="currentPassword"
                        placeholder="Enter current password"
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
                          placeholder="Minimum 6 characters"
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
                          placeholder="Re-type new password"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-actions" style={{ marginTop: '1rem' }}>
                      <button type="submit" className="btn-save" disabled={saving}>
                        {saving ? "Updating..." : "Change Password"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ===== Tab 3: Preferences ===== */}
              {activeTab === "preferences" && (
                <div className="profile-card">
                  <h2 style={{ marginBottom: "8px", fontWeight: 800 }}>Preferences</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                    Customize default domains, QR styles, schedules, and report deliveries.
                  </p>

                  <form className="profile-form" onSubmit={handlePreferencesSubmit}>
                    <div className="form-row">
                      <div className="form-field">
                        <label className="field-label">Account Timezone</label>
                        <select
                          className="field-input"
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                        >
                          {commonTimezones.map(tz => (
                            <option key={tz.value} value={tz.value}>
                              {tz.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-field">
                        <label className="field-label">Default Domain</label>
                        <select
                          className="field-input"
                          value={defaultDomain}
                          onChange={(e) => setDefaultDomain(e.target.value)}
                        >
                          <option value="shrinkly.link">shrinkly.link (Standard)</option>
                          <option value="shrink.me">shrink.me (Pro &amp; Enterprise)</option>
                          <option value="myurl.co">myurl.co (Enterprise only)</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-section-title" style={{ marginTop: '1rem' }}>Default QR Styling Preference</div>
                    
                    <div className="form-row">
                      <div className="form-field">
                        <label className="field-label">Default Modules Color</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-primary)', border: '1.5px solid var(--border-color)', borderRadius: '12px', padding: '0.5rem 1rem' }}>
                          <input
                            type="color"
                            value={defaultQrForegroundColor}
                            onChange={(e) => setDefaultQrForegroundColor(e.target.value)}
                            style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'none' }}
                          />
                          <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{defaultQrForegroundColor}</span>
                        </div>
                      </div>

                      <div className="form-field">
                        <label className="field-label">Default Background Color</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-primary)', border: '1.5px solid var(--border-color)', borderRadius: '12px', padding: '0.5rem 1rem' }}>
                          <input
                            type="color"
                            value={defaultQrBackgroundColor}
                            onChange={(e) => setDefaultQrBackgroundColor(e.target.value)}
                            style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'none' }}
                          />
                          <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{defaultQrBackgroundColor}</span>
                        </div>
                      </div>
                    </div>

                    <div className="form-section-title" style={{ marginTop: '1rem' }}>Email Performance reports</div>

                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        id="emailReportsEnabled"
                        checked={emailReportsEnabled}
                        onChange={(e) => setEmailReportsEnabled(e.target.checked)}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                      <label htmlFor="emailReportsEnabled" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                        Receive weekly and monthly performance reports in email
                      </label>
                    </div>

                    <div className="form-actions" style={{ marginTop: '1rem' }}>
                      <button type="submit" className="btn-save" disabled={saving}>
                        {saving ? "Saving..." : "Save Preferences"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ===== Tab 4: Data & Privacy ===== */}
              {activeTab === "privacy" && (
                <div className="profile-card">
                  <h2 style={{ marginBottom: "8px", fontWeight: 800 }}>Data &amp; Privacy</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                    Control your account details, export history datasets, or permanently close the account.
                  </p>

                  <div className="form-section-title">GDPR Data Export</div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                    Download a comprehensive JSON package containing your user profile, active links, qr configurations, analytics reports, and scheduler variables.
                  </p>
                  
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={handleExportData}
                    disabled={saving}
                    style={{ width: '100%', padding: '1rem', border: '1.5px dashed var(--border-color)', background: 'var(--bg-primary)', color: 'var(--primary-color)', fontWeight: 700 }}
                  >
                    {saving ? "Generating JSON export..." : "📥 Export My Personal Data (JSON)"}
                  </button>

                  <div className="danger-zone" style={{ marginTop: '3rem' }}>
                    <h3>Danger Zone</h3>
                    <p>Deleting your account is permanent. This erases all links, clicks, and codes instantly.</p>
                    
                    <div style={{ display: "flex", gap: "10px", marginTop: "15px", alignItems: "center", flexWrap: "wrap" }}>
                      <input
                        type="password"
                        placeholder="Enter password to confirm"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        style={{
                          padding: "0.85rem 1rem",
                          borderRadius: "10px",
                          border: "1.5px solid var(--error-border)",
                          backgroundColor: "var(--bg-primary)",
                          color: "var(--text-primary)",
                          outline: "none",
                          width: "250px"
                        }}
                      />
                      <button 
                        className="btn-danger" 
                        onClick={handleDeleteAccount} 
                        disabled={deleting}
                        style={{ padding: '0.85rem 2rem' }}
                      >
                        {deleting ? "Closing..." : "Delete Account"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== Tab 5: Billing Plan ===== */}
              {activeTab === "billing" && (
                <div className="profile-card">
                  <h2 style={{ marginBottom: "8px", fontWeight: 800 }}>Billing &amp; Subscription</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                    Choose the plan that suits you best. Upgrades can be toggled instantly for demo purposes.
                  </p>

                  <div className="billing-current-info" style={{ padding: '1.25rem', background: 'rgba(var(--primary-rgb), 0.05)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Current Plan Status</span>
                      <h3 style={{ margin: '4px 0 0', textTransform: 'capitalize', color: 'var(--primary-color)', fontSize: '1.3rem', fontWeight: 800 }}>{billingPlan}</h3>
                    </div>
                    <span className="member-badge" style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}>Active Plan</span>
                  </div>

                  <div className="billing-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                    {/* Free Card */}
                    <div className="billing-card" style={{
                      border: billingPlan === "free" ? "2.5px solid var(--primary-color)" : "1.5px solid var(--border-color)",
                      borderRadius: '16px',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      background: 'var(--bg-primary)',
                      position: 'relative'
                    }}>
                      {billingPlan === "free" && <span style={{ position: 'absolute', top: '-12px', right: '15px', background: 'var(--primary-color)', color: 'white', fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '10px', fontWeight: 'bold' }}>CURRENT</span>}
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Free Plan</h4>
                        <div style={{ margin: '15px 0', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>$0<span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>/mo</span></div>
                        <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px', margin: '0 0 20px 0' }}>
                          <li>Up to 25 short links</li>
                          <li>Basic QR Code generator</li>
                          <li>24h analytics tracking</li>
                          <li>Standard support</li>
                        </ul>
                      </div>
                      <button 
                        type="button" 
                        className="btn-primary" 
                        disabled={billingPlan === "free" || saving} 
                        onClick={() => handleDemoPlanUpdate("free")}
                        style={{ width: '100%', padding: '0.75rem', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: billingPlan === "free" ? '#ccc' : 'var(--primary-color)', color: 'white' }}
                      >
                        {billingPlan === "free" ? "Active" : "Downgrade"}
                      </button>
                    </div>

                    {/* Pro Card */}
                    <div className="billing-card" style={{
                      border: billingPlan === "pro" ? "2.5px solid var(--primary-color)" : "1.5px solid var(--border-color)",
                      borderRadius: '16px',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      background: 'var(--bg-primary)',
                      position: 'relative'
                    }}>
                      {billingPlan === "pro" && <span style={{ position: 'absolute', top: '-12px', right: '15px', background: 'var(--primary-color)', color: 'white', fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '10px', fontWeight: 'bold' }}>CURRENT</span>}
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Pro Plan</h4>
                        <div style={{ margin: '15px 0', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>$12<span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>/mo</span></div>
                        <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px', margin: '0 0 20px 0' }}>
                          <li>Unlimited short links</li>
                          <li>Premium QR Customizer</li>
                          <li>Weekly email reports</li>
                          <li>Advanced browser info</li>
                        </ul>
                      </div>
                      <button 
                        type="button" 
                        className="btn-primary" 
                        disabled={billingPlan === "pro" || saving} 
                        onClick={() => handleDemoPlanUpdate("pro")}
                        style={{ width: '100%', padding: '0.75rem', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: billingPlan === "pro" ? '#ccc' : 'var(--primary-color)', color: 'white' }}
                      >
                        {billingPlan === "pro" ? "Active" : "Activate Pro"}
                      </button>
                    </div>

                    {/* Enterprise Card */}
                    <div className="billing-card" style={{
                      border: billingPlan === "enterprise" ? "2.5px solid var(--primary-color)" : "1.5px solid var(--border-color)",
                      borderRadius: '16px',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      background: 'var(--bg-primary)',
                      position: 'relative'
                    }}>
                      {billingPlan === "enterprise" && <span style={{ position: 'absolute', top: '-12px', right: '15px', background: 'var(--primary-color)', color: 'white', fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '10px', fontWeight: 'bold' }}>CURRENT</span>}
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Enterprise</h4>
                        <div style={{ margin: '15px 0', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>$49<span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>/mo</span></div>
                        <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px', margin: '0 0 20px 0' }}>
                          <li>Custom domain linking</li>
                          <li>Team profile sharing</li>
                          <li>Monthly summaries</li>
                          <li>Priority support</li>
                        </ul>
                      </div>
                      <button 
                        type="button" 
                        className="btn-primary" 
                        disabled={billingPlan === "enterprise" || saving} 
                        onClick={() => handleDemoPlanUpdate("enterprise")}
                        style={{ width: '100%', padding: '0.75rem', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: billingPlan === "enterprise" ? '#ccc' : 'var(--primary-color)', color: 'white' }}
                      >
                        {billingPlan === "enterprise" ? "Active" : "Activate Enterprise"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {confirmAction && (
        <div className="modal-overlay-ds" onClick={() => setConfirmAction(null)}>
          <div className="modal-content-ds" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '12px', color: 'var(--error-color)' }}>{confirmAction.title}</h2>
            <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>{confirmAction.message}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="btn-cancel"
                onClick={() => setConfirmAction(null)}
                style={{ padding: '10px 24px', borderRadius: '8px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={confirmAction.onConfirm}
                style={{ padding: '10px 24px', borderRadius: '8px', cursor: 'pointer' }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
}