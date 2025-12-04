import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(true);
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
    <>
      {/* Header Logo Bar */}
      <div className={`header-logo ${collapsed ? "collapsed" : ""}`}>
        <div className="logo-container">
          <img 
            src={collapsed ? "/ShrinklyBlackLogo.png" : "/ShrinklyBlack.png"} 
            alt="Shrinkly Logo" 
            className="logo-image" 
          />
        </div>
      </div>

      {/* Sidebar */}
      <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        {/* Toggle Button */}
        <div className="sidebar-toggle">
          <button className="toggle-btn" onClick={toggleSidebar}>
            {collapsed ? "☰" : "✕"}
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
                title={collapsed ? page.name : ""}
              >
                <span className="nav-icon">{page.icon}</span>
                <span className="nav-text">{page.name}</span>
              </a>
            </li>
          ))}
        </ul>

        {/* Footer Buttons */}
        <div className="sidebar-footer">
          <button className="signin-btn" onClick={() => handleNavigate("/")} title={collapsed ? "Sign In" : ""}>
            <span className="btn-icon">🔑</span>
            <span className="btn-text">Sign In</span>
          </button>
          <button className="signup-btn" onClick={() => handleNavigate("/")} title={collapsed ? "Sign Up" : ""}>
            <span className="btn-icon">📝</span>
            <span className="btn-text">Sign Up</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;