import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        backgroundColor: "var(--bg-primary)"
      }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{
            width: "40px",
            height: "40px",
            border: "4px solid var(--border-color)",
            borderTop: "4px solid var(--primary-color)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px"
          }}></div>
          <p style={{ color: "var(--text-secondary)" }}>Verifying admin authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const role = user?.role || "user";
  if (role !== "admin" && role !== "superadmin") {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        textAlign: 'center', 
        padding: '2rem',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}>
        <h1 style={{ color: 'var(--error-color)', fontSize: '3rem', marginBottom: '1rem', fontWeight: 800 }}>⛔ Unauthorized Access</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '2rem' }}>You do not have administrative privileges to access this area.</p>
        <button 
          onClick={() => window.location.href = "/home"} 
          style={{ 
            padding: '0.75rem 1.5rem', 
            backgroundColor: 'var(--primary-color)', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            fontWeight: 'bold' 
          }}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
