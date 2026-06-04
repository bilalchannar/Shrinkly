import React, { createContext, useContext, useState, useEffect } from "react";
import api, { authAPI } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState(() => {
    return localStorage.getItem("activeWorkspaceId") || "personal";
  });

  const setActiveWorkspace = (id) => {
    setActiveWorkspaceState(id);
    localStorage.setItem("activeWorkspaceId", id);
  };

  const fetchWorkspaces = async () => {
    if (!localStorage.getItem("authToken")) return;
    try {
      const data = await api.workspace.getAllWorkspaces();
      if (data.success) {
        setWorkspaces(data.workspaces);
        
        // Validate if active workspace still exists in user's list
        const activeId = localStorage.getItem("activeWorkspaceId") || "personal";
        if (activeId !== "personal") {
          const exists = data.workspaces.some(ws => ws._id === activeId);
          if (!exists) {
            setActiveWorkspace("personal");
          } else {
            setActiveWorkspaceState(activeId);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching workspaces in context:", error);
    }
  };

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
            localStorage.removeItem("activeWorkspaceId");
          }
        } catch (error) {
          // Token invalid or expired, clear storage
          console.log("Token validation failed, clearing auth");
          localStorage.removeItem("loggedInUser");
          localStorage.removeItem("authToken");
          localStorage.removeItem("activeWorkspaceId");
        }
      }
      setLoading(false);
    };
    
    validateAuth();
  }, []);

  useEffect(() => {
    if (token) {
      fetchWorkspaces();
    } else {
      setWorkspaces([]);
      setActiveWorkspaceState("personal");
      localStorage.removeItem("activeWorkspaceId");
    }
  }, [token]);

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
    localStorage.removeItem("activeWorkspaceId");
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
      isAuthenticated,
      workspaces,
      activeWorkspace,
      setActiveWorkspace,
      fetchWorkspaces
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
