import React, { useState } from "react";
import { Modal } from "../components/common/Modal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { authApi } from "../api";

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalMode, login } = useAuth();
  const { success, error } = useToast();

  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [loading, setLoading] = useState(false);

  // Form states
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // Sync mode with context
  React.useEffect(() => {
    if (authModalMode) setMode(authModalMode);
  }, [authModalMode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      error("Email / Username and password are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login({ identifier, password });
      await login(res.data.access_token);
      success("Welcome back to PrepShare!", "Signed In");
      closeAuthModal();
    } catch (err: any) {
      error(err.response?.data?.detail || "Authentication failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!email) {
      error("Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "forgot") {
        await authApi.forgotPassword({ email });
      } else {
        await authApi.requestOtp({ email });
      }
      setOtpSent(true);
      success(`6-digit code sent to ${email}`, "Code Sent");
    } catch (err: any) {
      error(err.response?.data?.detail || "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp || !username || !password) {
      error("All registration fields are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.verifyAndRegister({ email, otp_code: otp, username, password });
      await login(res.data.access_token);
      success("Account created successfully. Welcome to PrepShare!", "Registered");
      closeAuthModal();
    } catch (err: any) {
      error(err.response?.data?.detail || "Registration failed. Check OTP code or username.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp || !newPassword) {
      error("Email, code and new password are required.");
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ email, otp_code: otp, new_password: newPassword });
      success("Password updated. You can now sign in.", "Password Reset");
      setMode("login");
    } catch (err: any) {
      error(err.response?.data?.detail || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={closeAuthModal}
      title={
        mode === "login"
          ? "Sign In to PrepShare"
          : mode === "register"
          ? "Create Your Account"
          : "Reset Password"
      }
      subtitle="Connect with students and explore real interview questions"
      maxWidth="max-w-md"
    >
      {mode === "login" && (
        <form onSubmit={handleLogin} className="flex flex-col gap-4 text-xs">
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-on-surface">Email or Username</label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. student@college.edu or alex_24"
              className="p-3 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="font-bold text-on-surface">Password</label>
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-[11px] text-primary hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="p-3 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-1 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary-container transition-all active:scale-95 shadow-sm disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="text-center pt-3 border-t border-border-subtle text-xs text-on-surface-variant">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setOtpSent(false);
              }}
              className="font-bold text-primary underline"
            >
              Sign Up
            </button>
          </div>
        </form>
      )}

      {mode === "register" && (
        <form onSubmit={handleRegister} className="flex flex-col gap-4 text-xs">
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-on-surface">Email Address</label>
            <div className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@college.edu"
                className="flex-grow p-3 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={loading || !email}
                className="px-3.5 py-3 rounded-xl bg-primary-container/10 border border-primary/20 text-primary font-bold text-xs hover:bg-primary-container/20 disabled:opacity-50 shrink-0"
              >
                {otpSent ? "Resend" : "Send Code"}
              </button>
            </div>
          </div>

          {otpSent && (
            <div className="flex flex-col gap-1.5 animate-in fade-in">
              <label className="font-bold text-on-surface">6-Digit Verification Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.trim())}
                placeholder="123456"
                className="p-3 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary text-center tracking-widest font-mono"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-on-surface">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. alex_student"
              className="p-3 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-on-surface">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="p-3 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !otpSent}
            className="w-full py-3 mt-1 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary-container transition-all active:scale-95 shadow-sm disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <div className="text-center pt-3 border-t border-border-subtle text-xs text-on-surface-variant">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setMode("login")}
              className="font-bold text-primary underline"
            >
              Sign In
            </button>
          </div>
        </form>
      )}

      {mode === "forgot" && (
        <form onSubmit={handleResetPassword} className="flex flex-col gap-4 text-xs">
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-on-surface">Recovery Email</label>
            <div className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@college.edu"
                className="flex-grow p-3 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={loading || !email}
                className="px-3.5 py-3 rounded-xl bg-primary-container/10 border border-primary/20 text-primary font-bold text-xs hover:bg-primary-container/20 disabled:opacity-50 shrink-0"
              >
                {otpSent ? "Resend" : "Send Code"}
              </button>
            </div>
          </div>

          {otpSent && (
            <>
              <div className="flex flex-col gap-1.5 animate-in fade-in">
                <label className="font-bold text-on-surface">6-Digit Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.trim())}
                  placeholder="123456"
                  className="p-3 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary text-center tracking-widest font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5 animate-in fade-in">
                <label className="font-bold text-on-surface">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="p-3 bg-surface border border-outline-variant rounded-xl text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-1 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary-container transition-all active:scale-95 shadow-sm disabled:opacity-50"
              >
                {loading ? "Updating..." : "Reset Password"}
              </button>
            </>
          )}

          <div className="text-center pt-3 border-t border-border-subtle text-xs text-on-surface-variant">
            Remember your credentials?{" "}
            <button
              type="button"
              onClick={() => setMode("login")}
              className="font-bold text-primary underline"
            >
              Sign In
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
