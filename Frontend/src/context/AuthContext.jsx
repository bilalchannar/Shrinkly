import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth on mount and validate token
    const validateAuth = async () => {
      const savedUser = localStorage.getItem("loggedInUser");
      const savedToken = localStorage.getItem("authToken");
      
      if (savedUser && savedToken) {
        try {
          // Validate token by calling /auth/me
          const data = await authAPI.getCurrentUser();
          if (data.user) {
            setUser(data.user);
            setToken(savedToken);
          } else {
            // Token invalid, clear storage
            localStorage.removeItem("loggedInUser");
            localStorage.removeItem("authToken");
          }
        } catch (error) {
          // Token invalid or expired, clear storage
          console.log("Token validation failed, clearing auth");
          localStorage.removeItem("loggedInUser");
          localStorage.removeItem("authToken");
        }
      }
      setLoading(false);
    };
    
    validateAuth();
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("loggedInUser", JSON.stringify(userData));
    localStorage.setItem("authToken", authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("authToken");
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem("loggedInUser", JSON.stringify(userData));
  };

  const isAuthenticated = () => {
    return !!token;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      login, 
      logout, 
      updateUser, 
      isAuthenticated 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
