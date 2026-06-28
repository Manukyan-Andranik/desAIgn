"use client";

import React, { useState, useEffect } from "react";
import { Cpu, Sparkles, CheckCircle2, Scan, Layers, Compass, Palette } from "lucide-react";

interface ProgressLoaderProps {
  isLoading: boolean;
  title: string;
  onComplete?: () => void;
}

export default function ProgressLoader({ isLoading, title, onComplete }: ProgressLoaderProps) {
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
        // Smooth logarithmic progression speed
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

  return (
    <div className="fixed inset-0 z-50 bg-[#07080c]/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in p-4 select-none">
      <div className="w-full max-w-md bg-[#0c0e14] border border-slate-800/80 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden space-y-6">
        
        {/* Background Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-emerald-500/20 blur-3xl pointer-events-none rounded-full" />

        {/* Header Badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/90 border border-cyan-500/40 text-cyan-300 font-mono text-xs shadow-lg">
          <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          <span>5-Stage Vision AI Engine</span>
        </div>

        {/* Percentage Counter Ring */}
        <div className="relative flex items-center justify-center my-2">
          <svg className="w-36 h-36 transform -rotate-90">
            <circle
              cx="72"
              cy="72"
              r="60"
              stroke="currentColor"
              strokeWidth="10"
              className="text-slate-800/80"
              fill="transparent"
            />
            <circle
              cx="72"
              cy="72"
              r="60"
              stroke="url(#progressGradient)"
              strokeWidth="10"
              strokeDasharray={377}
              strokeDashoffset={377 - (377 * progress) / 100}
              strokeLinecap="round"
              className="transition-all duration-300 ease-out"
              fill="transparent"
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-extrabold font-mono text-slate-100 tracking-tight">
              {progress}%
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-semibold uppercase">Processing</span>
          </div>
        </div>

        {/* Title & Stage Details */}
        <div className="space-y-2 w-full">
          <h3 className="text-base font-bold text-slate-100 font-sans truncate">
            {title}
          </h3>
          <p className="text-xs text-slate-400 font-mono h-8 flex items-center justify-center px-4 leading-tight">
            {currentStage}
          </p>
        </div>

        {/* Progress Bar Line */}
        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800/80">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 transition-all duration-300 ease-out rounded-full shadow-lg shadow-cyan-500/50"
            style={{ width: `${progress}%` }}
          />
        </div>

      </div>
    </div>
  );
}
