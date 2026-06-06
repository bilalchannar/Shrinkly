import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

const OAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const loginStartedRef = React.useRef(false);

  useEffect(() => {
    if (loginStartedRef.current) return;
    loginStartedRef.current = true;

    const token = searchParams.get("token");
    const plan = searchParams.get("plan");

    if (!token) {
      toast.error("Authentication failed: No token received");
      navigate("/auth?oauthError=No authentication token received");
      return;
    }

    const fetchUserAndLogin = async () => {
      try {
        // Temporarily store token in localStorage so API client can use it
        localStorage.setItem("authToken", token);

        // Fetch user profile from backend
        const data = await authAPI.getCurrentUser();

        if (data && data.user) {
          // Log user in using context
          login(data.user, token);
          toast.success("Successfully logged in!");
          
          if (plan && plan !== "free") {
            navigate("/profile", { state: { activeTab: "billing", autoSelectPlan: plan } });
          } else {
            navigate("/home");
          }
        } else {
          throw new Error("Failed to fetch user profile");
        }
      } catch (err) {
        console.error("OAuth Success Login Error:", err);
        localStorage.removeItem("authToken");
        toast.error(err.message || "OAuth login failed");
        navigate(`/auth?oauthError=${encodeURIComponent(err.message || "Failed to finalize session")}`);
      }
    };

    fetchUserAndLogin();
  }, [searchParams, login, navigate]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "#0b0f19",
      color: "#ffffff",
      fontFamily: "'Outfit', 'Segoe UI', sans-serif"
    }}>
      <div className="oauth-spinner-element" style={{
        width: "48px",
        height: "48px",
        border: "4px solid rgba(124, 58, 237, 0.2)",
        borderTopColor: "#7c3aed",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        marginBottom: "20px"
      }}></div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <h2>Finalizing login...</h2>
      <p style={{ color: "#9ca3af", marginTop: "8px", fontSize: "14px" }}>Please wait while we set up your session.</p>
    </div>
  );
};

export default OAuthSuccess;
