"use client";

import React, { useState } from "react";
import { User } from "@/types/scene";
import { Sparkles, Lock, Mail, User as UserIcon, LogIn, UserPlus, ArrowRight, X, Eye, EyeOff } from "lucide-react";
import { API_BASE, parseApiError } from "@/lib/api";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (mode === "register" && !name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (mode === "register" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === "login" ? `${API_BASE}/api/v1/auth/login` : `${API_BASE}/api/v1/auth/register`;
      const payload = mode === "login" ? { email: email.trim(), password } : { name: name.trim(), email: email.trim(), password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const user: User = await res.json();
        setName("");
        setEmail("");
        setPassword("");
        onSuccess(user);
        onClose();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(parseApiError(data, "Sign in failed. Try again."));
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("Can't reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/30 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in font-sans select-none" onClick={onClose}>
      <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-lg space-y-6 relative overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>

        {/* Background Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#4F46E5]/5 blur-3xl pointer-events-none rounded-full" />

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#4F46E5] mx-auto shadow-sm">
            <Sparkles className="w-6 h-6 text-[#0EA5E9]" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-xs text-[#64748B]">
            {mode === "login" ? "Sign in to open your projects." : "Create an account to start designing with AI."}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-50 p-1 rounded-xl border border-[#E2E8F0] font-mono text-xs shadow-inner">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center space-x-2 font-bold ${
              mode === "login" ? "bg-[#4F46E5] text-white border border-[#E2E8F0] shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center space-x-2 font-bold ${
              mode === "register" ? "bg-[#4F46E5] text-white border border-[#E2E8F0] shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-[#0F172A] uppercase tracking-wider font-bold">Full Name</label>
              <div className="relative flex items-center">
                <UserIcon className="w-4 h-4 text-[#64748B] absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full bg-white border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#0F172A] placeholder-[#64748B]/50 focus:outline-none transition-all duration-200"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-[#0F172A] uppercase tracking-wider font-bold">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-[#64748B] absolute left-3.5 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@architects.io"
                className="w-full bg-white border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#0F172A] placeholder-[#64748B]/50 focus:outline-none transition-all duration-200"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-[#0F172A] uppercase tracking-wider font-bold">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#0F172A] placeholder-[#64748B]/50 focus:outline-none transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-[#64748B] hover:text-[#0F172A] transition-colors p-0.5"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#4F46E5] hover:bg-[#6366F1] text-white border-0 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all duration-200 disabled:opacity-50 mt-2 active:scale-[0.97] shadow-lg shadow-[#4F46E5]/20"
          >
            <span>{loading ? "Signing in..." : mode === "login" ? "Log in" : "Create account"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer text link */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-xs text-[#64748B] hover:text-[#4F46E5] hover:underline"
          >
            {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 border border-transparent hover:border-[#E2E8F0] p-1.5 rounded-lg transition-all duration-200"
          aria-label="Close authentication modal"
        >
          <X className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
}
