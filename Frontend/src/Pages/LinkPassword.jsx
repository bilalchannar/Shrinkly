import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export default function LinkPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get("code");
  const hasError = searchParams.get("error") === "wrong";

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(hasError ? "Incorrect password. Please try again." : "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) { setError("Please enter the password."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/links/check-password/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = data.originalUrl;
      } else {
        setError(data.message || "Incorrect password.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg,#f0f4ff 0%,#e8ecff 100%)", fontFamily: "Segoe UI, sans-serif", padding: "20px"
    }}>
      <div style={{
        background: "#fff", borderRadius: "20px", boxShadow: "0 14px 40px rgba(81,45,168,0.15)",
        width: "100%", maxWidth: "420px", overflow: "hidden"
      }}>
        <div style={{ background: "linear-gradient(135deg,#512da8,#7b4fd4)", padding: "28px 40px", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "8px" }}>🔒</div>
          <h1 style={{ color: "#fff", margin: 0, fontSize: "22px" }}>Protected Link</h1>
          <p style={{ color: "rgba(255,255,255,0.8)", margin: "6px 0 0", fontSize: "13px" }}>
            This link requires a password to access
          </p>
        </div>
        <div style={{ padding: "36px 40px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              style={{
                background: "#f0eeff", border: "1.5px solid transparent", padding: "13px 16px",
                borderRadius: "10px", fontSize: "15px", width: "100%", boxSizing: "border-box",
                outline: "none", fontFamily: "inherit"
              }}
            />
            {error && <p style={{ color: "#e53935", fontSize: "13px", margin: 0 }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              style={{
                background: "linear-gradient(135deg,#512da8,#7b4fd4)", color: "#fff",
                border: "none", padding: "14px", borderRadius: "10px", fontSize: "15px",
                fontWeight: "600", cursor: "pointer", opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? "Checking..." : "Access Link →"}
            </button>
          </form>
          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#999" }}>
            Don't know the password? Contact the link owner.
          </p>
        </div>
      </div>
    </div>
  );
}
