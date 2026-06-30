"use client";

import React, { useState } from "react";
import { Check, Sparkles, Zap, Shield, Crown, ChevronDown, Loader2 } from "lucide-react";
import { User } from "@/types/scene";

interface PricingPageProps {
  activeUser: User | null;
  onOpenAuthModal: () => void;
  onUpgradePlan?: (planName: string) => Promise<boolean>;
}

export default function PricingPage({ activeUser, onOpenAuthModal, onUpgradePlan }: PricingPageProps) {
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const currentPlan = activeUser?.plan || "Standard";

  const handlePlanClick = async (planName: string) => {
    if (!activeUser) {
      onOpenAuthModal();
      return;
    }
    if (planName === currentPlan) return;
    if (planName === "Enterprise") return;
    if (!onUpgradePlan) return;

    setUpgrading(planName);
    try {
      await onUpgradePlan(planName);
    } finally {
      setUpgrading(null);
    }
  };

  const planButtonLabel = (planName: string, defaultLabel: string) => {
    if (!activeUser) return planName === "Standard" ? "Get Started Free" : defaultLabel;
    if (planName === currentPlan) return "Current plan";
    if (planName === "Enterprise") return "Contact sales";
    return upgrading === planName ? "Updating..." : defaultLabel;
  };

  const plans = [
    {
      name: "Standard",
      monthlyPrice: "$0",
      annualPrice: "$0",
      period: "Forever Free",
      description: "Great for hobbyists and solo designers.",
      badge: "Signup Bonus",
      credits: "1,000 Free Credits",
      features: [
        "1,000 free credits when you sign up",
        "25 credits per 10 AI edits",
        "50 credits per HD download",
        "Smart object detection",
        "Basic project export",
        "Community support"
      ],
      buttonText: planButtonLabel("Standard", "Get Started Free"),
      isPopular: false,
      icon: Sparkles
    },
    {
      name: "Pro Studio",
      monthlyPrice: "$49",
      annualPrice: "$39",
      period: "per month",
      description: "For design firms and active professionals.",
      badge: "Most Popular",
      credits: "10,000 Monthly Credits",
      features: [
        "10,000 credits per month",
        "Faster AI edits",
        "Unlimited HD downloads",
        "3D model exports",
        "Remembers your material preferences",
        "Priority support"
      ],
      buttonText: planButtonLabel("Pro Studio", "Upgrade to Pro"),
      isPopular: true,
      icon: Crown
    },
    {
      name: "Enterprise",
      monthlyPrice: "$199",
      annualPrice: "$159",
      period: "per month",
      description: "Custom setup for large real estate and design companies.",
      badge: "For large teams",
      credits: "50,000 Monthly Credits",
      features: [
        "50,000 credits per month",
        "Fastest processing for large teams",
        "Team collaboration",
        "Custom AI training for your products",
        "API access for your apps",
        "Dedicated account manager"
      ],
      buttonText: planButtonLabel("Enterprise", "Contact sales"),
      isPopular: false,
      icon: Shield
    }
  ];

  const faqItems = [
    {
      question: "How do credits work?",
      answer: "You start with 1,000 credits. Every 10 AI edits use 25 credits. Each HD download uses 50 credits."
    },
    {
      question: "Can I upgrade or downgrade my plan at any time?",
      answer: "Yes, you can manage your plan directly in your Profile under the Billing tab. Changes apply instantly with prorated credits."
    },
    {
      question: "What's the difference between 2D layers and 3D exports?",
      answer: "2D exports give flat cutouts of each object in your photo. 3D exports add depth so objects look more dimensional in other design tools."
    }
  ];

  const comparisonRows = [
    { feature: "AI detection", std: "Standard", pro: "Faster", ent: "Custom" },
    { feature: "AI edit speed", std: "Normal", pro: "Fast", ent: "Fastest" },
    { feature: "3D exports", std: "Basic", pro: "More formats", ent: "All formats" },
    { feature: "Monthly Credits", std: "1,000 bonus", pro: "10,000", ent: "50,000+" },
    { feature: "Team seats", std: "No", pro: "Up to 3", ent: "Unlimited" },
    { feature: "API access", std: "No", pro: "No", ent: "Yes" }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAFAF9] text-[#0F172A] select-none py-20 px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-20">

        {/* Page Header */}
        <div className="text-center space-y-6 relative animate-slide-up">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-gradient-to-tr from-[#4F46E5]/5 to-[#0EA5E9]/5 blur-[130px] rounded-full pointer-events-none" />

          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white border border-[#E2E8F0] text-xs text-[#4F46E5] shadow-sm">
            <Zap className="w-3.5 h-3.5 text-[#0EA5E9]" />
            <span>Plans for every kind of vision</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0F172A] font-sans tracking-tight leading-tight">
            Simple, credit-based <span className="bg-gradient-to-r from-[#4F46E5] to-[#0EA5E9] bg-clip-text text-transparent">pricing</span>
          </h1>

          <p className="text-xs sm:text-sm text-[#64748B] max-w-xl mx-auto leading-relaxed font-sans">
            No credit card required to start. Cancel or adjust your subscription anytime. Select a plan to empower your workflow.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center space-x-4 animate-slide-up delay-100 font-sans">
          <span className={`text-xs font-semibold ${!isAnnual ? "text-[#4F46E5]" : "text-[#64748B]"}`}>Monthly Billing</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-12 h-6 rounded-full p-1 bg-[#4F46E5]/10 border border-[#E2E8F0] relative transition-all duration-300 active:scale-95"
            aria-label="Toggle billing frequency"
          >
            <div
              className={`w-4 h-4 rounded-full bg-[#4F46E5] transition-all duration-300 absolute top-1 ${isAnnual ? "left-7" : "left-1"}`}
            />
          </button>
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-semibold ${isAnnual ? "text-[#4F46E5]" : "text-[#64748B]"}`}>Annual Billing</span>
            <span className="px-2.5 py-0.5 rounded-md bg-[#4F46E5] text-[9px] text-white font-bold shadow-sm">
              Save 20%
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch animate-slide-up delay-200">
          {plans.map((plan, idx) => {
            const Icon = plan.icon;
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const isCurrent = activeUser && plan.name === currentPlan;
            const isBusy = upgrading === plan.name;
            return (
              <div
                key={idx}
                className={`rounded-2xl p-8 border flex flex-col justify-between relative transition-all duration-300 bg-white shadow-sm ${plan.isPopular
                    ? "border-[#4F46E5] shadow-lg shadow-[#4F46E5]/5 md:scale-[1.03] z-10"
                    : "border-[#E2E8F0] hover:border-[#4F46E5]"
                  } group`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[#4F46E5] text-white text-[10px] uppercase tracking-wider font-bold shadow-md shadow-[#4F46E5]/20">
                    {plan.badge}
                  </div>
                )}

                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-[#0F172A] tracking-wide">{plan.name}</h3>
                      <p className="text-xs text-[#64748B] mt-2 min-h-[32px] leading-relaxed font-sans">{plan.description}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ml-3 transition-transform duration-200 group-hover:scale-110 bg-white border ${plan.isPopular ? "border-[#4F46E5] text-[#4F46E5]" : "border-[#E2E8F0] text-[#64748B]"
                      }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E2E8F0]">
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-4xl font-extrabold text-[#0F172A] font-sans">{price}</span>
                      <span className="text-xs text-[#64748B] font-medium">{plan.period}</span>
                    </div>
                    <div className="mt-3 inline-block px-3 py-1 bg-[#4F46E5]/10 rounded-lg text-[#4F46E5] text-[10px] font-mono font-bold uppercase tracking-wider">
                      {plan.credits}
                    </div>
                  </div>

                  <ul className="space-y-3.5 pt-4 text-xs font-sans">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start space-x-2.5 text-[#0F172A]">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-white border ${plan.isPopular ? "border-[#4F46E5]" : "border-[#E2E8F0]"
                          }`}>
                          <Check className="w-2.5 h-2.5 text-[#4F46E5]" />
                        </div>
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <button
                    onClick={() => handlePlanClick(plan.name)}
                    disabled={isCurrent || isBusy || (plan.name === "Enterprise" && !!activeUser)}
                    className={`w-full py-3 rounded-xl text-xs uppercase tracking-wider font-bold transition-all duration-200 active:scale-[0.97] border flex items-center justify-center gap-2 disabled:opacity-60 ${plan.isPopular
                        ? "bg-[#4F46E5] hover:bg-[#6366F1] text-white border-0 shadow-lg shadow-[#4F46E5]/20"
                        : isCurrent
                          ? "bg-slate-50 border-[#E2E8F0] text-[#64748B]"
                          : "bg-transparent hover:bg-slate-50 border-[#E2E8F0] text-[#0F172A]"
                      }`}
                  >
                    {isBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {plan.buttonText}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="space-y-6 pt-4 animate-slide-up delay-300">
          <h2 className="text-xl font-extrabold text-[#0F172A] border-b border-[#E2E8F0] pb-3 uppercase tracking-wide">
            Plan Feature Comparison
          </h2>
          <div className="overflow-x-auto border border-[#E2E8F0] rounded-2xl bg-white shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#4F46E5]/5 text-[#0F172A] border-b border-[#E2E8F0]">
                  <th className="p-4 font-bold font-sans">Feature Details</th>
                  <th className="p-4 font-bold font-sans">Standard</th>
                  <th className="p-4 font-bold font-sans">Pro Studio</th>
                  <th className="p-4 font-bold font-sans">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A] font-sans">
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? "bg-slate-50/50 hover:bg-[#4F46E5]/5 transition-colors" : "bg-white hover:bg-[#4F46E5]/5 transition-colors"}>
                    <td className="p-4 font-medium text-[#0F172A]">{row.feature}</td>
                    <td className="p-4 text-[#64748B]">{row.std}</td>
                    <td className="p-4 text-[#4F46E5] font-bold">{row.pro}</td>
                    <td className="p-4 text-[#64748B]">{row.ent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-6 pt-4 animate-slide-up delay-400 font-sans">
          <h2 className="text-xl font-extrabold text-[#0F172A] border-b border-[#E2E8F0] pb-3 uppercase tracking-wide">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqItems.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 flex items-center justify-between text-left text-xs font-bold text-[#0F172A] hover:text-[#4F46E5] transition-colors"
                >
                  <span>{item.question}</span>
                  <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform duration-300 ${openFaq === idx ? "rotate-180 text-[#4F46E5]" : ""}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 text-xs text-[#64748B] leading-relaxed border-t border-[#E2E8F0] pt-3 font-sans">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
