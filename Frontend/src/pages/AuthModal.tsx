import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Modal } from "../components/common/Modal";
import { Button, Field, Input, PasswordInput, Segmented } from "../components/ui";
import { DURATION, EASE, SPRING, item } from "../motion";
import { SuccessFlash, type SuccessKind } from "../motion/SuccessFlash";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { authApi } from "../api";
import { cn } from "../lib/cn";
import { errorMessage } from "../lib/format";

type AuthMode = "login" | "register" | "forgot";

type FieldKey = "identifier" | "email" | "username" | "password" | "otp" | "newPassword";
type FieldErrors = Partial<Record<FieldKey, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_RE = /^\d{6}$/;

/**
 * The modal's ONE motion grammar — the same travel the report wizard uses
 * (see `stepVariants` in DraftReportPage.tsx): a panel arrives from the side
 * you are travelling toward and settles on the enter ease; the panel you
 * leave accelerates out the far side on the exit ease. Forward and backward
 * are exact reflections because the direction travels in `custom`, so no
 * swap in this dialog can ever "pop" or replay one animation for both
 * directions. `show` also lays down the shared `item` stagger: sections
 * cascade once, on arrival, then everything holds completely still — fields
 * never animate while you type.
 */
const travel: Variants = {
  hidden: (dir: number) => ({ opacity: 0, x: dir * 14 }),
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: DURATION.base,
      ease: EASE.enter,
      delayChildren: 0.05,
      staggerChildren: 0.05,
    },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir * -8,
    // A departing panel must never be clickable mid-flight.
    pointerEvents: "none" as const,
    transition: { duration: DURATION.fast, ease: EASE.exit },
  }),
};

/**
 * Fixed order of the three modes so every switch has a direction:
 * login → register → forgot. Forward and back mirror each other exactly.
 */
const MODE_ORDER: AuthMode[] = ["login", "register", "forgot"];

const REG_STEPS = ["Email", "Code", "Account"];

/**
 * 3-step progress indicator for the registration flow.
 *
 * Scaled-down twin of the report wizard's rail: one track, a fill that
 * TRAVELS to the active node (scaleX only — compositor-friendly, never a
 * width animation) on the same gentle spring, so every stepper in the product
 * reads as one mechanism. The active node is the only one that swells;
 * completed steps sit flush with their check. Labels live under the nodes in
 * equal columns so the rail stays straight when a label wraps.
 */
const Stepper: React.FC<{ step: number }> = ({ step }) => {
  const progress = step / (REG_STEPS.length - 1);

  return (
    <ol className="relative flex items-start" aria-label="Registration progress">
      {/* Track + travelling fill. Nodes carry `relative`, so they paint
          above these absolutely-positioned tracks. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[calc(100%/6)] top-[9px] h-0.5 rounded-full bg-line"
      />
      <motion.span
        aria-hidden="true"
        initial={false}
        animate={{ scaleX: progress }}
        transition={SPRING.gentle}
        className="pointer-events-none absolute inset-x-[calc(100%/6)] top-[9px] h-0.5 origin-left rounded-full bg-primary"
      />

      {REG_STEPS.map((label, index) => {
        const done = index < step;
        const current = index === step;
        return (
          <li
            key={label}
            aria-current={current ? "step" : undefined}
            className="flex min-w-0 flex-1 flex-col items-center gap-1"
          >
            <motion.span
              aria-hidden="true"
              initial={false}
              animate={{ scale: current ? 1.1 : 1 }}
              transition={SPRING.gentle}
              className={cn(
                "relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                done && "bg-primary-soft text-primary",
                current && "bg-primary text-primary-fg shadow-xs",
                !done && !current && "bg-sunken text-faint"
              )}
            >
              {done ? <Check size={12} /> : index + 1}
            </motion.span>
            <span
              className={cn(
                "text-center text-xs font-medium leading-tight",
                current ? "text-heading" : done ? "text-primary" : "text-faint"
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
};

const Alert: React.FC<{ message: string }> = ({ message }) => (
  <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
    {message}
  </p>
);

/**
 * One section of a form: joins its container's entrance stagger, then holds
 * completely still. Fields are never animated while being filled in — motion
 * here is structural, once per arrival, never per keystroke.
 */
const Stagger: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div variants={item}>{children}</motion.div>
);

/**
 * Auth dialog for login / registration / password recovery.
 *
 * Shell, focus management, Escape and scroll lock come from the shared
 * `Modal` — this component only owns the forms. Every open starts from a
 * clean slate (fields, errors, loading and mode are reset whenever
 * `isAuthModalOpen` flips to true), so closing mid-flow can never leak
 * stale state into the next attempt.
 */
export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalMode, login } = useAuth();
  const { success, error } = useToast();

  const [mode, setMode] = useState<AuthMode>("login");
  // Direction of travel for the two swaps this dialog performs (mode change
  // and register-step change), so both use the mirrored grammar in `travel`
  // instead of one animation serving every direction.
  const [modeDir, setModeDir] = useState(1);
  const [registerStep, setRegisterStep] = useState(0);
  const [registerDir, setRegisterDir] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);

  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  // The one-shot success ceremony after sign-in / account creation. Kept here
  // (outside <Modal>) so it keeps playing over the page while the dialog
  // itself animates away — "access granted → entering the environment".
  const [flash, setFlash] = useState<SuccessKind | null>(null);

  // Reset on the closed → open transition so every open begins clean and
  // always honours the mode the context asked for (fixes the mode desync
  // where local state drifted away from `authModalMode`).
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (isAuthModalOpen && !wasOpenRef.current) {
      setMode(authModalMode);
      setRegisterStep(0);
      setLoading(false);
      setSendingCode(false);
      setIdentifier("");
      setEmail("");
      setUsername("");
      setPassword("");
      setOtp("");
      setOtpSent(false);
      setNewPassword("");
      setErrors({});
      setFormError(null);
      setFlash(null);
    }
    wasOpenRef.current = isAuthModalOpen;
  }, [isAuthModalOpen, authModalMode]);

  const clearErrors = (...keys: FieldKey[]) =>
    setErrors((prev) => {
      if (!keys.some((key) => prev[key])) return prev;
      const next = { ...prev };
      keys.forEach((key) => delete next[key]);
      return next;
    });

  const switchMode = (next: AuthMode) => {
    if (next !== mode) {
      setModeDir(MODE_ORDER.indexOf(next) > MODE_ORDER.indexOf(mode) ? 1 : -1);
    }
    setMode(next);
    setRegisterStep(0);
    setOtpSent(false);
    setOtp("");
    setErrors({});
    setFormError(null);
  };

  /** Advances the registration stepper with the mirrored travel: next
   *  pushes the old panel left, back pushes it right — the same grammar
   *  the report wizard uses, so every step flow in the product agrees. */
  const goToRegisterStep = (next: number) => {
    if (next === registerStep) return;
    setRegisterDir(next > registerStep ? 1 : -1);
    setRegisterStep(next);
  };

  // ── Validation ────────────────────────────────────────────────────────────
  // Policy mirrors what the previous code enforced: required fields, an
  // email-shaped email, and a 6-digit code. No new password rule is invented.

  const validateLogin = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!identifier.trim()) next.identifier = "Enter your email or username.";
    if (!password) next.password = "Enter your password.";
    return next;
  };

  const validateEmail = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!email.trim()) next.email = "Enter your email address.";
    else if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address.";
    return next;
  };

  const validateOtp = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!otp) next.otp = "Enter the 6-digit code we emailed you.";
    else if (!OTP_RE.test(otp)) next.otp = "The code must be exactly 6 digits.";
    return next;
  };

  const validateCredentials = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!username.trim()) next.username = "Choose a username.";
    if (!password) next.password = "Choose a password.";
    return next;
  };

  const validateReset = (): FieldErrors => {
    const next: FieldErrors = { ...validateEmail(), ...validateOtp() };
    if (!newPassword) next.newPassword = "Enter a new password.";
    return next;
  };

  const fail = (next: FieldErrors): boolean => {
    if (Object.keys(next).length === 0) return false;
    setErrors(next);
    return true;
  };

  // ── API handlers (endpoints, payloads and response reads unchanged) ──────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (fail(validateLogin())) return;
    setLoading(true);
    try {
      const res = await authApi.login({ identifier, password });
      await login(res.data.access_token);
      // Ceremony first, then the dialog leaves: the portal plays over the page
      // the user is entering, not inside the form they are leaving.
      setFlash("login");
      success("Welcome back to PrepShare!", "Signed In");
      closeAuthModal();
    } catch (err: unknown) {
      const message = errorMessage(err, "Authentication failed. Check your credentials.");
      setFormError(message);
      error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    setFormError(null);
    if (fail(validateEmail())) return;
    setSendingCode(true);
    try {
      if (mode === "forgot") {
        await authApi.forgotPassword({ email: email.trim() });
      } else {
        await authApi.requestOtp({ email: email.trim() });
      }
      setOtpSent(true);
      setOtp("");
      clearErrors("otp");
      success(
        `We sent a 6-digit code to ${email.trim()}. It can take a few minutes to arrive — check your inbox and spam folder.`,
        mode === "forgot" ? "Recovery code sent" : "Code sent"
      );
    } catch (err: unknown) {
      const message = errorMessage(err, "Failed to send the verification code.");
      setErrors((prev) => ({ ...prev, email: message }));
      error(message);
    } finally {
      setSendingCode(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (fail(validateCredentials())) return;
    setLoading(true);
    try {
      const res = await authApi.verifyAndRegister({
        email: email.trim(),
        otp_code: otp,
        username,
        password,
      });
      await login(res.data.access_token);
      // Distinct ceremony from sign-in — the orbital assembly, not the portal.
      setFlash("signup");
      success("Account created successfully. Welcome to PrepShare!", "Registered");
      closeAuthModal();
    } catch (err: unknown) {
      const message = errorMessage(err, "Registration failed. Check the code or username.");
      setFormError(message);
      error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (fail(validateReset())) return;
    setLoading(true);
    try {
      await authApi.resetPassword({
        email: email.trim(),
        otp_code: otp,
        new_password: newPassword,
      });
      success("Password updated. You can now sign in.", "Password Reset");
      switchMode("login");
    } catch (err: unknown) {
      const message = errorMessage(err, "Password reset failed.");
      setFormError(message);
      error(message);
    } finally {
      setLoading(false);
    }
  };

  // One form submits everything; each step validates then advances, and the
  // final step performs the actual registration call.
  const handleSubmit = (e: React.FormEvent) => {
    if (mode === "login") return handleLogin(e);
    if (mode === "forgot") return handleResetPassword(e);
    e.preventDefault();
    setFormError(null);
    if (registerStep === 0) {
      if (fail(validateEmail())) return;
      if (!otpSent) {
        setErrors({ email: "Request a code before continuing." });
        return;
      }
      goToRegisterStep(1);
    } else if (registerStep === 1) {
      if (fail(validateOtp())) return;
      goToRegisterStep(2);
    } else {
      void handleRegister(e);
    }
  };

  const otpHint = `Enter the 6-digit code sent to ${email.trim() || "your email"}. It usually arrives within a few minutes — check your spam folder if you don't see it.`;

  const footer =
    mode === "register" ? (
      <p className="mr-auto text-sm text-muted">
        Already have an account?{" "}
        <Button variant="link" onClick={() => switchMode("login")}>
          Sign in
        </Button>
      </p>
    ) : (
      <p className="mr-auto text-sm text-muted">
        {mode === "login" ? "New to PrepShare?" : "Remember your credentials?"}{" "}
        <Button
          variant="link"
          onClick={() => switchMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Create an account" : "Sign in"}
        </Button>
      </p>
    );

  return (
    <>
    <Modal
      isOpen={isAuthModalOpen}
      onClose={closeAuthModal}
      title={
        mode === "login"
          ? "Welcome back"
          : mode === "register"
            ? "Create your account"
            : "Reset your password"
      }
      subtitle={
        mode === "login"
          ? "Sign in to continue to PrepShare."
          : mode === "register"
            ? "Three quick steps: confirm your email, enter the code, then choose your credentials."
            : "We'll email a 6-digit code to your registered address — check your inbox and spam folder."
      }
      maxWidth="max-w-md"
      footer={footer}
    >
      {mode !== "forgot" && (
        <Segmented<AuthMode>
          className="mb-5"
          label="Authentication mode"
          size="sm"
          options={[
            { value: "login", label: "Sign in" },
            { value: "register", label: "Create account" },
          ]}
          value={mode}
          onChange={switchMode}
        />
      )}

      <AnimatePresence mode="wait" initial={false} custom={modeDir}>
        {mode === "login" && (
          <motion.form
            key="login"
            noValidate
            onSubmit={handleSubmit}
            custom={modeDir}
            variants={travel}
            initial="hidden"
            animate="show"
            exit="exit"
            className="flex flex-col gap-4"
          >
            {formError && (
              <Stagger>
                <Alert message={formError} />
              </Stagger>
            )}

            <Stagger>
              <Field
                label="Email or username"
                htmlFor="auth-identifier"
                required
                error={errors.identifier}
              >
                <Input
                  id="auth-identifier"
                  type="text"
                  autoComplete="username"
                  invalid={Boolean(errors.identifier)}
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    clearErrors("identifier");
                  }}
                  placeholder="student@college.edu or alex_24"
                  required
                />
              </Field>
            </Stagger>

            <Stagger>
              <Field
                label="Password"
                htmlFor="auth-password"
                required
                error={errors.password}
                action={
                  <Button variant="link" onClick={() => switchMode("forgot")}>
                    Forgot password?
                  </Button>
                }
              >
                <PasswordInput
                  id="auth-password"
                  autoComplete="current-password"
                  invalid={Boolean(errors.password)}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearErrors("password");
                  }}
                  placeholder="Your password"
                  required
                />
              </Field>
            </Stagger>

            <Stagger>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                iconRight={<ArrowRight size={16} aria-hidden="true" />}
              >
                Sign in
              </Button>
            </Stagger>
          </motion.form>
        )}

        {mode === "register" && (
          <motion.form
            key="register"
            custom={modeDir}
            variants={travel}
            initial="hidden"
            animate="show"
            exit="exit"
            noValidate
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            <Stagger>
              <Stepper step={registerStep} />
            </Stagger>
            {formError && (
              <Stagger>
                <Alert message={formError} />
              </Stagger>
            )}

            <AnimatePresence mode="wait" initial={false} custom={registerDir}>
              <motion.div
                key={registerStep}
                custom={registerDir}
                variants={travel}
                initial="hidden"
                animate="show"
                exit="exit"
                className="flex flex-col gap-4"
              >
                {registerStep === 0 && (
                  <>
                    <Stagger>
                      <Field
                        label="College or personal email"
                        htmlFor="auth-email"
                        required
                        error={errors.email}
                        hint={
                          otpSent
                            ? "A code has been sent — continue to enter it."
                            : "We'll send a 6-digit verification code to this address."
                        }
                      >
                        <Input
                          id="auth-email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          invalid={Boolean(errors.email)}
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            clearErrors("email");
                            // A code is tied to the address it was sent to;
                            // editing the address invalidates it.
                            if (otpSent) {
                              setOtpSent(false);
                              setOtp("");
                            }
                          }}
                          placeholder="student@college.edu"
                          required
                        />
                      </Field>
                    </Stagger>

                    <Stagger>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm text-muted">
                          {otpSent ? "Didn't get the code?" : "No code requested yet."}
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={sendingCode}
                          disabled={sendingCode || !email.trim()}
                          onClick={() => void handleRequestOtp()}
                        >
                          {otpSent ? "Resend code" : "Send code"}
                        </Button>
                      </div>
                    </Stagger>

                    <Stagger>
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        fullWidth
                        loading={loading}
                        disabled={loading || !otpSent}
                        iconRight={<ArrowRight size={16} aria-hidden="true" />}
                      >
                        Continue
                      </Button>
                    </Stagger>
                  </>
                )}

                {registerStep === 1 && (
                  <>
                    <Stagger>
                      <Field
                        label="6-digit verification code"
                        htmlFor="auth-otp"
                        required
                        error={errors.otp}
                        hint={otpHint}
                      >
                        <Input
                          id="auth-otp"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          invalid={Boolean(errors.otp)}
                          maxLength={6}
                          value={otp}
                          onChange={(e) => {
                            setOtp(e.target.value.trim());
                            clearErrors("otp");
                          }}
                          placeholder="123456"
                          className="text-center font-mono tracking-[0.3em]"
                          required
                        />
                      </Field>
                    </Stagger>

                    <Stagger>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          variant="ghost"
                          icon={<ArrowLeft size={16} aria-hidden="true" />}
                          disabled={loading}
                          onClick={() => goToRegisterStep(0)}
                        >
                          Back
                        </Button>
                        <Button
                          variant="secondary"
                          loading={sendingCode}
                          disabled={sendingCode}
                          onClick={() => void handleRequestOtp()}
                        >
                          Resend code
                        </Button>
                        <Button
                          type="submit"
                          variant="primary"
                          className="flex-1"
                          loading={loading}
                        >
                          Continue
                        </Button>
                      </div>
                    </Stagger>
                  </>
                )}

                {registerStep === 2 && (
                  <>
                    <Stagger>
                      <Field
                        label="Username"
                        htmlFor="auth-username"
                        required
                        error={errors.username}
                        hint="This is how other members will see you."
                      >
                        <Input
                          id="auth-username"
                          type="text"
                          autoComplete="username"
                          invalid={Boolean(errors.username)}
                          value={username}
                          onChange={(e) => {
                            setUsername(e.target.value);
                            clearErrors("username");
                          }}
                          placeholder="e.g. alex_student"
                          required
                        />
                      </Field>
                    </Stagger>

                    <Stagger>
                      <Field
                        label="Password"
                        htmlFor="auth-password"
                        required
                        error={errors.password}
                        hint="At least 8 characters."
                      >
                        <PasswordInput
                          id="auth-password"
                          autoComplete="new-password"
                          invalid={Boolean(errors.password)}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            clearErrors("password");
                          }}
                          placeholder="Create a password"
                          required
                        />
                      </Field>
                    </Stagger>

                    <Stagger>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          variant="ghost"
                          icon={<ArrowLeft size={16} aria-hidden="true" />}
                          disabled={loading}
                          onClick={() => goToRegisterStep(1)}
                        >
                          Back
                        </Button>
                        <Button
                          type="submit"
                          variant="primary"
                          size="lg"
                          className="flex-1"
                          loading={loading}
                        >
                          Complete registration
                        </Button>
                      </div>
                    </Stagger>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.form>
        )}

        {mode === "forgot" && (
          <motion.form
            key="forgot"
            custom={modeDir}
            variants={travel}
            initial="hidden"
            animate="show"
            exit="exit"
            noValidate
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            {formError && (
              <Stagger>
                <Alert message={formError} />
              </Stagger>
            )}

            <Stagger>
              <Field
                label="Registered email"
                htmlFor="auth-email"
                required
                error={errors.email}
                hint={
                  otpSent
                    ? "A recovery code has been sent to this address."
                    : "We'll send a 6-digit recovery code to this address."
                }
              >
                <Input
                  id="auth-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  invalid={Boolean(errors.email)}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearErrors("email");
                    if (otpSent) {
                      setOtpSent(false);
                      setOtp("");
                      setNewPassword("");
                    }
                  }}
                  placeholder="student@college.edu"
                  required
                />
              </Field>
            </Stagger>

            <Stagger>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-muted">
                  {otpSent ? "Didn't get the code?" : "No code requested yet."}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={sendingCode}
                  disabled={sendingCode || !email.trim()}
                  onClick={() => void handleRequestOtp()}
                >
                  {otpSent ? "Resend code" : "Send code"}
                </Button>
              </div>
            </Stagger>

            {otpSent && (
              <>
                <Stagger>
                  <Field
                    label="6-digit recovery code"
                    htmlFor="auth-otp"
                    required
                    error={errors.otp}
                    hint={otpHint}
                  >
                    <Input
                      id="auth-otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      invalid={Boolean(errors.otp)}
                      maxLength={6}
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value.trim());
                        clearErrors("otp");
                      }}
                      placeholder="123456"
                      className="text-center font-mono tracking-[0.3em]"
                      required
                    />
                  </Field>
                </Stagger>

                <Stagger>
                  <Field
                    label="New password"
                    htmlFor="auth-new-password"
                    required
                    error={errors.newPassword}
                    hint="At least 8 characters."
                  >
                    <PasswordInput
                      id="auth-new-password"
                      autoComplete="new-password"
                      invalid={Boolean(errors.newPassword)}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        clearErrors("newPassword");
                      }}
                      placeholder="Choose a new password"
                      required
                    />
                  </Field>
                </Stagger>

                <Stagger>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={loading}
                    disabled={loading || !otpSent}
                  >
                    Update password
                  </Button>
                </Stagger>
              </>
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </Modal>

    {/* The success ceremony — mounted outside <Modal> so it keeps playing
        over the page while the dialog animates away. Decorative; the toast
        carries the announcement. */}
    <AnimatePresence>
      {flash && <SuccessFlash key={flash} kind={flash} onDone={() => setFlash(null)} />}
    </AnimatePresence>
    </>
  );
};
