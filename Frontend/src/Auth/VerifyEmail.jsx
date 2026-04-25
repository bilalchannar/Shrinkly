import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { authAPI } from "../services/api";
import "./Auth.css";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found in the URL.");
      return;
    }

    const verify = async () => {
      try {
        const data = await authAPI.verifyEmail(token);
        setStatus("success");
        setMessage(data.message);
      } catch (err) {
        setStatus("error");
        setMessage(err.message || "Verification failed. The link may have expired.");
      }
    };

    verify();
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) return;
    setResendLoading(true);
    setResendMsg("");
    try {
      const data = await authAPI.resendVerification(resendEmail);
      setResendMsg(data.message);
    } catch (err) {
      setResendMsg(err.message || "Failed to resend. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-card-header">
          <h1>🔗 Shrinkly</h1>
          <p>Email Verification</p>
        </div>

        <div className="auth-card-body">
          {status === "verifying" && (
            <div className="auth-status">
              <div className="auth-spinner"></div>
              <p>Verifying your email address...</p>
            </div>
          )}

          {status === "success" && (
            <div className="auth-status success">
              <div className="auth-status-icon">✅</div>
              <h2>Email Verified!</h2>
              <p>{message}</p>
              <button className="auth-btn" onClick={() => navigate("/")}>
                Go to Login
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="auth-status error">
              <div className="auth-status-icon">❌</div>
              <h2>Verification Failed</h2>
              <p>{message}</p>

              <div className="auth-divider">Request a new verification link</div>

              <form onSubmit={handleResend} className="auth-simple-form">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  required
                />
                <button type="submit" className="auth-btn" disabled={resendLoading}>
                  {resendLoading ? "Sending..." : "Resend Verification Email"}
                </button>
                {resendMsg && <p className="auth-feedback-msg">{resendMsg}</p>}
              </form>

              <Link to="/" className="auth-back-link">← Back to Login</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
