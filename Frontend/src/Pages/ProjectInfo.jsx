import React from "react";
import Sidebar from "../Components/Sidebar";
import Footer from "../Components/Footer";
import "../Css/RedirectPages.css";

const techStack = [
  { name: "React", icon: "⚛️" },
  { name: "Vanilla CSS", icon: "🎨" },
  { name: "Node.js", icon: "🟢" },
  { name: "Express.js", icon: "🚀" },
  { name: "MongoDB", icon: "🍃" },
  { name: "Mongoose", icon: "📦" },
  { name: "JWT", icon: "🔐" },
  { name: "bcryptjs", icon: "🔒" },
  { name: "nodemailer", icon: "📧" },
  { name: "node-cron", icon: "⏰" },
  { name: "Chart.js", icon: "📊" },
  { name: "ua-parser-js", icon: "🕵️" },
  { name: "geoip-lite", icon: "🌍" },
  { name: "multer", icon: "📁" },
];

const features = [
  "Authentication & JWT",
  "Email Verification",
  "Password Reset",
  "Link Shortening",
  "Custom Slugs",
  "Password Protected Links",
  "Link Expiry Dates",
  "Max Click Limits",
  "QR Code Generator",
  "QR Code Styling",
  "Click Analytics",
  "Scheduled Reports",
  "Contact / Support Tickets",
  "Admin Panel",
  "Notifications",
  "Import / Export",
  "Smart Insights",
  "Abuse / Safety Detection",
  "Custom Domains",
  "API Key Management",
  "Workspaces",
  "Dark Mode",
];

export default function ProjectInfo() {
  return (
    <>
      <Sidebar />
      <div className="main-content">
        <div className="project-info-page">
          <header className="project-info-header">
            <div className="version-badge">v1.0.0</div>
            <h1>🔗 Shrinkly</h1>
            <p>Premium URL Shortener & Link Management Platform</p>
          </header>

          {/* Overview */}
          <div className="info-section card-ds" style={{ marginBottom: "1.5rem" }}>
            <h2>📋 About</h2>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
              Shrinkly is a full-stack SaaS-style platform for shortening, securing, managing, tracking, and reporting links.
              Built with a modern tech stack, it features real-time analytics, QR code generation, workspace collaboration,
              automated reports, and smart insights — all wrapped in a polished, responsive UI.
            </p>
          </div>

          {/* Tech Stack */}
          <div className="info-section card-ds" style={{ marginBottom: "1.5rem" }}>
            <h2>🛠️ Tech Stack</h2>
            <div className="tech-stack-grid">
              {techStack.map((tech, i) => (
                <div key={i} className="tech-chip">
                  <span>{tech.icon}</span>
                  <span>{tech.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="info-section card-ds" style={{ marginBottom: "1.5rem" }}>
            <h2>✨ Features</h2>
            <div className="features-grid">
              {features.map((f, i) => (
                <div key={i} className="feature-item">
                  <span className="check">✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Demo Credentials */}
          <div className="info-section card-ds" style={{ marginBottom: "1.5rem" }}>
            <h2>🧪 Demo</h2>
            <div className="demo-credentials-card">
              <h3>Demo Credentials</h3>
              <p>Email: <code>demo@shrinkly.com</code></p>
              <p>Password: <code>Demo123</code></p>
            </div>
          </div>

          {/* Developer Note */}
          <div className="info-section card-ds" style={{ marginBottom: "1.5rem" }}>
            <h2>👨‍💻 Developer Note</h2>
            <div className="developer-note">
              This project was built as a portfolio-grade, interview-ready SaaS application demonstrating
              full-stack development skills including authentication, database design, RESTful API development,
              real-time analytics, responsive UI design, and production-ready features.
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
