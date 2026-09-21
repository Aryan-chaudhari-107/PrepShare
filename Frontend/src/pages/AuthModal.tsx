import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  User as UserIcon,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Modal } from "../components/common/Modal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { authApi } from "../api";

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalMode, login } = useAuth();
  const { success, error } = useToast();

  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // Sync mode with context
  useEffect(() => {
    if (authModalMode) {
      setMode(authModalMode);
      setOtpSent(false);
    }
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
      success(`6-digit code sent to ${email}`, "Code Dispatched");
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
          ? "Welcome Back"
          : mode === "register"
          ? "Join PrepShare"
          : "Reset Password"
      }
      subtitle={
        mode === "login"
          ? "Sign in to access curated questions, bookmarks, and mentorship"
          : mode === "register"
          ? "Create a free account to unlock real student interview insights"
          : "Enter your registered email to receive a secure recovery code"
      }
      maxWidth="max-w-md"
    >
      {/* Mode Selector Tabs */}
      <div className="flex rounded-xl bg-[#f3eee1] p-1 mb-6 border border-[#e3dccd]">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setOtpSent(false);
          }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            mode === "login"
              ? "bg-[#3f6f52] text-white shadow-xs"
              : "text-[#5f6e82] hover:text-[#0f1926]"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("register");
            setOtpSent(false);
          }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            mode === "register"
              ? "bg-[#3f6f52] text-white shadow-xs"
              : "text-[#5f6e82] hover:text-[#0f1926]"
          }`}
        >
          Create Account
        </button>
      </div>

      <AnimatePresence mode="wait">
        {mode === "login" && (
          <motion.form
            key="login"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            transition={{ duration: 0.15 }}
            onSubmit={handleLogin}
            className="flex flex-col gap-4 text-xs"
          >
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#0f1926]">Email or Username</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#5f6e82] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="student@college.edu or alex_24"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#f3eee1] border border-[#e3dccd] rounded-xl text-xs text-[#0f1926] placeholder-[#5f6e82] focus:outline-none focus:border-[#3f6f52] focus:ring-2 focus:ring-[#3f6f52]/20 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-[#0f1926]">Password</label>
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-[11px] text-[#2f6b47] hover:text-[#3f6f52] font-medium transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#5f6e82] absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#f3eee1] border border-[#e3dccd] rounded-xl text-xs text-[#0f1926] placeholder-[#5f6e82] focus:outline-none focus:border-[#3f6f52] focus:ring-2 focus:ring-[#3f6f52]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-[#5f6e82] hover:text-[#0f1926] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 rounded-xl bg-[#3f6f52] hover:bg-[#345c44] text-white font-bold text-xs active:scale-[0.98] shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.form>
        )}

        {mode === "register" && (
          <motion.form
            key="register"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.15 }}
            onSubmit={handleRegister}
            className="flex flex-col gap-4 text-xs"
          >
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#0f1926]">College or Personal Email</label>
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Mail className="w-4 h-4 text-[#5f6e82] absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@college.edu"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#f3eee1] border border-[#e3dccd] rounded-xl text-xs text-[#0f1926] placeholder-[#5f6e82] focus:outline-none focus:border-[#3f6f52] focus:ring-2 focus:ring-[#3f6f52]/20 transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={loading || !email}
                  className="px-3.5 py-2.5 rounded-xl bg-[#3f6f52]/10 border border-[#3f6f52]/25 text-[#2f6b47] font-semibold text-xs hover:bg-[#3f6f52]/20 active:scale-95 disabled:opacity-50 shrink-0 transition-all cursor-pointer"
                >
                  {otpSent ? "Resend" : "Send OTP"}
                </button>
              </div>
            </div>

            {otpSent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex flex-col gap-1.5"
              >
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-[#0f1926] flex items-center gap-1.5 text-[#2f7d52]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 6-Digit OTP Code
                  </label>
                  <span className="text-[10px] text-[#5f6e82]">Check inbox & spam</span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#5f6e82] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.trim())}
                    placeholder="123456"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#f3eee1] border border-[#2f7d52]/50 rounded-xl text-xs text-[#2f7d52] placeholder-[#5f6e82] focus:outline-none focus:ring-2 focus:ring-[#2f7d52]/20 tracking-widest font-mono text-center font-bold"
                  />
                </div>
              </motion.div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#0f1926]">Username</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#5f6e82] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. alex_student"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#f3eee1] border border-[#e3dccd] rounded-xl text-xs text-[#0f1926] placeholder-[#5f6e82] focus:outline-none focus:border-[#3f6f52] focus:ring-2 focus:ring-[#3f6f52]/20 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#0f1926]">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#5f6e82] absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#f3eee1] border border-[#e3dccd] rounded-xl text-xs text-[#0f1926] placeholder-[#5f6e82] focus:outline-none focus:border-[#3f6f52] focus:ring-2 focus:ring-[#3f6f52]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-[#5f6e82] hover:text-[#0f1926] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !otpSent}
              className="w-full py-3 mt-2 rounded-xl bg-[#3f6f52] hover:bg-[#345c44] text-white font-bold text-xs active:scale-[0.98] shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying & Creating...</span>
                </>
              ) : (
                <span>Complete Registration</span>
              )}
            </button>
          </motion.form>
        )}

        {mode === "forgot" && (
          <motion.form
            key="forgot"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.15 }}
            onSubmit={handleResetPassword}
            className="flex flex-col gap-4 text-xs"
          >
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[#0f1926]">Recovery Email</label>
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Mail className="w-4 h-4 text-[#5f6e82] absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@college.edu"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#f3eee1] border border-[#e3dccd] rounded-xl text-xs text-[#0f1926] placeholder-[#5f6e82] focus:outline-none focus:border-[#3f6f52] focus:ring-2 focus:ring-[#3f6f52]/20 transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={loading || !email}
                  className="px-3.5 py-2.5 rounded-xl bg-[#3f6f52]/10 border border-[#3f6f52]/25 text-[#2f6b47] font-semibold text-xs hover:bg-[#3f6f52]/20 active:scale-95 disabled:opacity-50 shrink-0 transition-all cursor-pointer"
                >
                  {otpSent ? "Resend" : "Send Code"}
                </button>
              </div>
            </div>

            {otpSent && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-[#0f1926]">6-Digit Code</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#5f6e82] absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.trim())}
                      placeholder="123456"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#f3eee1] border border-[#e3dccd] rounded-xl text-xs text-[#0f1926] placeholder-[#5f6e82] focus:outline-none focus:border-[#3f6f52] focus:ring-2 focus:ring-[#3f6f52]/20 tracking-widest font-mono text-center font-bold"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-[#0f1926]">New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#5f6e82] absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-[#f3eee1] border border-[#e3dccd] rounded-xl text-xs text-[#0f1926] placeholder-[#5f6e82] focus:outline-none focus:border-[#3f6f52] focus:ring-2 focus:ring-[#3f6f52]/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-[#5f6e82] hover:text-[#0f1926] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 mt-2 rounded-xl bg-[#3f6f52] hover:bg-[#345c44] text-white font-bold text-xs active:scale-[0.98] shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Updating Password..." : "Update Password"}
                </button>
              </>
            )}

            <div className="text-center pt-3 border-t border-[#e3dccd] text-xs text-[#5f6e82]">
              Remember your credentials?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="font-semibold text-[#2f6b47] hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </Modal>
  );
};
