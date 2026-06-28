"use client";

import React, { useState } from "react";
import { User } from "@/types/scene";
import { User as UserIcon, ChevronDown, Check, LogOut, ShieldCheck, Sparkles, UserPlus, LogIn, Key } from "lucide-react";

interface UserAccountMenuProps {
  users: User[];
  activeUser: User | null;
  onSelectUser: (user: User) => void;
  onLogOut: () => void;
  onOpenAuthModal: () => void;
}

export default function UserAccountMenu({
  users,
  activeUser,
  onSelectUser,
  onLogOut,
  onOpenAuthModal
}: UserAccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!activeUser) {
    return (
      <button
        onClick={onOpenAuthModal}
        className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-500/25 active:scale-95 shrink-0"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>Sign In / Register</span>
      </button>
    );
  }

  return (
    <div className="relative z-40 shrink-0 font-sans">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2.5 bg-slate-950/90 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/60 px-3 py-1.5 rounded-xl text-xs transition-all shadow-sm group"
      >
        {activeUser.avatar ? (
          <img src={activeUser.avatar} alt={activeUser.name} className="w-5 h-5 rounded-full object-cover border border-cyan-500/40" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center text-[10px] font-bold border border-cyan-800">
            <UserIcon className="w-3 h-3" />
          </div>
        )}
        <div className="text-left hidden sm:block">
          <div className="font-bold text-slate-200 group-hover:text-cyan-300 transition-colors leading-none">{activeUser.name}</div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? "rotate-180 text-cyan-400" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-64 bg-[#0c0e14] border border-slate-800 rounded-3xl shadow-2xl p-2 z-40 space-y-2 animate-fade-in select-none">
            
            {/* Account Info Header */}
            <div className="p-3 bg-slate-950/90 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex items-center space-x-3">
                {activeUser.avatar ? (
                  <img src={activeUser.avatar} alt={activeUser.name} className="w-9 h-9 rounded-full object-cover border border-cyan-500/40 shadow-sm" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold text-sm border border-cyan-800">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <div className="truncate">
                  <div className="font-bold text-xs text-slate-100 truncate">{activeUser.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{activeUser.email}</div>
                </div>
              </div>
              <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-800/60 text-[10px] font-mono text-cyan-300 font-semibold">
                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                <span>Pro Architectural Studio</span>
              </div>
            </div>

            {/* Quick Team User Switcher */}
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                Switch Studio Account
              </div>
              {users.map((u) => {
                const isActive = activeUser.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSelectUser(u);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl flex items-center justify-between text-xs transition-all ${
                      isActive
                        ? "bg-cyan-950/60 text-cyan-200 font-bold border border-cyan-800/60"
                        : "text-slate-300 hover:bg-slate-900 hover:text-slate-100"
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name} className="w-4 h-4 rounded-full object-cover" />
                      ) : (
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span className="truncate text-xs font-medium">{u.name}</span>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Account Action Buttons */}
            <div className="pt-1 border-t border-slate-800/80 space-y-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenAuthModal();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-900 hover:text-slate-100 flex items-center space-x-2 font-medium transition-all"
              >
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span>Account Credentials & Register</span>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  onLogOut();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-950/60 flex items-center space-x-2 font-bold transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
