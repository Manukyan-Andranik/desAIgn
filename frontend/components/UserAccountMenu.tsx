"use client";

import React, { useState, useEffect } from "react";
import { User } from "@/types/scene";
import { User as UserIcon, ChevronDown, Check, LogOut, ShieldCheck, Sparkles, LogIn, Key, Wand2, CreditCard } from "lucide-react";

interface UserAccountMenuProps {
  users: User[];
  activeUser: User | null;
  onSelectUser: (user: User) => void;
  onLogOut: () => void;
  onOpenAuthModal: () => void;
  onOpenAccountPage?: () => void;
}

export default function UserAccountMenu({
  users,
  activeUser,
  onSelectUser,
  onLogOut,
  onOpenAuthModal,
  onOpenAccountPage
}: UserAccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !activeUser) {
    return (
      <button
        onClick={onOpenAuthModal}
        className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:from-[#6366F1] hover:to-[#4F46E5] text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all duration-200 shadow-md shadow-[#4F46E5]/20 active:scale-[0.97] shrink-0 border-0"
        title="Sign in or register"
      >
        <LogIn className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline whitespace-nowrap">Sign In / Register</span>
      </button>
    );
  }

  const trialProgress = (activeUser.edit_count || 0) % 10;
  const progressPercent = (trialProgress / 10) * 100;

  return (
    <div className="relative z-40 shrink-0 font-sans">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 sm:gap-2.5 bg-white hover:bg-slate-50 border border-[#E2E8F0] hover:border-[#4F46E5] px-2 sm:px-3.5 py-1.5 rounded-xl text-xs transition-all duration-200 shadow-sm group max-w-[9rem] sm:max-w-none"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {activeUser.avatar ? (
          <img src={activeUser.avatar} alt={activeUser.name} className="w-5 h-5 rounded-full object-cover border border-[#E2E8F0]" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-[#4F46E5]/10 text-[#4F46E5] border border-[#E2E8F0] flex items-center justify-center text-[10px] font-bold">
            <UserIcon className="w-3 h-3" />
          </div>
        )}
        <div className="text-left hidden md:block min-w-0">
          <div className="font-bold text-[#0F172A] group-hover:text-[#4F46E5] transition-colors leading-none truncate">{activeUser.name}</div>
          <div className="text-[10px] text-[#64748B] font-mono mt-0.5 flex items-center space-x-1">
            <span>{activeUser.credits ?? 1000} credits</span>
            <span>•</span>
            <span className="text-[#4F46E5]">{activeUser.edit_count || 0} edits</span>
          </div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-[#64748B] transition-transform duration-200 ${isOpen ? "rotate-180 text-[#4F46E5]" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl p-2.5 z-40 space-y-2.5 animate-scale-in select-none">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-[#E2E8F0] space-y-2.5">
              <div className="flex items-center space-x-3">
                {activeUser.avatar ? (
                  <img src={activeUser.avatar} alt={activeUser.name} className="w-9 h-9 rounded-full object-cover border border-[#E2E8F0] shadow-sm" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#4F46E5]/10 text-[#4F46E5] border border-[#E2E8F0] flex items-center justify-center font-bold text-sm">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <div className="truncate">
                  <div className="font-bold text-xs text-[#0F172A] truncate">{activeUser.name}</div>
                  <div className="text-[10px] text-[#64748B] font-mono truncate">{activeUser.email}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#4F46E5]/10 border border-[#E2E8F0] text-[10px] font-mono text-[#4F46E5] font-semibold">
                  <ShieldCheck className="w-3 h-3 text-[#4F46E5]" />
                  <span>{activeUser.plan || "Standard"} Plan</span>
                </div>
                <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-[#E2E8F0] text-[10px] font-mono text-[#4F46E5] font-bold">
                  <Sparkles className="w-3 h-3 text-[#0EA5E9]" />
                  <span>{activeUser.credits ?? 1000} credits</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center space-x-1 text-[#64748B]">
                    <Wand2 className="w-3 h-3 text-[#4F46E5]" />
                    <span>AI edits</span>
                  </div>
                  <span className="text-[#4F46E5] font-bold">{trialProgress}/10 until 25 credits used</span>
                </div>
                <div className="w-full h-1.5 bg-white rounded-full overflow-hidden border border-[#E2E8F0]">
                  <div
                    className="h-full bg-gradient-to-r from-[#4F46E5] to-[#0EA5E9] transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {users.length > 1 && (
              <div className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-mono text-[#64748B] uppercase tracking-wider font-semibold">
                  Switch account
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
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs transition-all duration-200 border-0 ${
                        isActive
                          ? "bg-[#4F46E5]/10 border border-[#E2E8F0] text-[#4F46E5] font-bold"
                          : "text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A] bg-transparent"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} className="w-4 h-4 rounded-full object-cover" />
                        ) : (
                          <UserIcon className="w-3.5 h-3.5 text-[#64748B]" />
                        )}
                        <span className="truncate text-xs font-medium">{u.name}</span>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-[#4F46E5] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="pt-1.5 border-t border-[#E2E8F0] space-y-1">
              {onOpenAccountPage && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenAccountPage();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs bg-[#4F46E5]/10 text-[#4F46E5] hover:opacity-90 flex items-center space-x-2 font-bold transition-all duration-200 border-0"
                >
                  <CreditCard className="w-3.5 h-3.5 text-[#4F46E5]" />
                  <span>Account</span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsOpen(false);
                  onLogOut();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center space-x-2 font-bold transition-all duration-200 border-0 bg-transparent"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
