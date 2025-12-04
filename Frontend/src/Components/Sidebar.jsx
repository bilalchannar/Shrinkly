import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderLogo from "./HeaderLogo";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setCollapsed(!collapsed);

  const pages = [
    { name: "Home", icon: "🏠", path: "/home" },
    { name: "Link Management", icon: "🔗", path: "/link" },
    { name: "QR Code", icon: "📱", path: "/qrcode" },
    { name: "Analytics", icon: "📊", path: "/analytics" },
    { name: "Contact", icon: "📞", path: "/contact" },
    { name: "Profile", icon: "👤", path: "/profile" },
  ];

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div>
      <HeaderLogo />
      <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Header */}
      <div className="sidebar-header">
        <span className="logo-text">Shrinkly</span>
        <button className="toggle-btn" onClick={toggleSidebar}>
          ☰
        </button>
      </div>

      {/* Links */}
      <ul className="sidebar-links">
        {pages.map((page, index) => (
          <li key={index}>
            <a 
              onClick={() => handleNavigate(page.path)} 
              className="nav-link"
              style={{ cursor: "pointer" }}
            >
              <span>{page.icon}</span>
              <span>{page.name}</span>
            </a>
          </li>
        ))}
      </ul>

      {/* Footer Buttons */}
      <div className="sidebar-footer">
        <button className="signin-btn" onClick={() => handleNavigate("/")}>
          <span className="btn-icon">🔑</span>
          <span className="btn-text">Sign In</span>
        </button>
        <button className="signup-btn" onClick={() => handleNavigate("/")}>
          <span className="btn-icon">📝</span>
          <span className="btn-text">Sign Up</span>
        </button>
      </div>
      </div>
    </div>
  );
};

export default Sidebar;