import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
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

  const fetchProfile = useCallback(async () => {
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
  }, []);

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
  }, [token, fetchProfile]);

  const login = useCallback(async (newToken: string) => {
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
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("prepshare_token");
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (token) {
      await fetchProfile();
    }
  }, [token, fetchProfile]);

  const openAuthModal = useCallback((mode: "login" | "register" = "login") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const contextValue = useMemo<AuthContextType>(
    () => ({
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
    }),
    [
      user,
      token,
      isLoading,
      login,
      logout,
      refreshUser,
      openAuthModal,
      closeAuthModal,
      isAuthModalOpen,
      authModalMode,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>
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
