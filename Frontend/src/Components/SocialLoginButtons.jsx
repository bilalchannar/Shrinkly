import React from "react";
import { FaGoogle, FaGithub, FaLinkedinIn, FaMicrosoft } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";
import "./SocialLoginButtons.css";

const SocialLoginButtons = ({ mode = "login" }) => {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan") || "free";
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  const providers = [
    {
      name: "Google",
      id: "google",
      icon: <FaGoogle size={16} style={{ color: "#EA4335" }} />,
      url: `${API_URL}/auth/google`
    },
    {
      name: "GitHub",
      id: "github",
      icon: <FaGithub size={16} style={{ color: "#ffffff" }} />,
      url: `${API_URL}/auth/github`
    }
  ];

  const handleSocialClick = (url) => {
    window.location.href = `${url}?plan=${plan}`;
  };

  return (
    <div className="social-login-wrapper">
      <div className="social-buttons-container">
        {providers.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`social-btn-ds social-${p.id}`}
            onClick={() => handleSocialClick(p.url)}
            aria-label={`${mode === "login" ? "Continue" : "Sign up"} with ${p.name}`}
          >
            <span className="social-icon-wrapper">{p.icon}</span>
            <span className="social-btn-text">
              {mode === "login" ? "Continue with" : "Sign up with"} {p.name}
            </span>
          </button>
        ))}
      </div>
      <div className="social-divider">
        <span className="social-divider-line"></span>
        <span className="social-divider-text">or continue with email</span>
        <span className="social-divider-line"></span>
      </div>
    </div>
  );
};

export default SocialLoginButtons;
