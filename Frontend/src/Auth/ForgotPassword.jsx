import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authAPI } from "../services/api";
import "./Auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const data = await authAPI.forgotPassword(email);
      setSubmitted(true);
      setMessage(data.message);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-card-header">
          <h1>🔗 Shrinkly</h1>
          <p>Forgot Password</p>
        </div>

        <div className="auth-card-body">
          {!submitted ? (
            <>
              <div className="auth-status">
                <div className="auth-status-icon">🔒</div>
                <h2>Reset Your Password</h2>
                <p style={{ color: "#666", marginBottom: "20px" }}>
                  Enter the email address associated with your account and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="auth-simple-form">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                {error && <p className="auth-error-msg">{error}</p>}
                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            </>
          ) : (
            <div className="auth-status success">
              <div className="auth-status-icon">📧</div>
              <h2>Check Your Email</h2>
              <p>{message}</p>
              <p style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                Don't see it? Check your spam folder.
              </p>
            </div>
          )}

          <Link to="/auth" className="auth-back-link">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
