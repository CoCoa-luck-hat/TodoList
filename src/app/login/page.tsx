"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from "lucide-react";

// Translations
const loginTranslations = {
  en: {
    welcome: "Welcome Back",
    welcomeSub: "Sign in to your workspace",
    createAccount: "Create Account",
    createSub: "Start your productivity journey",
    loginTab: "Sign In",
    registerTab: "Sign Up",
    name: "Full Name",
    email: "Email Address",
    password: "Password",
    confirmPassword: "Confirm Password",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password?",
    signIn: "Sign In",
    signUp: "Create Account",
    orContinueWith: "or continue with",
    google: "Google",
    github: "GitHub",
    alreadyHave: "Already have an account?",
    dontHave: "Don't have an account?",
    passwordWeak: "Weak",
    passwordMedium: "Medium",
    passwordStrong: "Strong",
    passwordVeryStrong: "Very Strong",
    errorInvalidCredentials: "Invalid email or password",
    errorEmailExists: "An account with this email already exists",
    errorGeneric: "Something went wrong. Please try again.",
    errorPasswordMismatch: "Passwords do not match",
    errorPasswordShort: "Password must be at least 6 characters",
    successRegister: "Account created! Signing in...",
  },
  th: {
    welcome: "ยินดีต้อนรับ",
    welcomeSub: "ลงชื่อเข้าใช้งาน",
    createAccount: "สร้างบัญชีใหม่",
    createSub: "เริ่มต้นเส้นทางแห่งประสิทธิภาพ",
    loginTab: "เข้าสู่ระบบ",
    registerTab: "สมัครสมาชิก",
    name: "ชื่อ-นามสกุล",
    email: "อีเมล",
    password: "รหัสผ่าน",
    confirmPassword: "ยืนยันรหัสผ่าน",
    rememberMe: "จดจำฉัน",
    forgotPassword: "ลืมรหัสผ่าน?",
    signIn: "เข้าสู่ระบบ",
    signUp: "สร้างบัญชี",
    orContinueWith: "หรือเข้าสู่ระบบด้วย",
    google: "Google",
    github: "GitHub",
    alreadyHave: "มีบัญชีอยู่แล้ว?",
    dontHave: "ยังไม่มีบัญชี?",
    passwordWeak: "อ่อน",
    passwordMedium: "ปานกลาง",
    passwordStrong: "แข็งแรง",
    passwordVeryStrong: "แข็งแรงมาก",
    errorInvalidCredentials: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    errorEmailExists: "มีบัญชีที่ใช้อีเมลนี้อยู่แล้ว",
    errorGeneric: "เกิดข้อผิดพลาด โปรดลองอีกครั้ง",
    errorPasswordMismatch: "รหัสผ่านไม่ตรงกัน",
    errorPasswordShort: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
    successRegister: "สร้างบัญชีสำเร็จ! กำลังเข้าสู่ระบบ...",
  },
};

function getPasswordStrength(password: string): number {
  let strength = 0;
  if (password.length >= 6) strength++;
  if (password.length >= 10) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return Math.min(strength, 4);
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const { language, setLanguage } = useLanguage();
  const langKey = language.toLowerCase() as "en" | "th";
  const t = loginTranslations[langKey] || loginTranslations.en;

  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [shake, setShake] = useState(false);

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthLabels = [
    "",
    t.passwordWeak,
    t.passwordMedium,
    t.passwordStrong,
    t.passwordVeryStrong,
  ];
  const strengthColors = [
    "transparent",
    "#ef4444",
    "#f59e0b",
    "#10b981",
    "#6366f1",
  ];

  useEffect(() => {
    setError("");
    setSuccess("");
  }, [isRegister]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      if (isRegister) {
        // Validation
        if (formData.password.length < 6) {
          setError(t.errorPasswordShort);
          triggerShake();
          setIsLoading(false);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError(t.errorPasswordMismatch);
          triggerShake();
          setIsLoading(false);
          return;
        }

        // Register
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 409) {
            setError(t.errorEmailExists);
          } else {
            setError(data.error || t.errorGeneric);
          }
          triggerShake();
          setIsLoading(false);
          return;
        }

        setSuccess(t.successRegister);

        // Auto sign-in after register
        const signInResult = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (signInResult?.ok) {
          router.push(callbackUrl);
        }
      } else {
        // Login
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          setError(t.errorInvalidCredentials);
          triggerShake();
          setIsLoading(false);
          return;
        }

        if (result?.ok) {
          router.push(callbackUrl);
        }
      }
    } catch {
      setError(t.errorGeneric);
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = (provider: string) => {
    signIn(provider, { callbackUrl });
  };

  return (
    <div className="auth-page">
      {/* Language Toggle */}
      <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 50 }}>
        <div style={{ 
          display: 'flex', 
          backgroundColor: 'var(--bg-card)', 
          borderRadius: '24px', 
          padding: '4px',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-color)',
        }}>
          <button
            type="button"
            onClick={() => setLanguage("EN")}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: language === "EN" ? 'var(--primary)' : 'transparent',
              color: language === "EN" ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLanguage("TH")}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: language === "TH" ? 'var(--primary)' : 'transparent',
              color: language === "TH" ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
          >
            TH
          </button>
        </div>
      </div>

      {/* Animated background */}
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
        <div className="auth-mesh" />
      </div>

      {/* Main card */}
      <div className={`auth-card ${shake ? "auth-shake" : ""}`}>
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Sparkles size={28} />
          </div>
          <h1 className="auth-logo-text">TodoList</h1>
        </div>

        {/* Header */}
        <div className="auth-header">
          <h2 className="auth-title">
            {isRegister ? t.createAccount : t.welcome}
          </h2>
          <p className="auth-subtitle">
            {isRegister ? t.createSub : t.welcomeSub}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${!isRegister ? "auth-tab-active" : ""}`}
            onClick={() => setIsRegister(false)}
            type="button"
          >
            {t.loginTab}
          </button>
          <button
            className={`auth-tab ${isRegister ? "auth-tab-active" : ""}`}
            onClick={() => setIsRegister(true)}
            type="button"
          >
            {t.registerTab}
          </button>
          <div
            className="auth-tab-indicator"
            style={{ transform: `translateX(${isRegister ? "100%" : "0%"})` }}
          />
        </div>

        {/* OAuth Buttons */}
        <div className="auth-oauth-row">
          <button
            className="auth-oauth-btn auth-oauth-google"
            onClick={() => handleOAuth("google")}
            type="button"
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>{t.google}</span>
          </button>
          <button
            className="auth-oauth-btn auth-oauth-github"
            onClick={() => handleOAuth("github")}
            type="button"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span>{t.github}</span>
          </button>
        </div>

        {/* Divider */}
        <div className="auth-divider">
          <span>{t.orContinueWith}</span>
        </div>

        {/* Error / Success Messages */}
        {error && (
          <div className="auth-message auth-message-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="auth-message auth-message-success">
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {/* Name (Register only) */}
          {isRegister && (
            <div className="auth-field">
              <div className="auth-field-icon">
                <User size={18} />
              </div>
              <input
                id="auth-name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder={t.name}
                required={isRegister}
                className="auth-input"
                autoComplete="name"
              />
            </div>
          )}

          {/* Email */}
          <div className="auth-field">
            <div className="auth-field-icon">
              <Mail size={18} />
            </div>
            <input
              id="auth-email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder={t.email}
              required
              className="auth-input"
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="auth-field">
            <div className="auth-field-icon">
              <Lock size={18} />
            </div>
            <input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder={t.password}
              required
              className="auth-input"
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
            <button
              type="button"
              className="auth-field-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Password Strength (Register only) */}
          {isRegister && formData.password.length > 0 && (
            <div className="auth-password-strength">
              <div className="auth-strength-bar">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className="auth-strength-segment"
                    style={{
                      backgroundColor:
                        passwordStrength >= level
                          ? strengthColors[passwordStrength]
                          : "var(--bg-input)",
                    }}
                  />
                ))}
              </div>
              <span
                className="auth-strength-label"
                style={{ color: strengthColors[passwordStrength] }}
              >
                {strengthLabels[passwordStrength]}
              </span>
            </div>
          )}

          {/* Confirm Password (Register only) */}
          {isRegister && (
            <div className="auth-field">
              <div className="auth-field-icon">
                <Lock size={18} />
              </div>
              <input
                id="auth-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                placeholder={t.confirmPassword}
                required={isRegister}
                className="auth-input"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-field-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 size={20} className="auth-spinner" />
            ) : isRegister ? (
              t.signUp
            ) : (
              t.signIn
            )}
          </button>
        </form>

        {/* Switch mode */}
        <p className="auth-switch">
          {isRegister ? t.alreadyHave : t.dontHave}{" "}
          <button
            type="button"
            className="auth-switch-btn"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? t.loginTab : t.registerTab}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="auth-page"><div style={{ margin: "auto" }}>Loading...</div></div>}>
      <LoginContent />
    </Suspense>
  );
}
