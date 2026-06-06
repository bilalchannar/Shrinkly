import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";
import SocialLoginButtons from "../Components/SocialLoginButtons";
import "./Auth.css";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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

  useEffect(() => {
    const error = searchParams.get("oauthError");
    if (error) {
      toast.error(error);
      setErrors({ login: error });
    }
  }, [searchParams]);

  // Clean toggle between states
  const handleToggleMode = (signUp) => {
    setIsSignup(signUp);
    setErrors({});
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setUnverifiedEmail("");
    setSignupSuccess(false);
  };

  // SIGNUP
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // Username validation (3-30 chars, letters/numbers/underscores)
    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.length < 3 || username.length > 30) {
      newErrors.username = "Username must be 3–30 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = "Username can only contain letters, numbers, and underscores";
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    // Password validation (min 6 chars, at least one letter, at least one number)
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (!/[A-Za-z]/.test(password)) {
      newErrors.password = "Password must contain at least one letter";
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = "Password must contain at least one number";
    }

    // Confirm password
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const selectedPlan = searchParams.get("plan") || "free";
    setLoading(true);
    try {
      await authAPI.signup(username.trim(), email.trim(), password, selectedPlan);
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

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const data = await authAPI.login(email.trim(), password);
      login(data.user, data.accessToken);
      if (rememberMe) localStorage.setItem("rememberedEmail", email.trim());
      else localStorage.removeItem("rememberedEmail");
      setErrors({});

      const selectedPlan = searchParams.get("plan");
      if (selectedPlan && selectedPlan !== "free") {
        navigate("/profile", { state: { activeTab: "billing", autoSelectPlan: selectedPlan } });
      } else {
        navigate("/home");
      }
    } catch (err) {
      if (err.message && err.message.includes("verify your email")) {
        // Email not verified - show resend option
        setUnverifiedEmail(email.trim());
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
                onClick={() => handleToggleMode(false)}
              >
                Go to Login
              </button>
            </div>
          ) : (
          <form onSubmit={handleSignupSubmit}>
            <h1>Create Account</h1>

            <SocialLoginButtons mode="signup" />

            {errors.signup && <div className="general-error-msg">{errors.signup}</div>}

            <input
              type="text"
              placeholder="Name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={errors.username ? "input-error" : ""}
              autoComplete="username"
            />
            {errors.username && <div className="error-msg">{errors.username}</div>}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? "input-error" : ""}
              autoComplete="email"
            />
            {errors.email && <div className="error-msg">{errors.email}</div>}

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? "input-error" : ""}
            />
            {errors.password && <div className="error-msg">{errors.password}</div>}

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={errors.confirmPassword ? "input-error" : ""}
            />
            {errors.confirmPassword && (
              <div className="error-msg">{errors.confirmPassword}</div>
            )}

            <button type="submit">Sign Up</button>
            <div className="mobile-switch-auth">
              <span>Already have an account? </span>
              <button type="button" className="btn-link-auth" onClick={() => handleToggleMode(false)}>Sign In</button>
            </div>
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

            <SocialLoginButtons mode="login" />

            {errors.login && <div className="general-error-msg">{errors.login}</div>}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? "input-error" : ""}
              autoComplete="email"
            />
            {errors.email && <div className="error-msg">{errors.email}</div>}

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? "input-error" : ""}
              autoComplete="current-password"
            />
            {errors.password && <div className="error-msg">{errors.password}</div>}

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
            <div className="mobile-switch-auth">
              <span>Don't have an account? </span>
              <button type="button" className="btn-link-auth" onClick={() => handleToggleMode(true)}>Sign Up</button>
            </div>
          </form>
          )}
        </div>

        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>Welcome Back</h1>
              <p>Please login with your personal info</p>
              <button className="ghost" onClick={() => handleToggleMode(false)}>
                Sign In
              </button>
            </div>

            <div className="overlay-panel overlay-right">
              <h1>Hello Friend</h1>
              <p>Enter your personal details and start your journey</p>
              <button className="ghost" onClick={() => handleToggleMode(true)}>
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
