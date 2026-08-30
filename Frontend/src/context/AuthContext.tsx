import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile } from "../types";
import { usersApi } from "../api";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  openAuthModal: (mode?: "login" | "register") => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
  authModalMode: "login" | "register";
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("prepshare_token"));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  const fetchProfile = async () => {
    try {
      const res = await usersApi.getMyProfile();
      setUser(res.data);
    } catch {
      setUser(null);
      localStorage.removeItem("prepshare_token");
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setUser(null);
      setIsLoading(false);
    }

    const handleExpired = () => {
      setUser(null);
      setToken(null);
      setIsAuthModalOpen(true);
    };

    window.addEventListener("auth_token_expired", handleExpired);
    return () => window.removeEventListener("auth_token_expired", handleExpired);
  }, [token]);

  const login = async (newToken: string) => {
    localStorage.setItem("prepshare_token", newToken);
    setToken(newToken);
    setIsLoading(true);
    try {
      const res = await usersApi.getMyProfile();
      setUser(res.data);
    } finally {
      setIsLoading(false);
      setIsAuthModalOpen(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("prepshare_token");
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      await fetchProfile();
    }
  };

  const openAuthModal = (mode: "login" | "register" = "login") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        refreshUser,
        openAuthModal,
        closeAuthModal,
        isAuthModalOpen,
        authModalMode,
      }}
    >
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
