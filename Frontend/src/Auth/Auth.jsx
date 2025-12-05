import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaFacebookF, FaLinkedinIn, FaGoogle, FaGithub } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import "./Auth.css";

const App = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated()) {
      navigate("/home");
    }

    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) setEmail(savedEmail);
  }, [isAuthenticated, navigate]);

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
      const data = await authAPI.signup(username, email, password);
      alert(`✅ Signup Successful!\n\nWelcome ${data.user.username}!\n\nPlease login with your email.`);
      setIsSignup(false);
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setErrors({});
    } catch (err) {
      alert(`❌ Signup Failed: ${err.message}`);
      setErrors({ signup: err.message });
    } finally {
      setLoading(false);
    }
  };

  // LOGIN
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // Client-side validation
    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const data = await authAPI.login(email, password);
      
      // Use AuthContext login
      login(data.user, data.token);

      if (rememberMe) localStorage.setItem("rememberedEmail", email);
      else localStorage.removeItem("rememberedEmail");

      alert(`✅ Login Successful!\n\nWelcome back, ${data.user.username}!`);
      setErrors({});
      
      // Redirect to home page
      navigate("/home");
    } catch (err) {
      alert(`❌ Login Failed: ${err.message}`);
      setErrors({ login: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="root-container">
      <div className={`container ${isSignup ? "right-panel-active" : ""}`}>
        <div className="form-container sign-up-container">
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
        </div>

        <div className="form-container sign-in-container">
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

            <a href="#">Forgot your password?</a>
            <button type="submit">Sign In</button>
          </form>
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
