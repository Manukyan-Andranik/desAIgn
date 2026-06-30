"use client";

import React, { useState, useEffect } from "react";
import { Cpu, Sparkles, Scan, Layers, Compass, Palette } from "lucide-react";

interface ProgressLoaderProps {
  isLoading: boolean;
  title: string;
}

export default function ProgressLoader({ isLoading, title }: ProgressLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState("Getting started...");

  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      return;
    }

    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) {
          clearInterval(interval);
          return 98;
        }
        const diff = 100 - prev;
        const inc = Math.max(1, Math.floor(diff * 0.08));
        return prev + inc;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Dynamic Stage Messaging Based on Percentage
  useEffect(() => {
    if (progress < 25) {
      setCurrentStage("Step 1: Finding objects in your photo...");
    } else if (progress < 55) {
      setCurrentStage("Step 2: Outlining each item...");
    } else if (progress < 75) {
      setCurrentStage("Step 3: Measuring depth and distance...");
    } else if (progress < 90) {
      setCurrentStage("Step 4: Identifying materials...");
    } else {
      setCurrentStage("Step 5: Building your editable design...");
    }
  }, [progress]);

  if (!isLoading) return null;

  const strokeDasharray = 440; // 2 * Math.PI * 70
  const strokeDashoffset = strokeDasharray - (strokeDasharray * progress) / 100;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0F172A]/30 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in p-4 select-none">
      <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden space-y-6">
        
        {/* Ambient Radial Glowing Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-tr from-[#4F46E5]/15 via-[#0EA5E9]/15 to-[#10B981]/10 blur-3xl pointer-events-none rounded-full animate-pulse" />

        {/* Header Engine Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E2E8F0] text-[#4F46E5] font-mono text-xs shadow-sm">
          <Cpu className="w-4 h-4 text-[#4F46E5] animate-spin" />
          <span className="font-semibold">Analyzing your photo</span>
        </div>

        {/* Prominent Glowing Circular Percentage Progress Ring */}
        <div className="relative flex items-center justify-center my-3 group">
          <svg className="w-44 h-44 transform -rotate-90 filter drop-shadow-[0_0_15px_rgba(79,70,229,0.2)]">
            <circle
              cx="88"
              cy="88"
              r="70"
              stroke="currentColor"
              strokeWidth="12"
              className="text-slate-100"
              fill="transparent"
            />
            <circle
              cx="88"
              cy="88"
              r="70"
              stroke="url(#circleProgressGradient)"
              strokeWidth="12"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300 ease-out"
              fill="transparent"
            />
            <defs>
              <linearGradient id="circleProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4F46E5" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#0EA5E9" />
              </linearGradient>
            </defs>
          </svg>
          
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-extrabold font-mono text-[#0F172A] tracking-tight drop-shadow-sm">
              {progress}%
            </span>
            <span className="text-[11px] font-mono text-[#4F46E5] font-bold uppercase tracking-wider mt-0.5">
              Working on it
            </span>
          </div>
        </div>

        {/* Title & Stage Details */}
        <div className="space-y-2 w-full">
          <h3 className="text-base font-bold text-[#0F172A] font-sans truncate px-2">
            {title}
          </h3>
          <p className="text-xs text-[#64748B] font-mono h-9 flex items-center justify-center px-4 leading-relaxed bg-slate-50 rounded-xl border border-[#E2E8F0]">
            {currentStage}
          </p>
        </div>

        {/* Bottom Linear Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-[#E2E8F0] p-0.5">
          <div
            className="h-full bg-gradient-to-r from-[#4F46E5] via-[#3b82f6] to-[#0EA5E9] transition-all duration-300 ease-out rounded-full shadow-md shadow-[#4F46E5]/25"
            style={{ width: `${progress}%` }}
          />
        </div>

      </div>
    </div>
  );
}
