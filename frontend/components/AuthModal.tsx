"use client";

import React, { useState } from "react";
import { User } from "@/types/scene";
import { Sparkles, Lock, Mail, User as UserIcon, LogIn, UserPlus, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";

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

    setLoading(true);
    try {
      const endpoint = mode === "login" ? "http://localhost:8000/api/v1/auth/login" : "http://localhost:8000/api/v1/auth/register";
      const payload = mode === "login" ? { email, password } : { name, email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const user: User = await res.json();
        onSuccess(user);
        onClose();
      } else {
        const data = await res.json();
        setError(data.detail || "Authentication failed.");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("Unable to connect to authentication server.");
    } finally {
      setLoading(false);
    }
  };

  const quickDemoLogin = async (demoEmail: string) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: demoEmail, password: "demo" })
      });
      if (res.ok) {
        const user: User = await res.json();
        onSuccess(user);
        onClose();
      }
    } catch (err) {
      console.error("Quick demo login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in font-sans select-none">
      <div className="w-full max-w-md bg-[#0c0e14] border border-cyan-500/50 rounded-3xl p-7 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Background Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/20 blur-3xl pointer-events-none rounded-full" />
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-cyan-500/30">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">
            {mode === "login" ? "Welcome Back to Antigravity" : "Create Studio Account"}
          </h2>
          <p className="text-xs text-slate-400 font-sans">
            {mode === "login" ? "Sign in to access your architectural render projects." : "Register to start building AI spatial scene graphs."}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 font-mono text-xs">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center space-x-2 font-bold ${
              mode === "login" ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center space-x-2 font-bold ${
              mode === "register" ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
          {mode === "register" && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Full Name</label>
              <div className="relative flex items-center">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@architects.io"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 mt-2 active:scale-95"
          >
            <span>{loading ? "Authenticating..." : mode === "login" ? "Sign In to Workspace" : "Create Account"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider text-center font-semibold">
            One-Click Studio Demo Logins
          </div>
          <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
            <button
              onClick={() => quickDemoLogin("alex@architects.io")}
              className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/60 rounded-xl text-cyan-300 transition-all text-center truncate"
            >
              Alex (Studio)
            </button>
            <button
              onClick={() => quickDemoLogin("sarah@designstudio.com")}
              className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/60 rounded-xl text-cyan-300 transition-all text-center truncate"
            >
              Sarah (Nordic)
            </button>
            <button
              onClick={() => quickDemoLogin("pro@antigravity.os")}
              className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/60 rounded-xl text-cyan-300 transition-all text-center truncate"
            >
              Studio Pro
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 p-1.5 rounded-lg transition-colors"
        >
          ✕
        </button>

      </div>
    </div>
  );
}
