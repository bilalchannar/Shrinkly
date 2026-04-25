import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaFacebookF, FaLinkedinIn, FaGoogle, FaGithub } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import "./Auth.css";

const App = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  useEffect(() => {
    // Wait for auth loading to complete before redirecting
    if (!authLoading && isAuthenticated()) {
      navigate("/home");
    }

    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) setEmail(savedEmail);
  }, [isAuthenticated, navigate, authLoading]);

  // SIGNUP
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // Client-side validation
    if (!username) newErrors.username = "Username is required";
    if (!email) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Invalid email format";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      await authAPI.signup(username, email, password);
      // Show verification required message
      setSignupSuccess(true);
      setUsername(""); setEmail(""); setPassword(""); setConfirmPassword("");
      setErrors({});
    } catch (err) {
      setErrors({ signup: err.message });
    } finally {
      setLoading(false);
    }
  };

  // LOGIN
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const data = await authAPI.login(email, password);
      login(data.user, data.token);
      if (rememberMe) localStorage.setItem("rememberedEmail", email);
      else localStorage.removeItem("rememberedEmail");
      setErrors({});
      navigate("/home");
    } catch (err) {
      if (err.message && err.message.includes("verify your email")) {
        // Email not verified - show resend option
        setUnverifiedEmail(email);
      } else {
        setErrors({ login: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  // RESEND VERIFICATION
  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendMsg("");
    try {
      const data = await authAPI.resendVerification(unverifiedEmail);
      setResendMsg(data.message);
    } catch (err) {
      setResendMsg(err.message || "Failed to resend. Try again.");
    } finally {
      setResendLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        backgroundColor: "#f8f9fa"
      }}>
        <p style={{ color: "#6c757d" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="root-container">
      <div className={`container ${isSignup ? "right-panel-active" : ""}`}>
        <div className="form-container sign-up-container">
          {signupSuccess ? (
            <div className="auth-verify-container">
              <div className="auth-icon">📩</div>
              <h2>Check Your Email!</h2>
              <p>
                We've sent a verification link to your email. Click it to activate your account, then come back to log in.
              </p>
              <button
                className="auth-btn"
                onClick={() => { setSignupSuccess(false); setIsSignup(false); }}
              >
                Go to Login
              </button>
            </div>
          ) : (
          <form onSubmit={handleSignupSubmit}>
            <h1>Create Account</h1>

            <div className="social-container">
              <a href="https://facebook.com/login" target="_blank" rel="noreferrer">
                <FaFacebookF size={18} color="#1877F2" />
              </a>
              <a href="https://accounts.google.com" target="_blank" rel="noreferrer">
                <FaGoogle size={18} color="#DB4437" />
              </a>
              <a href="https://www.linkedin.com/login" target="_blank" rel="noreferrer">
                <FaLinkedinIn size={18} color="#0A66C2" />
              </a>
              <a href="https://github.com/login" target="_blank" rel="noreferrer">
                <FaGithub size={18} color="#333" />
              </a>
            </div>

            <span>or use your email for registration</span>

            <input
              type="text"
              placeholder="Name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
            {errors.username && <div className="error-msg">{errors.username}</div>}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            {(errors.email || errors.signup) && (
              <div className="error-msg">{errors.email || errors.signup}</div>
            )}

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && <div className="error-msg">{errors.password}</div>}

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {errors.confirmPassword && (
              <div className="error-msg">{errors.confirmPassword}</div>
            )}

            <button type="submit">Sign Up</button>
          </form>
          )}
        </div>

        <div className="form-container sign-in-container">
          {unverifiedEmail ? (
            <div className="auth-verify-container">
              <div className="auth-icon">📧</div>
              <h2>Email Not Verified</h2>
              <p>
                Please verify <strong>{unverifiedEmail}</strong> before logging in.
              </p>
              <button
                className="auth-btn"
                onClick={handleResendVerification}
                disabled={resendLoading}
              >
                {resendLoading ? "Sending..." : "Resend Verification Email"}
              </button>
              {resendMsg && <p className="auth-feedback-msg">{resendMsg}</p>}
              <a href="#back" className="auth-back-link" onClick={() => setUnverifiedEmail("")}>
                ← Try a different account
              </a>
            </div>
          ) : (
          <form onSubmit={handleLoginSubmit}>
            <h1>Sign in</h1>

            <div className="social-container">
              <a href="https://facebook.com/login" target="_blank" rel="noreferrer">
                <FaFacebookF size={18} color="#1877F2" />
              </a>
              <a href="https://accounts.google.com" target="_blank" rel="noreferrer">
                <FaGoogle size={18} color="#DB4437" />
              </a>
              <a href="https://www.linkedin.com/login" target="_blank" rel="noreferrer">
                <FaLinkedinIn size={18} color="#0A66C2" />
              </a>
              <a href="https://github.com/login" target="_blank" rel="noreferrer">
                <FaGithub size={18} color="#333" />
              </a>
            </div>

            <span>or use your account</span>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            {errors.login && <div className="error-msg">{errors.login}</div>}

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            <div className="check-row">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              <span>Remember Me</span>
            </div>

            <a href="#forgot" onClick={() => navigate("/forgot-password")}>Forgot your password?</a>
            <button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</button>
          </form>
          )}
        </div>

        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>Welcome Back</h1>
              <p>Please login with your personal info</p>
              <button className="ghost" onClick={() => setIsSignup(false)}>
                Sign In
              </button>
            </div>

            <div className="overlay-panel overlay-right">
              <h1>Hello Friend</h1>
              <p>Enter your personal details and start your journey</p>
              <button className="ghost" onClick={() => setIsSignup(true)}>
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
