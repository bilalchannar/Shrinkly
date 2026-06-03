import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import "../Css/Sidebar.css";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const toggleSidebar = () => setCollapsed(!collapsed);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const pages = [
    { name: "Home", icon: "🏠", path: "/home" },
    { name: "Link Management", icon: "🔗", path: "/link" },
    { name: "Analytics", icon: "📊", path: "/analytics" },
    { name: "QR Code", icon: "📱", path: "/qrcode" },
    { name: "Contact", icon: "📞", path: "/contact" },
    { name: "Profile", icon: "👤", path: "/profile" },
  ];

  const handleNavigate = (path) => {
    navigate(path);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Logo Section */}
      <div className="sidebar-logo-section">
        <div className="logo-wrapper">
          <img 
            src={collapsed ? "/shrinklyblacklogo.png" : "/shrinklyblack.png"} 
            alt="Shrinkly Logo" 
            className="sidebar-logo"
          />
        </div>
        <button className="toggle-btn" onClick={toggleSidebar}>
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <ul className="sidebar-links">
          {pages.map((page, index) => (
            <li key={index}>
              <a 
                onClick={() => handleNavigate(page.path)} 
                className={`nav-link ${isActive(page.path) ? "active" : ""}`}
              >
                <span className="nav-icon">{page.icon}</span>
                <span className="nav-text">{page.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer Buttons */}
      <div className="sidebar-footer">
        <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Theme">
          <span className="btn-icon">{theme === "light" ? "🌙" : "☀️"}</span>
          <span className="btn-text">{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
        </button>
        {isAuthenticated() ? (
          <button className="logout-btn" onClick={handleLogout}>
            <span className="btn-icon">🚪</span>
            <span className="btn-text">Logout</span>
          </button>
        ) : (
          <>
            <button className="signin-btn" onClick={() => handleNavigate("/auth")}>
              <span className="btn-icon">🔑</span>
              <span className="btn-text">Sign In</span>
            </button>
            <button className="signup-btn" onClick={() => handleNavigate("/auth")}>
              <span className="btn-icon">📝</span>
              <span className="btn-text">Sign Up</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;