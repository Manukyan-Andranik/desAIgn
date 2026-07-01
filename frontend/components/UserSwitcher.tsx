"use client";

import React, { useState } from "react";
import { User } from "@/types/scene";
import { User as UserIcon, ChevronDown, Check, Sparkles } from "lucide-react";

interface UserSwitcherProps {
  users: User[];
  activeUser: User | null;
  onSelectUser: (user: User) => void;
}

export default function UserSwitcher({ users, activeUser, onSelectUser }: UserSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!activeUser) return null;

  return (
    <div className="relative z-40">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-elevated/90 hover:bg-panel border border-border hover:border-cyan-500/60 px-3 py-1.5 rounded-xl text-xs font-mono transition-all shadow-sm group"
      >
        {activeUser.avatar ? (
          <img src={activeUser.avatar} alt={activeUser.name} className="w-6 h-6 rounded-lg object-cover border-2 border-cyan-500 ring-2 ring-cyan-500/15 shadow-sm" />
        ) : (
          <div className="w-6 h-6 rounded-lg icon-badge-cyan border-2 border-cyan-500 ring-2 ring-cyan-500/15 flex items-center justify-center text-[10px] font-bold shadow-sm">
            <UserIcon className="w-3.5 h-3.5" />
          </div>
        )}
        <span className="font-bold text-foreground group-hover:text-cyan-300 transition-colors">{activeUser.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isOpen ? "rotate-180 text-cyan-400" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-56 bg-surface border border-border rounded-2xl shadow-2xl p-1.5 z-40 space-y-1 animate-fade-in font-sans">
            <div className="px-3 py-1.5 text-[10px] font-mono text-subtle uppercase tracking-wider font-semibold border-b border-border/60">
              Select Workspace User
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
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs transition-all ${
                    isActive
                      ? "chip-cyan font-bold"
                      : "text-muted-foreground hover:bg-panel hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} className="w-5 h-5 rounded-md object-cover border border-border" />
                    ) : (
                      <div className="w-5 h-5 rounded-md bg-panel border border-border flex items-center justify-center">
                        <UserIcon className="w-3 h-3 text-muted-foreground" />
                      </div>
                    )}
                    <div className="truncate">
                      <div className="font-semibold text-xs leading-none">{u.name}</div>
                      <div className="text-[10px] text-subtle font-mono mt-0.5 truncate">{u.email}</div>
                    </div>
                  </div>
                  {isActive && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
