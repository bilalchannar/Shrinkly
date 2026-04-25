import React from "react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg,#f0f4ff 0%,#e8ecff 100%)",
      fontFamily: "'Segoe UI', sans-serif", textAlign: "center", padding: "20px"
    }}>
      {/* Animated 404 */}
      <div style={{ position: "relative", marginBottom: "24px" }}>
        <div style={{
          fontSize: "140px", fontWeight: "900",
          background: "linear-gradient(135deg,#512da8,#7b4fd4)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          lineHeight: 1, letterSpacing: "-8px"
        }}>
          404
        </div>
        <div style={{
          position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)",
          fontSize: "48px", animation: "float 2s ease-in-out infinite"
        }}>
          🔗
        </div>
      </div>

      <h1 style={{ fontSize: "28px", color: "#1a1a2e", margin: "0 0 12px" }}>
        Page Not Found
      </h1>
      <p style={{ color: "#666", fontSize: "16px", maxWidth: "400px", lineHeight: 1.6, margin: "0 0 32px" }}>
        Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or the URL might be wrong.
      </p>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "12px 28px", borderRadius: "10px",
            border: "2px solid #512da8", background: "transparent",
            color: "#512da8", fontSize: "15px", fontWeight: "600", cursor: "pointer"
          }}
        >
          ← Go Back
        </button>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "12px 28px", borderRadius: "10px",
            background: "linear-gradient(135deg,#512da8,#7b4fd4)",
            border: "none", color: "#fff", fontSize: "15px", fontWeight: "600", cursor: "pointer"
          }}
        >
          🏠 Go Home
        </button>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-12px); }
        }
      `}</style>
    </div>
  );
}
