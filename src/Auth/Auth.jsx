import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaFacebookF, FaLinkedinIn, FaGoogle, FaGithub } from "react-icons/fa";
import "./Auth.css";

const App = () => {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("loggedInUser"));
    const savedToken = localStorage.getItem("authToken");
    if (savedUser && savedToken) {
      setLoggedInUser(savedUser);
      setAuthToken(savedToken);
    }

    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) setEmail(savedEmail);
  }, []);

  // Helper function to make authenticated requests with JWT
  const authenticatedFetch = (url, options = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    return fetch(url, { ...options, headers });
  };

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

    try {
      // Server validation (database check)
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Server validation error (e.g., email already exists)
        alert(`❌ Signup Failed: ${data.message}`);
        setErrors({ signup: data.message });
      } else {
        // Success
        alert(`✅ Signup Successful!\n\nWelcome ${data.user.username}!\n\nPlease login with your email.`);
        setIsSignup(false);
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setErrors({});
      }
    } catch (err) {
      console.error(err);
      alert("❌ Server Error: Could not connect to the server. Please try again later.");
      setErrors({ signup: "Server error. Try again later." });
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

    try {
      // Server validation (database check)
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Invalid credentials or server error
        alert(`❌ Login Failed: ${data.message}`);
        setErrors({ login: data.message });
      } else {
        // Success - user authenticated
        setLoggedInUser(data.user);
        setAuthToken(data.token);
        localStorage.setItem("loggedInUser", JSON.stringify(data.user));
        localStorage.setItem("authToken", data.token);

        if (rememberMe) localStorage.setItem("rememberedEmail", email);
        else localStorage.removeItem("rememberedEmail");

        alert(`✅ Login Successful!\n\nWelcome back, ${data.user.username}!`);
        setErrors({});
        
        // Redirect to home page after 1 second
        setTimeout(() => navigate("/home"), 1000);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Server Error: Could not connect to the server. Please try again later.");
      setErrors({ login: "Server error. Try again later." });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("authToken");
    setLoggedInUser(null);
    setAuthToken(null);
    navigate("/");
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
