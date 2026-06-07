import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { linksAPI } from "../services/api";
import "../Css/RedirectPages.css";

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
      const data = await linksAPI.checkPassword(code, password);
      if (data.success) {
        window.location.href = data.originalUrl;
      } else {
        setError(data.message || "Incorrect password.");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="redirect-page-container">
      <div className="redirect-card card-ds" style={{ textAlign: "center" }}>
        <div className="redirect-icon">🔒</div>
        <h1 className="redirect-title">Protected Link</h1>
        <p className="redirect-message">
          This link requires a password to access.
        </p>

        {code && (
          <div className="redirect-code-badge" style={{ marginBottom: "1.5rem" }}>
            <span>/{code}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%", margin: "0 auto 1.5rem", maxWidth: "320px" }}>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            className="input-ds"
            style={{ textAlign: "center" }}
          />
          {error && (
            <p style={{ color: "var(--error-color)", fontSize: "0.85rem", margin: 0 }}>
              ⚠️ {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-ds btn-ds-primary"
            style={{ width: "100%" }}
          >
            {loading ? "Verifying..." : "Access Link →"}
          </button>
        </form>

        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "2rem" }}>
          Don't know the password? Contact the link owner.
        </p>

        <div className="redirect-branding">
          <span className="brand-text">Powered by <strong>Shrinkly</strong></span>
        </div>
      </div>
    </div>
  );
}
