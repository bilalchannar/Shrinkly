import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { notificationsAPI } from "../services/api";
import "../Css/Sidebar.css";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isAuthenticated, user, workspaces, activeWorkspace, setActiveWorkspace } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [dropdownNotifs, setDropdownNotifs] = useState([]);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setMobileOpen(false);
    setShowNotifDropdown(false);
  }, [location]);

  // Fetch unread count on mount and periodically
  useEffect(() => {
    if (!isAuthenticated()) return;
    
    const fetchUnread = async () => {
      try {
        const data = await notificationsAPI.getUnreadCount();
        if (data.success) setUnreadCount(data.count);
      } catch {}
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, [isAuthenticated()]); // eslint-disable-line

  const fetchDropdownNotifs = async () => {
    try {
      const data = await notificationsAPI.getAll({ isRead: "false" });
      if (data.success) {
        setDropdownNotifs(data.notifications.slice(0, 5));
      }
    } catch {}
  };

  const handleBellClick = () => {
    if (!showNotifDropdown) fetchDropdownNotifs();
    setShowNotifDropdown(!showNotifDropdown);
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setDropdownNotifs(prev => prev.filter(n => n._id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const typeIcon = (type) => {
    switch (type) {
      case "success": return "✅";
      case "warning": return "⚠️";
      case "danger": return "🚨";
      default: return "ℹ️";
    }
  };

  const toggleSidebar = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebarCollapsed', String(next));
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const pages = [
    { name: "Home", icon: "🏠", path: "/home" },
    { name: "Workspaces", icon: "🏢", path: "/workspace" },
    { name: "Link Management", icon: "🔗", path: "/link" },
    { name: "Analytics", icon: "📊", path: "/analytics" },
    { name: "Reports", icon: "📄", path: "/reports" },
    { name: "QR Code", icon: "📱", path: "/qrcode" },
    { name: "Custom Domains", icon: "🌐", path: "/domains" },
    { name: "API Access", icon: "🔑", path: "/api-access" },
    { name: "Notifications", icon: "🔔", path: "/notifications" },
    { name: "Contact", icon: "📞", path: "/contact" },
    { name: "Profile", icon: "👤", path: "/profile" },
    { name: "Project Info", icon: "ℹ️", path: "/project-info" },
  ];

  if (user?.role === "admin" || user?.role === "superadmin") {
    pages.push({ name: "Admin Panel", icon: "🛡️", path: "/admin" });
  }

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button 
        className={`mobile-hamburger ${mobileOpen ? "open" : ""}`} 
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation menu"
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      {/* Mobile Backdrop overlay */}
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      <div className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      {/* Logo Section */}
      <div className="sidebar-logo-section">
        <div className="logo-wrapper">
          <img 
            src={collapsed ? "/ShrinklyBlackLogo.png" : "/ShrinklyBlack.png"} 
            alt="Shrinkly Logo" 
            className="sidebar-logo"
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* Notification Bell */}
          {isAuthenticated() && (
            <div style={{ position: "relative" }}>
              <button 
                className="notif-bell-btn"
                onClick={handleBellClick}
                aria-label="Notifications"
                title="Notifications"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="notif-badge-count">{unreadCount > 9 ? "9+" : unreadCount}</span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifDropdown && (
                <div className="notif-dropdown" onClick={e => e.stopPropagation()}>
                  <div className="notif-dropdown-header">
                    <strong>Notifications</strong>
                    <button onClick={() => { setShowNotifDropdown(false); navigate("/notifications"); }}>View All</button>
                  </div>
                  <div className="notif-dropdown-list">
                    {dropdownNotifs.length === 0 ? (
                      <div className="notif-dropdown-empty">No unread notifications</div>
                    ) : (
                      dropdownNotifs.map((n) => (
                        <div key={n._id} className="notif-dropdown-item">
                          <span className="notif-dropdown-icon">{typeIcon(n.type)}</span>
                          <div className="notif-dropdown-body">
                            <strong>{n.title}</strong>
                            <p>{n.message}</p>
                            <span className="notif-dropdown-time">{timeAgo(n.createdAt)}</span>
                          </div>
                          <button className="notif-dropdown-mark" onClick={() => handleMarkRead(n._id)} title="Mark read">✓</button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <button className="toggle-btn" onClick={toggleSidebar} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? "→" : "←"}
          </button>
        </div>
      </div>

      {/* Workspace Switcher */}
      {isAuthenticated() && (
        <div className="sidebar-workspace-switcher">
          {!collapsed ? (
            <>
              <label className="workspace-label">Workspace</label>
              <select 
                value={activeWorkspace} 
                onChange={(e) => setActiveWorkspace(e.target.value)}
                className="workspace-select"
              >
                <option value="personal">👤 Personal Space</option>
                {workspaces.map((ws) => (
                  <option key={ws._id} value={ws._id}>
                    {ws.status === "invited" ? "✉️ (Invited) " : "🏢 "}{ws.name}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <button 
              className="workspace-collapsed-indicator" 
              onClick={() => navigate("/workspace")}
              title="Manage Workspaces"
              aria-label="Manage Workspaces"
            >
              🏢
            </button>
          )}
        </div>
      )}

      {/* Navigation Links */}
      <nav className="sidebar-nav" aria-label="Main navigation">
        <ul className="sidebar-links">
          {pages.map((page, index) => (
            <li key={index}>
              <NavLink 
                to={page.path}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                aria-label={page.name}
              >
                <span className="nav-icon">{page.icon}</span>
                <span className="nav-text">{page.name}</span>
                {page.name === "Notifications" && unreadCount > 0 && !collapsed && (
                  <span className="nav-notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer Buttons */}
      <div className="sidebar-footer">
        <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Theme" aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}>
          <span className="btn-icon">{theme === "light" ? "🌙" : "☀️"}</span>
          <span className="btn-text">{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
        </button>
        {isAuthenticated() ? (
          <button className="logout-btn" onClick={handleLogout} aria-label="Log out">
            <span className="btn-icon">🚪</span>
            <span className="btn-text">Logout</span>
          </button>
        ) : (
          <>
            <button className="signin-btn" onClick={() => navigate("/auth")} aria-label="Sign in">
              <span className="btn-icon">🔑</span>
              <span className="btn-text">Sign In</span>
            </button>
            <button className="signup-btn" onClick={() => navigate("/auth")} aria-label="Sign up">
              <span className="btn-icon">📝</span>
              <span className="btn-text">Sign Up</span>
            </button>
          </>
        )}
      </div>
    </div>
    </>
  );
};

export default Sidebar;