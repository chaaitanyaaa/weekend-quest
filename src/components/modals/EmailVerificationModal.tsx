import React, { useState, useRef, useEffect } from 'react';
import { Member } from '../../types';
import { Modal } from './Modal';
import { verifyEmailCode, resendVerificationCode, sendLoginOtp, verifyLoginOtp } from '../../utils/auth';
import { ShieldCheck, Mail, ArrowRight, RotateCw, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface EmailVerificationModalProps {
  open: boolean;
  onClose: () => void;
  email: string;
  devCode?: string;
  emailPreviewUrl?: string | null;
  realSent?: boolean;
  mode?: 'register' | 'login';
  onSuccess: (user: Member) => void;
  onToast: (msg: string) => void;
}

export function EmailVerificationModal({
  open,
  onClose,
  email,
  devCode: initialDevCode,
  emailPreviewUrl: initialPreviewUrl,
  realSent,
  mode = 'register',
  onSuccess,
  onToast,
}: EmailVerificationModalProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [devCode, setDevCode] = useState(initialDevCode || '');
  const [previewUrl, setPreviewUrl] = useState(initialPreviewUrl || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (initialDevCode) {
      setDevCode(initialDevCode);
    }
  }, [initialDevCode]);

  useEffect(() => {
    if (initialPreviewUrl !== undefined) {
      setPreviewUrl(initialPreviewUrl);
    }
  }, [initialPreviewUrl]);

  useEffect(() => {
    if (!open) {
      setDigits(['', '', '', '', '', '']);
      setError(null);
      return;
    }

    // Auto-focus the first digit input
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 150);

    return () => clearTimeout(timer);
  }, [open]);

  // Resend cooldown timer
  useEffect(() => {
    if (!open || resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [open, resendCooldown]);

  const handleDigitChange = (index: number, val: string) => {
    setError(null);
    const cleaned = val.replace(/\D/g, '');

    // Handle paste of full 6 digits
    if (cleaned.length >= 6) {
      const newDigits = cleaned.slice(0, 6).split('');
      setDigits(newDigits);
      inputRefs.current[5]?.focus();
      handleVerify(newDigits.join(''));
      return;
    }

    const nextChar = cleaned.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = nextChar;
    setDigits(newDigits);

    // Auto-advance
    if (nextChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all 6 digits entered, auto-verify
    if (nextChar && index === 5 && newDigits.every((d) => d !== '')) {
      handleVerify(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!pasted) return;

    const newDigits = pasted.slice(0, 6).split('');
    while (newDigits.length < 6) newDigits.push('');
    setDigits(newDigits);

    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();

    if (pasted.length >= 6) {
      handleVerify(pasted.slice(0, 6));
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || digits.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = mode === 'login'
      ? await verifyLoginOtp(email, code)
      : await verifyEmailCode(email, code);

    if (!res.success || !res.user) {
      setError(res.error || 'Verification failed. Please check your code.');
      setLoading(false);
      return;
    }

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
    });

    setLoading(false);
    onClose();
    onSuccess(res.user);
    onToast(mode === 'login' ? `Welcome back, ${res.user.name}!` : `Email verified! Welcome, ${res.user.name}!`);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError(null);

    const res = mode === 'login'
      ? await sendLoginOtp(email)
      : await resendVerificationCode(email);
    setLoading(false);

    if (res.success) {
      if (res.devCode) setDevCode(res.devCode);
      if (res.emailPreviewUrl) setPreviewUrl(res.emailPreviewUrl);
      setResendCooldown(45);
      onToast(`A fresh verification code was sent to ${email}`);
    } else {
      setError(res.error || 'Failed to resend code');
    }
  };

  const handleAutofill = () => {
    if (!devCode) return;
    const newDigits = devCode.split('');
    setDigits(newDigits);
    handleVerify(devCode);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'login' ? 'Sign In with OTP' : 'Verify your email'}
      subtitle={
        mode === 'login'
          ? `Enter the 6-digit login code sent to ${email}`
          : `Enter the 6-digit code sent to ${email}`
      }
    >
      <div className="space-y-6">
        {/* Email badge */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-cream-2 dark:bg-navy border border-navy/10 dark:border-white/10">
          <div className="w-10 h-10 rounded-xl bg-coral/10 text-coral grid place-items-center shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-navy/50 dark:text-cream/50 uppercase font-bold tracking-wider">
              Sent code to
            </p>
            <p className="text-sm font-bold truncate dark:text-cream">{email}</p>
          </div>
          <span className="text-[11px] font-bold text-lime-dark bg-lime/30 dark:bg-lime-900/40 px-2.5 py-0.5 rounded-full shrink-0 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> {realSent ? 'Sent via SMTP' : 'Instant Verified'}
          </span>
        </div>

        {/* Ethereal test inbox link if applicable */}
        {previewUrl && (
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between gap-2">
            <span>📬 Delivered to test mailer inbox</span>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline text-blue-600 dark:text-blue-400 shrink-0"
            >
              Open Email →
            </a>
          </div>
        )}

        {/* 6 Digit Input Boxes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-navy/60 dark:text-cream/60 mb-2.5 text-center">
            6-Digit Security Code
          </label>
          <div className="flex justify-center gap-1.5 sm:gap-3">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                className={`w-10 h-13 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-display font-extrabold rounded-xl sm:rounded-2xl border transition-all ${
                  digit
                    ? 'border-coral bg-coral/5 text-coral dark:bg-coral/10 dark:text-coral-light shadow-sm'
                    : 'border-navy/15 dark:border-white/15 bg-white dark:bg-navy text-navy dark:text-cream'
                } focus:border-coral focus:ring-2 focus:ring-coral/20 focus:outline-none`}
              />
            ))}
          </div>
          {error && (
            <p className="text-xs font-bold text-rose-500 text-center mt-3 animate-shake">
              {error}
            </p>
          )}
        </div>

        {/* Dev Mailer / Test Helper Preview Card */}
        {devCode && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Security Code: <strong className="text-base tracking-widest">{devCode}</strong>
              </span>
              <button
                type="button"
                onClick={handleAutofill}
                className="px-2.5 py-1 rounded-lg bg-amber-200 dark:bg-amber-900/60 hover:bg-amber-300 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-100 font-bold text-[11px] transition-colors"
              >
                Autofill
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            disabled={loading || digits.join('').length < 6}
            onClick={() => handleVerify()}
            className="w-full h-12 rounded-xl bg-coral text-cream font-bold text-sm shadow-coral hover:bg-coral-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" /> Verifying Code...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />{' '}
                {mode === 'login' ? 'Verify & Sign In' : 'Verify & Activate Account'}
              </>
            )}
          </button>

          <div className="flex items-center justify-between text-xs pt-1 px-1">
            <button
              type="button"
              onClick={onClose}
              className="text-navy/60 dark:text-cream/60 hover:text-navy dark:hover:text-cream font-semibold transition-colors"
            >
              Change Email / Back
            </button>

            <button
              type="button"
              disabled={resendCooldown > 0 || loading}
              onClick={handleResend}
              className="font-bold text-coral hover:underline disabled:opacity-50 disabled:no-underline transition-opacity"
            >
              {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
