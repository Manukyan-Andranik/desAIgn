"use client";

import React, { useState, useEffect, useRef } from "react";
import { User, Project } from "@/types/scene";
import {
  User as UserIcon, Sparkles, Crown, Shield, Zap, Wand2,
  CreditCard, Layers, ArrowRight, CheckCircle2, AlertCircle, Key, LogOut,
  Bell, FileText, Camera
} from "lucide-react";
import { API_BASE, parseApiError, fetchUserById } from "@/lib/api";

interface AccountPageProps {
  activeUser: User | null;
  projects: Project[];
  onUpdateUser: (updatedUser: User) => void;
  onOpenAuthModal: () => void;
  onLogOut: () => void;
  onNavigateToPricing: () => void;
}

export default function AccountPage({
  activeUser,
  projects,
  onUpdateUser,
  onOpenAuthModal,
  onLogOut,
  onNavigateToPricing
}: AccountPageProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "billing" | "security" | "notifications">("profile");
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Editable Profile State
  const [profileName, setProfileName] = useState(activeUser?.name || "");
  const [profileEmail, setProfileEmail] = useState(activeUser?.email || "");
  const [profileAvatar, setProfileAvatar] = useState(activeUser?.avatar || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Security State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [toggled2FA, setToggled2FA] = useState(false);

  useEffect(() => {
    if (activeUser) {
      setProfileName(activeUser.name);
      setProfileEmail(activeUser.email);
      setProfileAvatar(activeUser.avatar || "");
    }
  }, [activeUser]);

  useEffect(() => {
    if (!activeUser) return;
    let cancelled = false;
    fetchUserById(activeUser.id).then((fresh) => {
      if (fresh && !cancelled) onUpdateUser(fresh);
    });
    return () => {
      cancelled = true;
    };
  }, [activeUser?.id]);

  // Notifications State
  const [notifyGeneration, setNotifyGeneration] = useState(true);
  const [notifyBilling, setNotifyBilling] = useState(true);
  const [notifyNewsletter, setNotifyNewsletter] = useState(false);

  if (!activeUser) {
    return (
      <div className="flex-1 overflow-y-auto bg-[#FAFAF9] text-[#0F172A] p-6 sm:p-10 flex flex-col items-center justify-center select-none font-sans relative">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#4F46E5]/5 blur-[140px] pointer-events-none rounded-full" />
        <div className="max-w-md w-full text-center space-y-6 z-10 bg-white border border-[#E2E8F0] p-8 rounded-2xl shadow-sm animate-scale-in">
          <div className="w-16 h-16 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center mx-auto text-[#4F46E5] shadow-sm">
            <UserIcon className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-[#0F172A] font-sans tracking-tight">Sign in to view your account</h2>
            <p className="text-xs text-[#64748B] leading-relaxed font-sans">
              Sign in to see your profile, plan, credits, and billing.
            </p>
          </div>
          <button
            onClick={onOpenAuthModal}
            className="w-full py-3.5 bg-[#4F46E5] hover:bg-[#6366F1] text-white border-0 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all active:scale-[0.97] shadow-lg shadow-[#4F46E5]/20"
          >
            <span>Sign In / Register Account</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const currentPlan = activeUser.plan || "Standard";
  const editCount = activeUser.edit_count || 0;
  const trialProgress = editCount % 10;
  const progressPercent = (trialProgress / 10) * 100;
  const totalProjects = projects.length;
  const totalObjects = projects.reduce((acc, p) => acc + (p.object_count || 0), 0);

  const profileHasChanges =
    profileName !== activeUser.name ||
    profileEmail !== activeUser.email ||
    profileAvatar !== (activeUser.avatar || "");

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Profile image must be under 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfileAvatar(reader.result as string);
      setSuccessMsg("");
      setErrorMsg("");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");
    setSavingProfile(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/users/${activeUser.id}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName,
          email: profileEmail,
          avatar: profileAvatar || null
        })
      });
      if (res.ok) {
        const updated: User = await res.json();
        onUpdateUser(updated);
        setProfileAvatar(updated.avatar || "");
        setSuccessMsg("Profile saved.");
      } else {
        const data = await res.json();
        setErrorMsg(parseApiError(data, "Failed to update profile."));
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Connection to server failed.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorMsg("Please fill in all password fields.");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/users/${activeUser.id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: oldPassword,
          new_password: newPassword
        })
      });
      if (res.ok) {
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSuccessMsg("Password updated successfully.");
      } else {
        const data = await res.json();
        setErrorMsg(parseApiError(data, "Failed to update password."));
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Connection to server failed.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleUpgrade = async (targetPlan: string) => {
    setUpgrading(targetPlan);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/v1/users/${activeUser.id}/upgrade-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: targetPlan })
      });

      if (res.ok) {
        const updated: User = await res.json();
        onUpdateUser(updated);
        setSuccessMsg(`You're now on ${targetPlan}. Credits updated.`);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(parseApiError(data, "Failed to upgrade plan."));
      }
    } catch (err) {
      console.error("Upgrade error:", err);
      setErrorMsg("Unable to connect to billing server.");
    } finally {
      setUpgrading(null);
    }
  };

  const planTiers = [
    {
      name: "Standard",
      price: "$0",
      period: "Forever Free",
      credits: "1,000 credits",
      icon: Sparkles
    },
    {
      name: "Pro Studio",
      price: "$49",
      period: "/month",
      credits: "10,000 monthly credits",
      icon: Crown
    },
    {
      name: "Enterprise",
      price: "$199",
      period: "/month",
      credits: "50,000 monthly credits",
      icon: Shield
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAFAF9] text-[#0F172A] p-6 sm:p-10 select-none font-sans relative">

      {/* Ambient background blur */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#4F46E5]/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="w-full max-w-5xl mx-auto space-y-8 z-10 relative">

        {/* Profile header banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#E2E8F0] animate-slide-up">
          <div className="flex items-center space-x-4">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarSelect}
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="w-20 h-20 rounded-2xl border-2 border-[#4F46E5] bg-white relative overflow-hidden flex items-center justify-center group shrink-0 shadow-md ring-4 ring-[#4F46E5]/10"
              title="Change profile photo"
            >
              {profileAvatar ? (
                <img src={profileAvatar} alt={activeUser.name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-10 h-10 text-[#64748B]" />
              )}
              <div className="absolute inset-0 bg-white/85 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-[#E2E8F0]">
                <Camera className="w-4 h-4 text-[#4F46E5]" />
              </div>
            </button>
            <div className="space-y-1.5">
              <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">{activeUser.name}</h1>
                <span className="px-3 py-1 rounded-full bg-white border border-[#E2E8F0] text-[#4F46E5] text-[10px] font-mono font-bold uppercase tracking-wider shadow-sm">
                  {currentPlan} Plan
                </span>
              </div>
              <p className="text-xs text-[#64748B] font-mono">{activeUser.email} • ID: {activeUser.id}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-[#E2E8F0]">
            <button
              onClick={onLogOut}
              className="flex-1 md:flex-none px-5 py-2.5 bg-transparent hover:bg-slate-50 border border-red-500 text-red-600 rounded-xl text-xs uppercase tracking-wider font-bold flex items-center justify-center space-x-2 transition-all duration-200 active:scale-[0.97]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Feedback Notifications */}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center space-x-2 animate-slide-up">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center space-x-2 animate-slide-up">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Setting Shell layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left vertical settings nav (Sidebar) */}
          <div className="lg:col-span-3 bg-white border border-[#E2E8F0] rounded-2xl p-4 space-y-1.5 shadow-sm">
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-3 transition-all border ${
                activeTab === "profile"
                  ? "bg-[#4F46E5] text-white border-[#E2E8F0] shadow-md shadow-[#4F46E5]/15"
                  : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 border-transparent"
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Profile Settings</span>
            </button>

            <button
              onClick={() => setActiveTab("billing")}
              className={`w-full px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-3 transition-all border ${
                activeTab === "billing"
                  ? "bg-[#4F46E5] text-white border-[#E2E8F0] shadow-md shadow-[#4F46E5]/15"
                  : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 border-transparent"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Billing & Plan</span>
            </button>

            <button
              onClick={() => setActiveTab("security")}
              className={`w-full px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-3 transition-all border ${
                activeTab === "security"
                  ? "bg-[#4F46E5] text-white border-[#E2E8F0] shadow-md shadow-[#4F46E5]/15"
                  : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 border-transparent"
              }`}
            >
              <Key className="w-4 h-4" />
              <span>Security</span>
            </button>

            <button
              onClick={() => setActiveTab("notifications")}
              className={`w-full px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-3 transition-all border ${
                activeTab === "notifications"
                  ? "bg-[#4F46E5] text-white border-[#E2E8F0] shadow-md shadow-[#4F46E5]/15"
                  : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 border-transparent"
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </button>
          </div>

          {/* Right Panels switcher */}
          <div className="lg:col-span-9 space-y-8">

            {activeTab === "profile" && (
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm animate-fade-in">
                <h2 className="text-lg font-bold text-[#0F172A] font-sans border-b border-[#E2E8F0] pb-3 uppercase tracking-wide">
                  Profile Information
                </h2>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-slate-50 border border-[#E2E8F0] rounded-xl">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="w-16 h-16 rounded-xl border-2 border-[#4F46E5] bg-white overflow-hidden flex items-center justify-center shrink-0 ring-4 ring-[#4F46E5]/10 shadow-sm"
                    >
                      {profileAvatar ? (
                        <img src={profileAvatar} alt="Profile preview" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-8 h-8 text-[#64748B]" />
                      )}
                    </button>
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-[#0F172A]">Profile photo</p>
                      <p className="text-[10px] text-[#64748B]">JPG, PNG, or WebP. Max 5 MB.</p>
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-[#E2E8F0] rounded-lg text-[#4F46E5] hover:bg-white transition-all"
                      >
                        Upload photo
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-[#0F172A] uppercase tracking-wider font-bold">Full Name</label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full bg-white border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl px-4 py-2.5 text-sm text-[#0F172A] placeholder-[#64748B]/50 focus:outline-none transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-[#0F172A] uppercase tracking-wider font-bold">Email Address</label>
                      <input
                        type="email"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="w-full bg-white border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl px-4 py-2.5 text-sm text-[#0F172A] placeholder-[#64748B]/50 focus:outline-none transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingProfile || !profileHasChanges}
                      className="px-6 py-3 bg-[#4F46E5] hover:bg-[#6366F1] text-white border-0 font-bold rounded-xl text-xs uppercase tracking-wider transition-all duration-200 disabled:opacity-40 disabled:cursor-default active:scale-95 shadow-lg shadow-[#4F46E5]/20"
                    >
                      {savingProfile ? "Saving Changes..." : "Save Profile Details"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "billing" && (
              <div className="space-y-8 animate-fade-in">

                {/* Current plan card */}
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-sm">
                  <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-48 h-48 bg-[#4F46E5]/5 blur-3xl pointer-events-none rounded-full" />
                  <div className="space-y-2 relative z-10">
                    <div className="text-[10px] font-mono text-[#64748B] uppercase tracking-widest font-bold">Current Subscription</div>
                    <h3 className="text-xl font-bold text-[#0F172A] font-sans">{currentPlan} Tier</h3>
                    <p className="text-xs text-[#64748B] font-sans">Renewal Cycle: Monthly • Renewal Date: July 30, 2026</p>
                  </div>

                  <div className="flex items-center space-x-6 relative z-10 shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-[#64748B] font-mono font-bold">Credits:</div>
                      <div className="text-2xl font-black text-[#0F172A] font-mono">{activeUser.credits ?? 1000} credits</div>
                    </div>
                    <button
                      onClick={onNavigateToPricing}
                      className="px-4 py-2.5 bg-[#4F46E5] hover:bg-[#6366F1] text-white border-0 font-bold rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-[#4F46E5]/20"
                    >
                      Compare Plans
                    </button>
                  </div>
                </div>

                {/* Credit Balance & Compute Metrics Panel */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Credit Balance Progress */}
                  <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider font-mono">AI edit usage</span>
                      <Wand2 className="w-4 h-4 text-[#4F46E5]" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between font-mono">
                        <span className="text-3xl font-black text-[#0F172A]">{editCount}</span>
                        <span className="text-xs text-[#64748B] font-bold">{trialProgress}/10 until next 25-credit charge</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-[#E2E8F0]">
                        <div
                          className="h-full bg-[#4F46E5] transition-all duration-300 rounded-full"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Portfolio Stats */}
                  <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider font-mono">Your work</span>
                      <Layers className="w-4 h-4 text-[#4F46E5]" />
                    </div>
                    <div>
                      <div className="text-3xl font-black text-[#0F172A] font-mono">{totalProjects} <span className="text-sm font-bold text-[#64748B]">Projects</span></div>
                      <p className="text-[10px] text-[#64748B] font-sans mt-1">Total detected items: {totalObjects}</p>
                    </div>
                  </div>
                </div>

                {/* Plan Upgrade recommendations */}
                <div className="space-y-6">
                  <h2 className="text-base font-bold text-[#0F172A] font-sans border-b border-[#E2E8F0] pb-3 uppercase tracking-wide">
                    Upgrade your plan
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {planTiers.map((tier) => {
                      const isCurrent = currentPlan.toLowerCase() === tier.name.toLowerCase();
                      const IconComp = tier.icon;
                      return (
                        <div
                          key={tier.name}
                          className={`bg-white border rounded-2xl p-6 flex flex-col justify-between relative transition-all duration-300 shadow-sm ${
                            isCurrent ? "border-[#4F46E5] shadow-md shadow-[#4F46E5]/10" : "border-[#E2E8F0] hover:border-[#4F46E5]"
                          }`}
                        >
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-sm font-bold text-[#0F172A]">{tier.name}</h4>
                                <div className="text-lg font-black text-[#0F172A] font-mono mt-0.5">{tier.price}</div>
                              </div>
                              <IconComp className={`w-5 h-5 ${isCurrent ? "text-[#4F46E5]" : "text-[#64748B]"}`} />
                            </div>
                            <span className="text-[10px] font-mono text-white bg-[#4F46E5] border border-[#E2E8F0] px-2 py-0.5 rounded shadow-sm">
                              {tier.credits}
                            </span>
                          </div>
                          <button
                            disabled={isCurrent || upgrading === tier.name}
                            onClick={() => handleUpgrade(tier.name)}
                            className={`w-full mt-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 flex items-center justify-center border ${
                              isCurrent
                                ? "bg-slate-50 border-[#E2E8F0] text-[#64748B]"
                                : "bg-[#4F46E5] hover:bg-[#6366F1] text-white border-0 shadow-lg shadow-[#4F46E5]/15"
                            }`}
                          >
                            {isCurrent ? "Active plan" : "Upgrade"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card on file / Payment Method */}
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4 shadow-sm">
                  <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider font-mono">Payment Method</h3>
                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-[#E2E8F0] rounded-xl">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-5 h-5 text-[#4F46E5]" />
                      <span className="text-xs text-[#0F172A] font-mono">Visa Ending in •••• 4242</span>
                    </div>
                    <button className="px-4 py-2 border border-[#E2E8F0] hover:border-[#4F46E5] text-[#0F172A] rounded-lg text-xs font-bold transition-all uppercase tracking-wider bg-white shadow-sm">
                      Update Card
                    </button>
                  </div>
                </div>

                {/* Billing History */}
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4 shadow-sm">
                  <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider font-mono">Invoice History</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                          <th className="pb-3 font-semibold">Date</th>
                          <th className="pb-3 font-semibold">Plan Description</th>
                          <th className="pb-3 font-semibold">Amount</th>
                          <th className="pb-3 font-semibold text-right">Invoice</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0] text-[#64748B] font-sans">
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 font-mono text-[#0F172A]">June 30, 2026</td>
                          <td className="py-3 text-[#0F172A]">Pro Studio Plan - Monthly Renewal</td>
                          <td className="py-3 font-mono text-[#0F172A]">$49.00</td>
                          <td className="py-3 text-right">
                            <button className="text-[#64748B] hover:text-[#4F46E5] hover:underline flex items-center space-x-1 ml-auto">
                              <FileText className="w-3.5 h-3.5" />
                              <span>Download PDF</span>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Cancel Subscription */}
                <div className="p-6 bg-white border border-[#EF4444]/30 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-[#EF4444] uppercase tracking-wider font-mono">Cancel Subscription</h4>
                    <p className="text-[10px] text-[#64748B] font-sans">Upon cancellation, your Pro features will remain active until the billing cycle ends.</p>
                  </div>
                  <button className="px-4 py-2 bg-transparent hover:bg-red-50/50 border border-[#EF4444] text-[#EF4444] rounded-lg text-xs font-bold transition-all uppercase tracking-wider">
                    Cancel Plan
                  </button>
                </div>

              </div>
            )}

            {activeTab === "security" && (
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm animate-fade-in">
                <h2 className="text-lg font-bold text-[#0F172A] font-sans border-b border-[#E2E8F0] pb-3 uppercase tracking-wide">
                  Security Settings
                </h2>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-[#0F172A] uppercase tracking-wider font-bold">Current Password</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full max-w-md bg-white border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl px-4 py-2.5 text-sm text-[#0F172A] placeholder-[#64748B]/50 focus:outline-none transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-[#0F172A] uppercase tracking-wider font-bold">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full max-w-md bg-white border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl px-4 py-2.5 text-sm text-[#0F172A] placeholder-[#64748B]/50 focus:outline-none transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-[#0F172A] uppercase tracking-wider font-bold">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full max-w-md bg-white border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl px-4 py-2.5 text-sm text-[#0F172A] placeholder-[#64748B]/50 focus:outline-none transition-all duration-200"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="px-6 py-3 bg-[#4F46E5] hover:bg-[#6366F1] text-white border-0 font-bold rounded-xl text-xs uppercase tracking-wider transition-all duration-200 disabled:opacity-40 active:scale-95 shadow-lg shadow-[#4F46E5]/20"
                    >
                      {savingPassword ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>

                <div className="border-t border-[#E2E8F0] pt-6 space-y-4">
                  <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider font-mono">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-[#E2E8F0] rounded-xl">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#0F172A]">Enable 2FA Protection</div>
                      <p className="text-[10px] text-[#64748B] font-sans">Add an extra layer of security using an authenticator app.</p>
                    </div>
                    {/* Toggle Switch */}
                    <button
                      onClick={() => setToggled2FA(!toggled2FA)}
                      className={`w-10 h-6 rounded-full p-1 border transition-all duration-300 relative ${
                        toggled2FA ? "bg-[#4F46E5]/20 border-[#4F46E5]" : "bg-slate-100 border-[#E2E8F0]"
                      }`}
                      aria-label="Toggle Two-Factor Authentication"
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-[#4F46E5] transition-all absolute top-1 ${toggled2FA ? "left-5" : "left-1"}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm animate-fade-in">
                <h2 className="text-lg font-bold text-[#0F172A] font-sans border-b border-[#E2E8F0] pb-3 uppercase tracking-wide">
                  Notification Settings
                </h2>

                <div className="space-y-4 font-sans">
                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-[#E2E8F0] rounded-xl">
                    <div>
                      <div className="text-xs font-bold text-[#0F172A]">Design finished alerts</div>
                      <p className="text-[10px] text-[#64748B]">Email me when an AI edit is done.</p>
                    </div>
                    <button
                      onClick={() => setNotifyGeneration(!notifyGeneration)}
                      className={`w-10 h-6 rounded-full p-1 border transition-all duration-300 relative ${
                        notifyGeneration ? "bg-[#4F46E5]/20 border-[#4F46E5]" : "bg-slate-100 border-[#E2E8F0]"
                      }`}
                      aria-label="Toggle AI output alerts"
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-[#4F46E5] transition-all absolute top-1 ${notifyGeneration ? "left-5" : "left-1"}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-[#E2E8F0] rounded-xl">
                    <div>
                      <div className="text-xs font-bold text-[#0F172A]">Billing & Credit Invoices</div>
                      <p className="text-[10px] text-[#64748B]">Send me email alerts for billing receipts and proration updates.</p>
                    </div>
                    <button
                      onClick={() => setNotifyBilling(!notifyBilling)}
                      className={`w-10 h-6 rounded-full p-1 border transition-all duration-300 relative ${
                        notifyBilling ? "bg-[#4F46E5]/20 border-[#4F46E5]" : "bg-slate-100 border-[#E2E8F0]"
                      }`}
                      aria-label="Toggle billing alerts"
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-[#4F46E5] transition-all absolute top-1 ${notifyBilling ? "left-5" : "left-1"}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-[#E2E8F0] rounded-xl">
                    <div>
                      <div className="text-xs font-bold text-[#0F172A]">DesAIgn Newsletter</div>
                      <p className="text-[10px] text-[#64748B]">Product news, new features, and tips.</p>
                    </div>
                    <button
                      onClick={() => setNotifyNewsletter(!notifyNewsletter)}
                      className={`w-10 h-6 rounded-full p-1 border transition-all duration-300 relative ${
                        notifyNewsletter ? "bg-[#4F46E5]/20 border-[#4F46E5]" : "bg-slate-100 border-[#E2E8F0]"
                      }`}
                      aria-label="Toggle newsletter"
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-[#4F46E5] transition-all absolute top-1 ${notifyNewsletter ? "left-5" : "left-1"}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
