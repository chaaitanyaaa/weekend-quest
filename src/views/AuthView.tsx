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
  Smartphone,
  Wand2,
  Trash2,
  Ticket,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  authenticateUser,
  registerNewUser,
  resetUserPassword,
  requestPasswordReset,
  confirmPasswordReset,
  sendLoginOtp,
  deleteUserAccount,
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

function PaperClip() {
  return (
    <div className="absolute -top-3.5 right-3.5 z-10 pointer-events-none select-none">
      <svg
        viewBox="0 0 16 36"
        className="w-3.5 h-7 drop-shadow-sm text-[#78716C] dark:text-[#A8A29E]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 9 V28 C5 31 11 31 11 28 V6 C11 2 2 2 2 6 V24 C2 27 8 27 8 24 V9" />
      </svg>
    </div>
  );
}

export function AuthView({
  onLogin,
  onRegister,
  onGuest,
  darkMode,
  setDarkMode,
  onToast,
}: AuthViewProps) {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [signInMethod, setSignInMethod] = useState<'password' | 'otp'>('password');
  const [loading, setLoading] = useState(false);
  const [devToolsOpen, setDevToolsOpen] = useState(false);

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

  // Verification & Login OTP modal
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyMode, setVerifyMode] = useState<'register' | 'login'>('register');
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

  const handleOtpLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!loginEmail.trim() || !loginEmail.includes('@')) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);
    try {
      const res = await sendLoginOtp(loginEmail.trim());
      if (!res.success) {
        setAuthError(res.error || 'Failed to send one-time code.');
        return;
      }

      setVerifyEmail(loginEmail.trim().toLowerCase());
      setDevCode(res.devCode || '');
      setEmailPreviewUrl(res.emailPreviewUrl || null);
      setRealSent(Boolean(res.realSent));
      setVerifyMode('login');
      setVerifyOpen(true);
      if (res.realSent) {
        onToast(`One-time security code emailed to ${loginEmail}!`);
      } else {
        onToast(`One-time security code generated for ${loginEmail}`);
      }
    } catch (err) {
      setAuthError('Network error. Please try again.');
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
        setVerifyMode('register');
        setVerifyOpen(true);
        if (res.realSent) {
          onToast(`Verification email sent to ${regEmail}!`);
        } else {
          onToast(`Verification code sent to ${regEmail}`);
        }
        return;
      }

      if (res.user) {
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

  const handleGenerateFreshEmail = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const freshEmail = `tester.${Date.now().toString().slice(-4)}${randomSuffix}@gmail.com`;
    if (mode === 'signin') {
      setLoginEmail(freshEmail);
      setLoginPassword('password123');
      onToast(`Generated fresh test email: ${freshEmail}`);
    } else {
      setRegName(`Quest Tester ${randomSuffix}`);
      setRegEmail(freshEmail);
      setRegPassword('password123');
      setRegConfirmPassword('password123');
      onToast(`Generated new registration credentials!`);
    }
    setAuthError('');
    setErrors({});
  };

  const handleClearCurrentAccount = async () => {
    const targetEmail = (mode === 'signin' ? loginEmail : regEmail).trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      onToast('Enter an email address above to reset it');
      return;
    }
    setLoading(true);
    try {
      const res = await deleteUserAccount(targetEmail);
      onToast(res.message || `Cleared ${targetEmail} from database!`);
      setAuthError('');
      setErrors({});
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
    <div className="min-h-screen bg-cream dark:bg-navy-dark text-navy dark:text-cream flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-200 bg-dots relative overflow-hidden">
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

      <div className="max-w-5xl w-full mx-auto grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left column: Brand storytelling & tactile itinerary slips */}
        <div className="lg:col-span-6 space-y-6 lg:pr-4">
          {/* Brand Mark Header */}
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

          <div>
            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-[3.1rem] leading-[1.05] tracking-tight text-navy dark:text-cream uppercase">
              WEEKENDS ARE TOO SHORT FOR{' '}
              <span className="line-through decoration-coral decoration-4 text-navy/35 dark:text-cream/35">
                GROUP CHATS
              </span>
              <span className="text-coral block">LOST PLANS.</span>
            </h1>
          </div>

          {/* Editorial Hook & 3 Pinned Paper Calendar Cards */}
          <div className="space-y-3 pt-1">
            <div className="text-base sm:text-lg font-bold text-navy/80 dark:text-cream/80 tracking-tight">
              Start your next quest now.
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3.5 pt-1 items-start">
              {/* Card 1: Friday */}
              <div className="relative bg-[#FCFBF8] text-[#111827] rounded-xl p-2.5 sm:p-3.5 border border-[#DFD3B9] shadow-md -rotate-1 hover:rotate-0 hover:shadow-lg transition-all duration-200 select-none flex flex-col justify-between min-h-[195px] sm:min-h-[210px]">
                <PaperClip />
                <div>
                  <div className="flex items-start justify-between pb-1.5">
                    <div>
                      <div className="font-display font-black text-base sm:text-xl tracking-tight leading-none uppercase text-[#111827]">
                        FRIDAY
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-mono font-bold text-[#111827]/70 mt-0.5">
                        Mar 15
                      </div>
                    </div>
                    <div className="w-5 sm:w-6 h-6 sm:h-7 rounded border border-[#111827]/30 bg-white flex flex-col items-center overflow-hidden shrink-0 shadow-xs">
                      <div className="w-full h-1.5 sm:h-2 bg-[#111827]" />
                      <span className="text-[8px] sm:text-[10px] font-mono font-black text-[#111827] leading-none mt-0.5">15</span>
                    </div>
                  </div>

                  <div className="py-2 border-t border-[#111827]/10 text-[10px] sm:text-xs font-semibold text-[#111827] leading-snug">
                    <span className="font-black">7 PM</span>
                    <span className="text-[#111827]/30 mx-1 font-normal">|</span>
                    <span>Rooftop Drinks @ The Perch</span>
                  </div>
                </div>

                {/* Hand-drawn sketches */}
                <div className="pt-2 border-t border-[#111827]/10 flex items-center justify-between text-[#111827]/60">
                  <svg viewBox="0 0 28 20" className="w-6 sm:w-7 h-4.5 sm:h-5 stroke-current fill-none stroke-[1.6] stroke-linecap-round stroke-linejoin-round">
                    <polygon points="2,4 10,2 18,4 26,2 26,17 18,19 10,17 2,19" />
                    <line x1="10" y1="2" x2="10" y2="17" />
                    <line x1="18" y1="4" x2="18" y2="19" />
                    <circle cx="14" cy="10" r="1.8" />
                  </svg>
                  <svg viewBox="0 0 22 14" className="w-4.5 sm:w-5 h-3 sm:h-3.5 stroke-current fill-none stroke-[1.5] stroke-linecap-round">
                    <path d="M2 10 Q7 2 12 8 T20 4" />
                  </svg>
                  <svg viewBox="0 0 18 18" className="w-4 sm:w-4.5 h-4 sm:h-4.5 stroke-current fill-none stroke-[1.5] stroke-linecap-round">
                    <line x1="3" y1="7" x2="15" y2="7" />
                    <line x1="9" y1="7" x2="9" y2="15" />
                    <line x1="5" y1="15" x2="13" y2="15" />
                    <path d="M6 3 L12 3 L9 7 Z" />
                  </svg>
                </div>
              </div>

              {/* Card 2: Saturday (Warm aged kraft paper) */}
              <div className="relative bg-[#F2E5C9] text-[#1B1811] rounded-xl p-2.5 sm:p-3.5 border border-[#D9C49E] shadow-md rotate-0.5 hover:scale-[1.02] hover:shadow-lg transition-all duration-200 select-none flex flex-col justify-between min-h-[195px] sm:min-h-[210px]">
                <PaperClip />
                <div>
                  <div className="flex items-start justify-between pb-1.5">
                    <div>
                      <div className="font-display font-black text-base sm:text-xl tracking-tight leading-none uppercase text-[#1B1811]">
                        SATURDAY
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-mono font-bold text-[#1B1811]/70 mt-0.5">
                        Mar 16
                      </div>
                    </div>
                    <div className="w-5 sm:w-6 h-6 sm:h-7 rounded border border-[#1B1811]/30 bg-[#FFFBF0] flex flex-col items-center overflow-hidden shrink-0 shadow-xs">
                      <div className="w-full h-1.5 sm:h-2 bg-[#1B1811]" />
                      <span className="text-[8px] sm:text-[10px] font-mono font-black text-[#1B1811] leading-none mt-0.5">16</span>
                    </div>
                  </div>

                  <div className="py-2 border-t border-[#1B1811]/15 text-[10px] sm:text-xs font-semibold text-[#1B1811] space-y-1 leading-snug">
                    <div>
                      <span className="font-black">10 AM</span>
                      <span className="text-[#1B1811]/30 mx-1 font-normal">|</span>
                      <span>Forest Hike @ Fern Creek Trail</span>
                    </div>
                    <div>
                      <span className="font-black">6 PM</span>
                      <span className="text-[#1B1811]/30 mx-1 font-normal">|</span>
                      <span>Dinner @ Campfire Grill</span>
                    </div>
                  </div>
                </div>

                {/* Hand-drawn sketches */}
                <div className="pt-2 border-t border-[#1B1811]/15 flex items-center justify-between text-[#1B1811]/75">
                  <svg viewBox="0 0 26 18" className="w-5.5 sm:w-6 h-4 sm:h-4.5 stroke-current fill-none stroke-[1.5] stroke-linejoin-round">
                    <polygon points="7,16 3,16 6,10 4,10 7,5 10,10 8,10 11,16 7,16" />
                    <polygon points="17,16 13,16 16,11 14,11 17,6 20,11 18,11 21,16 17,16" />
                  </svg>
                  <svg viewBox="0 0 18 15" className="w-4 sm:w-4.5 h-3 sm:h-3.5 stroke-current fill-none stroke-[1.5] stroke-linecap-round">
                    <path d="M2 3 H16 V10 H7 L4 13 V10 H2 Z" />
                  </svg>
                  <svg viewBox="0 0 18 18" className="w-4 sm:w-4.5 h-4 sm:h-4.5 stroke-current fill-none stroke-[1.5] stroke-linecap-round">
                    <line x1="3" y1="15" x2="15" y2="15" />
                    <line x1="4" y1="16" x2="14" y2="12" />
                    <line x1="14" y1="16" x2="4" y2="12" />
                    <path d="M9 3 C7 6 5 8 6 11 C7 13 11 13 12 11 C13 8 10 6 9 3 Z" />
                  </svg>
                </div>
              </div>

              {/* Card 3: Sunday */}
              <div className="relative bg-[#FCFBF8] text-[#111827] rounded-xl p-2.5 sm:p-3.5 border border-[#DFD3B9] shadow-md rotate-1 hover:rotate-0 hover:shadow-lg transition-all duration-200 select-none flex flex-col justify-between min-h-[195px] sm:min-h-[210px]">
                <PaperClip />
                <div>
                  <div className="flex items-start justify-between pb-1.5">
                    <div>
                      <div className="font-display font-black text-base sm:text-xl tracking-tight leading-none uppercase text-[#111827]">
                        SUNDAY
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-mono font-bold text-[#111827]/70 mt-0.5">
                        Mar 17
                      </div>
                    </div>
                    <div className="w-5 sm:w-6 h-6 sm:h-7 rounded border border-[#111827]/30 bg-white flex flex-col items-center overflow-hidden shrink-0 shadow-xs">
                      <div className="w-full h-1.5 sm:h-2 bg-[#111827]" />
                      <span className="text-[8px] sm:text-[10px] font-mono font-black text-[#111827] leading-none mt-0.5">17</span>
                    </div>
                  </div>

                  <div className="py-2 border-t border-[#111827]/10 text-[10px] sm:text-xs font-semibold text-[#111827] leading-snug">
                    <span className="font-black">11 AM</span>
                    <span className="text-[#111827]/30 mx-1 font-normal">|</span>
                    <span>Brunch & Vinyl @ The Needle & Groove</span>
                  </div>
                </div>

                {/* Hand-drawn sketches */}
                <div className="pt-2 border-t border-[#111827]/10 flex items-center justify-between text-[#111827]/65">
                  <svg viewBox="0 0 20 20" className="w-4.5 sm:w-5 h-4.5 sm:h-5 stroke-current fill-none stroke-[1.5]">
                    <circle cx="10" cy="10" r="8" />
                    <circle cx="10" cy="10" r="4.5" strokeDasharray="1.5 1.5" />
                    <circle cx="10" cy="10" r="1.8" fill="currentColor" />
                    <line x1="14" y1="3" x2="11.5" y2="8" strokeLinecap="round" />
                  </svg>
                  <svg viewBox="0 0 16 16" className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-current fill-none stroke-[1.5] stroke-linecap-round stroke-linejoin-round">
                    <path d="M8 13.5 C8 13.5 1.5 9.5 1.5 5.5 C1.5 3.5 3 2 5 2 C6.2 2 7.2 2.7 8 3.5 C8.8 2.7 9.8 2 11 2 C13 2 14.5 3.5 14.5 5.5 C14.5 9.5 8 13.5 8 13.5 Z" />
                  </svg>
                  <svg viewBox="0 0 18 18" className="w-4 sm:w-4.5 h-4 sm:h-4.5 stroke-current fill-none stroke-[1.5]">
                    <rect x="3" y="2.5" width="12" height="13" rx="2" />
                    <circle cx="9" cy="10.5" r="2.8" />
                    <circle cx="9" cy="5.5" r="1" fill="currentColor" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Security badge footer */}
          <div className="flex items-center gap-2 text-xs font-mono text-navy/60 dark:text-cream/60 pt-1">
            <ShieldCheck className="w-4 h-4 text-teal shrink-0" />
            <span>END-TO-END SECURE VAULT · SHA-256 HASHED · OTP READY</span>
          </div>
        </div>

        {/* Right column: Tactile VIP Event Pass Auth Card (Faithful to Mockup, Zero Clutter) */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-md relative bg-[#FAF4E6] text-[#111827] rounded-3xl border border-[#DFD3B9] shadow-lifted overflow-hidden flex">
            {/* Left Vertical Punch-Hole Binder Strip */}
            <div className="w-8 sm:w-10 bg-[#F4EBD6] border-r-2 border-dashed border-[#DFD3B9] flex flex-col justify-around items-center py-6 shrink-0 select-none">
              <div className="w-3.5 h-3.5 rounded-full bg-cream dark:bg-navy-dark border border-[#DFD3B9] shadow-inner" />
              <div className="w-3.5 h-3.5 rounded-full bg-cream dark:bg-navy-dark border border-[#DFD3B9] shadow-inner" />
              <div className="w-3.5 h-3.5 rounded-full bg-cream dark:bg-navy-dark border border-[#DFD3B9] shadow-inner" />
              <div className="w-3.5 h-3.5 rounded-full bg-cream dark:bg-navy-dark border border-[#DFD3B9] shadow-inner" />
              <div className="w-3.5 h-3.5 rounded-full bg-cream dark:bg-navy-dark border border-[#DFD3B9] shadow-inner" />
              <div className="w-3.5 h-3.5 rounded-full bg-cream dark:bg-navy-dark border border-[#DFD3B9] shadow-inner" />
            </div>

            {/* Ticket Content Container */}
            <div className="flex-1 p-6 sm:p-7 flex flex-col justify-between relative">
              {/* Top Ticket Header */}
              <div>
                <div className="flex items-start justify-between pb-2.5 border-b border-[#DFD3B9]">
                  <div>
                    <span className="font-display font-black text-xl tracking-tight text-[#111827] block leading-none">
                      WEEKEND
                    </span>
                    <span className="font-display font-black text-xl tracking-tight text-coral block leading-none">
                      QUEST
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-mono font-black tracking-wider text-[#111827] block uppercase">
                      VIP EVENT PASS
                    </span>
                    <span className="text-[10px] font-mono text-[#111827]/60 block font-semibold">
                      NO. 2026-001
                    </span>
                  </div>
                </div>
                <div className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#111827]/70 pt-2 pb-4">
                  ADMIT ONE: CREATIVE ADVENTURE
                </div>
              </div>

              {/* Global Authentication Error Alert */}
              {authError && (
                <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-300 flex items-start gap-2 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 shrink-0 text-coral mt-0.5" />
                  <div className="flex-1 font-semibold leading-relaxed">{authError}</div>
                </div>
              )}

              {/* Mode: Sign In Form */}
              {mode === 'signin' ? (
                <form onSubmit={handleSignInSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider mb-1 text-[#111827]/80">
                      EMAIL
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => {
                          setLoginEmail(e.target.value);
                          setAuthError('');
                        }}
                        placeholder="your.name@email.com"
                        className="w-full pl-10 pr-4 h-11 rounded-xl bg-[#232936] text-white border border-black/10 focus:ring-2 focus:ring-coral/40 text-sm focus:outline-none transition-all placeholder-white/35 font-medium"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-coral-dark font-semibold mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider mb-1 text-[#111827]/80">
                      PASSWORD
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => {
                          setLoginPassword(e.target.value);
                          setAuthError('');
                        }}
                        placeholder="Enter your password"
                        className="w-full pl-10 pr-11 h-11 rounded-xl bg-[#232936] text-white border border-black/10 focus:ring-2 focus:ring-coral/40 text-sm focus:outline-none transition-all placeholder-white/35 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-coral-dark font-semibold mt-1">{errors.password}</p>
                    )}
                    <div className="flex justify-end mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(loginEmail);
                          setForgotOpen(true);
                          setForgotError('');
                        }}
                        className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#111827]/70 hover:text-coral transition-colors"
                      >
                        FORGOT PASSWORD?
                      </button>
                    </div>
                  </div>

                  {/* Stamped Ticket Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 rounded-xl bg-[#1A1F2C] hover:bg-black active:scale-[0.98] text-white font-mono font-black text-xs uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? 'CHECKING PASS...' : 'LOGIN TO YOUR QUEST'}
                  </button>

                  {/* Mode switch */}
                  <div className="text-center text-[11px] font-mono text-[#111827]/70 pt-1">
                    DON'T HAVE AN ACCOUNT?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setAuthError('');
                        setErrors({});
                      }}
                      className="font-extrabold text-[#111827] underline hover:text-coral transition-colors"
                    >
                      SIGN UP
                    </button>
                  </div>

                  {/* Quick crew demo access */}
                  <div className="pt-2 border-t border-[#DFD3B9] flex items-center justify-between text-[10px] font-mono text-[#111827]/60">
                    <span className="font-bold">CREW DEMO:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickDemo('alex@weekend.quest')}
                        className="px-2 py-0.5 rounded bg-black/5 hover:bg-black/10 font-bold text-[#111827] transition-colors"
                      >
                        Alex (Lead)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDemo('maya@weekend.quest')}
                        className="px-2 py-0.5 rounded bg-black/5 hover:bg-black/10 font-bold text-[#111827] transition-colors"
                      >
                        Maya (Trail)
                      </button>
                      <button
                        type="button"
                        onClick={onGuest}
                        className="px-2 py-0.5 rounded bg-black/5 hover:bg-black/10 font-bold text-[#111827] transition-colors"
                      >
                        Guest
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                /* Mode: Sign Up / Register Form */
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider mb-1 text-[#111827]/80">
                      FULL NAME
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Jordan Smith"
                        className="w-full pl-10 pr-4 h-11 rounded-xl bg-[#232936] text-white border border-black/10 focus:ring-2 focus:ring-coral/40 text-sm focus:outline-none transition-all placeholder-white/35 font-medium"
                      />
                    </div>
                    {errors.name && (
                      <p className="text-xs text-coral-dark font-semibold mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider mb-1 text-[#111827]/80">
                      EMAIL ADDRESS
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="jordan@example.com"
                        className="w-full pl-10 pr-4 h-11 rounded-xl bg-[#232936] text-white border border-black/10 focus:ring-2 focus:ring-coral/40 text-sm focus:outline-none transition-all placeholder-white/35 font-medium"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-coral-dark font-semibold mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider mb-1 text-[#111827]/80">
                        PASSWORD
                      </label>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="min 6 chars"
                        className="w-full px-3 h-11 rounded-xl bg-[#232936] text-white border border-black/10 focus:ring-2 focus:ring-coral/40 text-sm focus:outline-none transition-all placeholder-white/35 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider mb-1 text-[#111827]/80">
                        CONFIRM
                      </label>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="repeat"
                        className="w-full px-3 h-11 rounded-xl bg-[#232936] text-white border border-black/10 focus:ring-2 focus:ring-coral/40 text-sm focus:outline-none transition-all placeholder-white/35 font-medium"
                      />
                    </div>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-coral-dark font-semibold">{errors.password}</p>
                  )}
                  {errors.confirmPassword && (
                    <p className="text-xs text-coral-dark font-semibold">{errors.confirmPassword}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 rounded-xl bg-[#1A1F2C] hover:bg-black active:scale-[0.98] text-white font-mono font-black text-xs uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-1"
                  >
                    {loading ? 'ISSUING PASS...' : 'CLAIM YOUR QUEST PASS'}
                  </button>

                  <div className="text-center text-[11px] font-mono text-[#111827]/70 pt-1">
                    ALREADY HAVE A PASS?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        setAuthError('');
                        setErrors({});
                      }}
                      className="font-extrabold text-[#111827] underline hover:text-coral transition-colors"
                    >
                      SIGN IN
                    </button>
                  </div>
                </form>
              )}

              {/* Bottom Perforated Section (Tear-Off Stub) */}
              <div className="relative pt-4 mt-4 border-t-2 border-dashed border-[#DFD3B9] flex items-center justify-between">
                {/* Semicircular notches at the perforation line */}
                <div className="absolute -left-[30px] sm:-left-[35px] -top-2.5 w-5 h-5 rounded-full bg-cream dark:bg-navy-dark border border-[#DFD3B9] z-10" />
                <div className="absolute -right-[29px] sm:-right-[33px] -top-2.5 w-5 h-5 rounded-full bg-cream dark:bg-navy-dark border border-[#DFD3B9] z-10" />

                <div>
                  <span className="font-display font-black text-base tracking-tight text-[#111827] uppercase block leading-tight">
                    QUEST PASS
                  </span>
                  <span className="text-[9px] font-mono font-extrabold tracking-wider text-[#111827]/60 uppercase block">
                    STAMPED | ADVENTURE AWAITS
                  </span>
                  <span className="text-[9px] font-mono text-[#111827]/50 block font-semibold">
                    TICKET ID: WQ-V24
                  </span>
                </div>

                {/* Barcode Graphic & Emojis */}
                <div className="text-right">
                  <div className="flex items-center justify-end gap-[2px] h-6 text-[#111827]">
                    <div className="w-[2px] h-full bg-current" />
                    <div className="w-[1px] h-full bg-current" />
                    <div className="w-[3px] h-full bg-current" />
                    <div className="w-[1px] h-full bg-current" />
                    <div className="w-[4px] h-full bg-current" />
                    <div className="w-[2px] h-full bg-current" />
                    <div className="w-[1px] h-full bg-current" />
                    <div className="w-[3px] h-full bg-current" />
                    <div className="w-[2px] h-full bg-current" />
                    <div className="w-[4px] h-full bg-current" />
                    <div className="w-[1px] h-full bg-current" />
                    <div className="w-[2px] h-full bg-current" />
                  </div>
                  <div className="flex items-center justify-end gap-2 text-[9px] font-mono text-[#111827]/60 mt-0.5">
                    <span>9 781234 567890 &gt;</span>
                    <span className="tracking-widest">🧭 🗺️ 🤍</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Developer Sandbox Tool (Keeps ticket pristine) */}
      <div className="fixed bottom-3 right-3 z-30">
        {devToolsOpen ? (
          <div className="p-3 rounded-2xl bg-white dark:bg-navy-card border border-navy/10 dark:border-white/10 shadow-lifted space-y-2 text-xs slide-in-right max-w-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-[11px] text-navy dark:text-cream">🛠️ Test Sandbox</span>
              <button
                type="button"
                onClick={() => setDevToolsOpen(false)}
                className="text-navy/40 dark:text-cream/40 hover:text-navy text-xs"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={handleGenerateFreshEmail}
                className="p-1.5 rounded-lg bg-cream-2 dark:bg-navy text-[11px] font-mono font-bold text-navy dark:text-cream"
              >
                🎲 Fresh Email
              </button>
              <button
                type="button"
                onClick={handleClearCurrentAccount}
                className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/40 text-[11px] font-mono font-bold text-rose-700 dark:text-rose-300"
              >
                🗑️ Reset Email
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setDevToolsOpen(true)}
            className="px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[10px] font-mono text-navy/50 dark:text-cream/50 transition-colors"
          >
            🛠️ Dev Tools
          </button>
        )}
      </div>

      {/* Forgot Password Reset Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-navy/50 backdrop-blur-sm"
            onClick={() => setForgotOpen(false)}
          />
          <div className="relative bg-white dark:bg-navy-card w-full max-w-md rounded-2xl shadow-lifted p-6 border border-navy/10 dark:border-white/10 z-10 slide-in-right my-auto">
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

      {/* 6-Digit Email Verification / Login OTP Modal */}
      <EmailVerificationModal
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        email={verifyEmail}
        devCode={devCode}
        emailPreviewUrl={emailPreviewUrl}
        realSent={realSent}
        mode={verifyMode}
        onSuccess={(user) => {
          if (verifyMode === 'login') {
            onLogin(user);
          } else {
            onRegister(user);
          }
        }}
        onToast={onToast}
      />
    </div>
  );
}
