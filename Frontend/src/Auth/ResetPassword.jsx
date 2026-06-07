import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { authAPI } from "../services/api";
import "./Auth.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";
    else if (!/[A-Za-z]/.test(password)) newErrors.password = "Password must contain at least one letter";
    else if (!/[0-9]/.test(password)) newErrors.password = "Password must contain at least one number";

    if (!confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    if (!token) {
      setErrors({ general: "Invalid reset link. Please request a new one." });
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setErrors({ general: err.message || "Failed to reset password. The link may have expired." });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page-wrapper">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1>🔗 Shrinkly</h1>
            <p>Reset Password</p>
          </div>
          <div className="auth-card-body">
            <div className="auth-status error">
              <div className="auth-status-icon">❌</div>
              <h2>Invalid Link</h2>
              <p>This password reset link is invalid or missing. Please request a new one.</p>
              <Link to="/forgot-password" className="auth-btn" style={{ textDecoration: "none", display: "inline-block", marginTop: "16px" }}>
                Request New Link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-card-header">
          <h1>🔗 Shrinkly</h1>
          <p>Reset Password</p>
        </div>

        <div className="auth-card-body">
          {!success ? (
            <>
              <div className="auth-status" style={{ marginBottom: "16px" }}>
                <div className="auth-status-icon">🔑</div>
                <h2>Create New Password</h2>
                <p style={{ color: "#666" }}>Your new password must be at least 6 characters and contain a letter and number.</p>
              </div>

              <form onSubmit={handleSubmit} className="auth-simple-form">
                <input
                  type="password"
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                {errors.password && <p className="auth-error-msg">{errors.password}</p>}

                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && <p className="auth-error-msg">{errors.confirmPassword}</p>}

                {errors.general && <p className="auth-error-msg">{errors.general}</p>}

                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            </>
          ) : (
            <div className="auth-status success">
              <div className="auth-status-icon">✅</div>
              <h2>Password Reset!</h2>
              <p>Your password has been successfully reset. You can now log in with your new password.</p>
              <button className="auth-btn" onClick={() => navigate("/auth")}>
                Go to Login
              </button>
            </div>
          )}

          <Link to="/auth" className="auth-back-link">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
