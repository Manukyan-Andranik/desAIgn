"use client";

import React, { useState, useEffect } from "react";
import { Cpu, Sparkles, Scan, Layers, Compass, Palette } from "lucide-react";

interface ProgressLoaderProps {
  isLoading: boolean;
  title: string;
}

export default function ProgressLoader({ isLoading, title }: ProgressLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState("Initializing Pipeline...");

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
      setCurrentStage("🎯 Stage 1: Grounding DINO Open-Vocabulary Object Detection...");
    } else if (progress < 55) {
      setCurrentStage("🔍 Stage 2: SAM Sub-Pixel Polygon Mask Segmentation...");
    } else if (progress < 75) {
      setCurrentStage("📐 Stage 3: Depth Anything V2 Monocular Depth Estimation...");
    } else if (progress < 90) {
      setCurrentStage("🎨 Stage 4: OpenCLIP Zero-Shot Surface Material Tagging...");
    } else {
      setCurrentStage("🔗 Stage 5: Spatial Relationship Graph Assembly & Database Sync...");
    }
  }, [progress]);

  if (!isLoading) return null;

  const strokeDasharray = 440; // 2 * Math.PI * 70
  const strokeDashoffset = strokeDasharray - (strokeDasharray * progress) / 100;

  return (
    <div className="fixed inset-0 z-[100] bg-[#07080c]/85 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in p-4 select-none">
      <div className="w-full max-w-md bg-[#0c0e14]/95 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden space-y-6">
        
        {/* Ambient Radial Glowing Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-tr from-cyan-500/25 via-blue-500/25 to-emerald-500/25 blur-3xl pointer-events-none rounded-full animate-pulse" />

        {/* Header Engine Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/40 text-cyan-300 font-mono text-xs shadow-lg">
          <Cpu className="w-4 h-4 text-cyan-400 animate-spin" />
          <span className="font-semibold">5-Stage Spatial Vision AI Engine</span>
        </div>

        {/* Prominent Glowing Circular Percentage Progress Ring */}
        <div className="relative flex items-center justify-center my-3 group">
          <svg className="w-44 h-44 transform -rotate-90 filter drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <circle
              cx="88"
              cy="88"
              r="70"
              stroke="currentColor"
              strokeWidth="12"
              className="text-slate-800/80"
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
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
          
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-extrabold font-mono text-white tracking-tight drop-shadow-md">
              {progress}%
            </span>
            <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider mt-0.5">
              Processing
            </span>
          </div>
        </div>

        {/* Title & Stage Details */}
        <div className="space-y-2 w-full">
          <h3 className="text-base font-bold text-slate-100 font-sans truncate px-2">
            {title}
          </h3>
          <p className="text-xs text-slate-300 font-mono h-9 flex items-center justify-center px-4 leading-relaxed bg-slate-900/60 rounded-xl border border-slate-800/80">
            {currentStage}
          </p>
        </div>

        {/* Bottom Linear Progress Bar */}
        <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800/80 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 transition-all duration-300 ease-out rounded-full shadow-md shadow-cyan-500/50"
            style={{ width: `${progress}%` }}
          />
        </div>

      </div>
    </div>
  );
}
