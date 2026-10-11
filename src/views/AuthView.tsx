import React, { useState } from 'react';
import { Member } from '../types';
import {
  Sun,
  Moon,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Check,
  ShieldCheck,
  Lock,
  Mail,
  User,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  authenticateUser,
  registerNewUser,
  resetUserPassword,
  requestPasswordReset,
  confirmPasswordReset,
} from '../utils/auth';
import { EmailVerificationModal } from '../components/modals/EmailVerificationModal';
import {
  isSupabaseConfigured,
  supabaseSignIn,
  supabaseSignUp,
} from '../utils/supabase';

interface AuthViewProps {
  onLogin: (user: Member) => void;
  onRegister: (user: Member) => void;
  onGuest: () => void;
  darkMode: boolean;
  setDarkMode: (d: boolean) => void;
  onToast: (msg: string) => void;
}

const AVATAR_COLORS = [
  '#FF6A5B', // Coral
  '#A8CF2E', // Lime
  '#7BCFB8', // Teal
  '#FFB547', // Amber
  '#9B7BC7', // Plum
  '#16213E', // Navy
  '#3B82F6', // Blue
  '#EC4899', // Pink
];

export function AuthView({
  onLogin,
  onRegister,
  onGuest,
  darkMode,
  setDarkMode,
  onToast,
}: AuthViewProps) {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [loading, setLoading] = useState(false);

  // Sign In form fields
  const [loginEmail, setLoginEmail] = useState('alex@weekend.quest');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regColor, setRegColor] = useState('#FF6A5B');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [agreedPledge, setAgreedPledge] = useState(true);

  // Forgot password modal (2-step with email OTP)
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotDevCode, setForgotDevCode] = useState('');
  const [forgotPreviewUrl, setForgotPreviewUrl] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Email verification modal
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [devCode, setDevCode] = useState('');
  const [emailPreviewUrl, setEmailPreviewUrl] = useState<string | null>(null);
  const [realSent, setRealSent] = useState(false);

  const [authError, setAuthError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const errs: Record<string, string> = {};
    if (!loginEmail.trim()) errs.email = 'Enter your email address';
    if (!loginPassword) errs.password = 'Enter your password';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const res = isSupabaseConfigured
        ? await supabaseSignIn(loginEmail, loginPassword)
        : await authenticateUser(loginEmail, loginPassword);

      if (!res.success || !res.user) {
        setAuthError(res.error || 'Authentication failed. Please check your credentials.');
        return;
      }

      onLogin(res.user);
      onToast(`Welcome back, ${res.user.name}!`);
    } catch (err) {
      setAuthError('Authentication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const errs: Record<string, string> = {};
    if (!regName.trim()) errs.name = 'Please provide your full name';
    if (!regEmail.trim() || !regEmail.includes('@')) errs.email = 'Enter a valid email address';
    if (!regPassword || regPassword.length < 6)
      errs.password = 'Password must be at least 6 characters long';
    if (regPassword !== regConfirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!agreedPledge) errs.pledge = 'Please accept the Weekend Pledge to continue';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const res = isSupabaseConfigured
        ? await supabaseSignUp(regName, regEmail, regPassword, regColor)
        : await registerNewUser(regName, regEmail, regPassword, regColor);

      if (!res.success) {
        setAuthError(res.error || 'Failed to create account.');
        return;
      }

      if (res.verificationRequired) {
        setVerifyEmail(regEmail.trim().toLowerCase());
        setDevCode(res.devCode || '');
        setEmailPreviewUrl(res.emailPreviewUrl || null);
        setRealSent(Boolean(res.realSent));
        setVerifyOpen(true);
        if (res.realSent) {
          onToast(`Verification email sent to ${regEmail}!`);
        } else {
          onToast(`Verification code sent to ${regEmail}`);
        }
        return;
      }

      if (res.user) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        onRegister(res.user);
        onToast(`Account created! Welcome, ${res.user.name}!`);
      }
    } catch (err) {
      setAuthError('Registration error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (email: string) => {
    setLoginEmail(email);
    setLoginPassword('password123');
    setAuthError('');
    setLoading(true);
    try {
      const res = await authenticateUser(email, 'password123');
      if (res.success && res.user) {
        onLogin(res.user);
        onToast(`Signed in as ${res.user.name}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your account email.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await requestPasswordReset(forgotEmail.trim());
      if (res.success) {
        setForgotDevCode(res.devCode || '');
        setForgotPreviewUrl(res.emailPreviewUrl || null);
        setForgotStep(2);
        onToast(`Security code sent to ${forgotEmail}!`);
      } else {
        setForgotError(res.error || 'Could not send reset code.');
      }
    } catch (err) {
      setForgotError('Network error. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotCode.trim()) {
      setForgotError('Please enter the 6-digit verification code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await confirmPasswordReset(forgotEmail.trim(), forgotCode.trim(), newPassword);
      if (!res.success) {
        setForgotError(res.error || 'Reset failed.');
        return;
      }

      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
      setForgotOpen(false);
      setForgotStep(1);
      setLoginEmail(forgotEmail);
      setLoginPassword(newPassword);
      onToast('Password updated! You can now sign in.');
    } catch (err) {
      setForgotError('Network error. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-navy-dark text-navy dark:text-cream flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      {/* Top right theme toggle */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-11 h-11 rounded-2xl bg-white dark:bg-navy-card border border-navy/10 dark:border-white/10 grid place-items-center text-navy dark:text-cream hover:bg-cream-2 dark:hover:bg-navy transition-colors shadow-soft"
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber" /> : <Moon className="w-5 h-5 text-navy" />}
        </button>
      </div>

      <div className="max-w-5xl w-full mx-auto grid lg:grid-cols-12 gap-8 items-center">
        {/* Left column: Brand storytelling & visual preview */}
        <div className="lg:col-span-6 space-y-6 lg:pr-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-coral grid place-items-center shadow-coral">
              <Sun className="w-6 h-6 text-cream" />
            </div>
            <div className="leading-none">
              <span className="font-display font-extrabold text-2xl tracking-tight dark:text-cream">
                Weekend
              </span>
              <span className="font-display font-extrabold text-2xl tracking-tight text-coral block -mt-1">
                Quest
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime/40 dark:bg-lime-900/40 text-xs font-bold text-navy dark:text-lime">
              <Sparkles className="w-3.5 h-3.5 text-lime-dark" />
              Real authentication with password verification
            </span>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl leading-[1.1] tracking-tight dark:text-cream">
              Weekends are too short for <span className="text-coral">lost plans.</span>
            </h1>
            <p className="text-base sm:text-lg text-navy/70 dark:text-cream/70 leading-relaxed">
              No more endless group chat debates. Pitch ideas, vote on the best adventures, divide
              expenses, and lock in the fun before Friday night.
            </p>
          </div>

          {/* Social Proof Cards */}
          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-2xl bg-white dark:bg-navy-card border border-navy/5 dark:border-white/5 shadow-soft flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-coral/10 grid place-items-center text-2xl">
                🍕
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm dark:text-cream">
                  Pizza & movie marathon
                </p>
                <p className="text-xs text-navy/50 dark:text-cream/50">Fri · 7:30 PM · 4 going</p>
              </div>
              <span className="text-xs font-bold text-coral px-2.5 py-1 rounded-full bg-coral/10">
                Confirmed
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-navy-card border border-navy/5 dark:border-white/5 shadow-soft flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-lime/30 grid place-items-center text-2xl">
                🥾
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm dark:text-cream">
                  Sunset hike at Eagle Ridge
                </p>
                <p className="text-xs text-navy/50 dark:text-cream/50">Sat · 5:00 PM · 6 votes</p>
              </div>
              <span className="text-xs font-bold text-teal px-2.5 py-1 rounded-full bg-teal/10">
                Top Voted
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-navy/50 dark:text-cream/50 pt-2">
            <ShieldCheck className="w-4 h-4 text-teal" />
            <span>SHA-256 password hashing • Verified local registry</span>
          </div>
        </div>

        {/* Right column: Auth Card */}
        <div className="lg:col-span-6">
          <div className="bg-white dark:bg-navy-card rounded-3xl border border-navy/10 dark:border-white/10 shadow-lifted p-6 sm:p-9 transition-colors relative overflow-hidden">
            {/* Header Tabs */}
            <div className="flex p-1 bg-cream-2 dark:bg-navy rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrors({});
                  setAuthError('');
                }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                  mode === 'signin'
                    ? 'bg-white dark:bg-navy-card text-navy dark:text-cream shadow-sm'
                    : 'text-navy/60 dark:text-cream/60 hover:text-navy dark:hover:text-cream'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrors({});
                  setAuthError('');
                }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                  mode === 'register'
                    ? 'bg-white dark:bg-navy-card text-navy dark:text-cream shadow-sm'
                    : 'text-navy/60 dark:text-cream/60 hover:text-navy dark:hover:text-cream'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Global Authentication Error Alert */}
            {authError && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-coral mt-0.5" />
                <div className="flex-1 font-semibold leading-relaxed">{authError}</div>
              </div>
            )}

            {/* Mode 1: Sign In */}
            {mode === 'signin' && (
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5 dark:text-cream">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40 dark:text-cream/40" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        setAuthError('');
                      }}
                      placeholder="alex@weekend.quest"
                      className="w-full pl-10 pr-4 h-12 rounded-xl bg-cream-2 dark:bg-navy border border-transparent focus:border-coral focus:bg-white text-sm dark:text-cream focus:outline-none transition-all"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-coral-dark font-semibold mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-bold dark:text-cream">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(loginEmail);
                        setForgotOpen(true);
                        setForgotError('');
                      }}
                      className="text-xs font-semibold text-coral hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40 dark:text-cream/40" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setAuthError('');
                      }}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 h-12 rounded-xl bg-cream-2 dark:bg-navy border border-transparent focus:border-coral focus:bg-white text-sm dark:text-cream focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy/40 dark:text-cream/40 hover:text-navy"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-coral-dark font-semibold mt-1">{errors.password}</p>
                  )}
                  <p className="text-[11px] text-navy/50 dark:text-cream/50 mt-1">
                    Default demo password: <code className="font-mono font-bold text-coral">password123</code>
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-navy/70 dark:text-cream/70">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 accent-coral rounded"
                    />
                    Remember me on this device
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-2xl bg-coral text-cream font-bold text-sm shadow-coral hover:bg-coral-dark active:scale-95 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
                >
                  {loading ? (
                    <span className="inline-block animate-spin mr-2">⏳</span>
                  ) : (
                    <>
                      <span>Sign In with Verification</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* 1-Click Quick Demo Accounts with pre-verified credentials */}
                <div className="pt-4 border-t border-navy/10 dark:border-white/10 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-navy/40 dark:text-cream/40 text-center">
                    Instant Demo Login (Valid Credentials)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickDemo('alex@weekend.quest')}
                      className="px-3 py-2 rounded-xl bg-cream-2/70 dark:bg-navy/70 hover:bg-cream-3 dark:hover:bg-navy text-xs font-bold text-navy dark:text-cream transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span className="w-2 h-2 rounded-full bg-coral"></span>
                      Alex Rivera
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDemo('maya@weekend.quest')}
                      className="px-3 py-2 rounded-xl bg-cream-2/70 dark:bg-navy/70 hover:bg-cream-3 dark:hover:bg-navy text-xs font-bold text-navy dark:text-cream transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span className="w-2 h-2 rounded-full bg-lime"></span>
                      Maya Chen
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Mode 2: Register */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5 dark:text-cream">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40 dark:text-cream/40" />
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Jordan Smith"
                      className="w-full pl-10 pr-4 h-12 rounded-xl bg-cream-2 dark:bg-navy border border-transparent focus:border-coral focus:bg-white text-sm dark:text-cream focus:outline-none transition-all"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-coral-dark font-semibold mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold mb-1.5 dark:text-cream">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40 dark:text-cream/40" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="jordan@example.com"
                      className="w-full pl-10 pr-4 h-12 rounded-xl bg-cream-2 dark:bg-navy border border-transparent focus:border-coral focus:bg-white text-sm dark:text-cream focus:outline-none transition-all"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-coral-dark font-semibold mt-1">{errors.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold mb-1.5 dark:text-cream">Password</label>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="min 6 chars"
                      className="w-full px-3 h-12 rounded-xl bg-cream-2 dark:bg-navy border border-transparent focus:border-coral focus:bg-white text-sm dark:text-cream focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1.5 dark:text-cream">Confirm</label>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="repeat"
                      className="w-full px-3 h-12 rounded-xl bg-cream-2 dark:bg-navy border border-transparent focus:border-coral focus:bg-white text-sm dark:text-cream focus:outline-none transition-all"
                    />
                  </div>
                </div>
                {errors.password && (
                  <p className="text-xs text-coral-dark font-semibold">{errors.password}</p>
                )}
                {errors.confirmPassword && (
                  <p className="text-xs text-coral-dark font-semibold">{errors.confirmPassword}</p>
                )}

                {/* Avatar Color Choice */}
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-navy/50 dark:text-cream/50">
                    Your Crew Avatar Color
                  </label>
                  <div className="flex gap-2">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setRegColor(c)}
                        className="w-8 h-8 rounded-full grid place-items-center transition-transform hover:scale-110 shadow-sm"
                        style={{ backgroundColor: c }}
                      >
                        {regColor === c && <Check className="w-4 h-4 text-white stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Weekend Pledge */}
                <label className="flex items-start gap-2.5 cursor-pointer text-xs leading-snug text-navy/70 dark:text-cream/70 pt-1">
                  <input
                    type="checkbox"
                    checked={agreedPledge}
                    onChange={(e) => setAgreedPledge(e.target.checked)}
                    className="w-4 h-4 accent-coral rounded mt-0.5"
                  />
                  <span>
                    I take the <strong>Weekend Pledge</strong>: to suggest fun ideas, vote by Thursday,
                    and never bail without bringing snacks.
                  </span>
                </label>
                {errors.pledge && (
                  <p className="text-xs text-coral-dark font-semibold">{errors.pledge}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-2xl bg-coral text-cream font-bold text-sm shadow-coral hover:bg-coral-dark active:scale-95 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Register & Secure Password</span>
                </button>
              </form>
            )}

            {/* Bottom Guest Action */}
            <div className="mt-5 pt-4 text-center border-t border-navy/5 dark:border-white/5">
              <button
                type="button"
                onClick={onGuest}
                className="text-xs font-bold text-navy/60 dark:text-cream/60 hover:text-coral transition-colors"
              >
                Skip sign-in & explore demo as Guest →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Reset Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-navy/50 backdrop-blur-sm"
            onClick={() => setForgotOpen(false)}
          />
          <div className="relative bg-white dark:bg-navy-card w-full max-w-md rounded-3xl shadow-lifted p-6 border border-navy/10 dark:border-white/10 z-10 slide-in-right">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-coral/10 text-coral grid place-items-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg dark:text-cream">
                {forgotStep === 1 ? 'Reset Password' : 'Enter Security Code'}
              </h3>
            </div>
            <p className="text-xs text-navy/60 dark:text-cream/60 mb-4">
              {forgotStep === 1
                ? 'Enter your account email to receive a 6-digit security code.'
                : `We sent a 6-digit security code to ${forgotEmail}.`}
            </p>

            {forgotError && (
              <p className="text-xs text-coral-dark font-semibold mb-3">{forgotError}</p>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleSendResetCode} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold mb-1 dark:text-cream">Account Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="alex@weekend.quest"
                    className="w-full px-3 h-11 rounded-xl bg-cream-2 dark:bg-navy text-xs dark:text-cream border border-transparent focus:border-coral focus:outline-none"
                    required
                    autoFocus
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotOpen(false);
                      setForgotStep(1);
                    }}
                    className="px-3.5 h-10 rounded-xl text-xs font-bold text-navy/60 dark:text-cream/60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading || !forgotEmail.trim()}
                    className="px-4 h-10 rounded-xl bg-coral text-cream text-xs font-bold shadow-coral hover:bg-coral-dark disabled:opacity-50"
                  >
                    {forgotLoading ? 'Sending code...' : 'Send Security Code'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                {forgotDevCode && (
                  <div className="p-2.5 rounded-xl bg-lime/10 border border-lime/30 text-[11px] text-lime-dark font-mono flex items-center justify-between">
                    <span>Dev Code: <strong>{forgotDevCode}</strong></span>
                    <button
                      type="button"
                      onClick={() => setForgotCode(forgotDevCode)}
                      className="text-[10px] font-bold underline ml-2"
                    >
                      Autofill
                    </button>
                  </div>
                )}

                {forgotPreviewUrl && (
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between">
                    <span>Delivered to test mailer</span>
                    <a
                      href={forgotPreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold underline text-blue-600 dark:text-blue-400"
                    >
                      Open Email →
                    </a>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold mb-1 dark:text-cream">6-Digit Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full px-3 h-11 rounded-xl bg-cream-2 dark:bg-navy text-sm font-mono font-bold tracking-widest text-center dark:text-cream border border-transparent focus:border-coral focus:outline-none"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 dark:text-cream">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3 h-11 rounded-xl bg-cream-2 dark:bg-navy text-xs dark:text-cream border border-transparent focus:border-coral focus:outline-none"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-between items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="text-xs font-bold text-navy/50 dark:text-cream/50 hover:underline"
                  >
                    ← Change Email
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotOpen(false);
                        setForgotStep(1);
                      }}
                      className="px-3.5 h-10 rounded-xl text-xs font-bold text-navy/60 dark:text-cream/60"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading || !forgotCode || !newPassword}
                      className="px-4 h-10 rounded-xl bg-coral text-cream text-xs font-bold shadow-coral hover:bg-coral-dark disabled:opacity-50"
                    >
                      {forgotLoading ? 'Updating...' : 'Save New Password'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 6-Digit Email Verification Modal */}
      <EmailVerificationModal
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        email={verifyEmail}
        devCode={devCode}
        emailPreviewUrl={emailPreviewUrl}
        realSent={realSent}
        onSuccess={(user) => {
          onRegister(user);
        }}
        onToast={onToast}
      />
    </div>
  );
}
