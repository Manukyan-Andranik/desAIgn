"use client";

import React, { useRef } from "react";
import { Sparkles, Upload, ArrowRight, Layers, Home, Palette, ShieldCheck, Cpu, Wand2, Compass, Box, Sliders } from "lucide-react";

interface HomePageProps {
  onUploadClick: () => void;
  onSelectDemo: (demoId: string, roomType: string, designStyle: string) => void;
  selectedRoomType: string;
  selectedDesignStyle: string;
  onOpenSetupModal: () => void;
}

export default function HomePage({
  onUploadClick,
  onSelectDemo,
  selectedRoomType,
  selectedDesignStyle,
  onOpenSetupModal
}: HomePageProps) {
  const sampleDemos = [
    {
      id: "demo_render_01",
      title: "Japandi Organic Living Room",
      roomType: "Living Room",
      designStyle: "Japandi Minimalist",
      desc: "Clean organic timber framing, muted tactile linen upholstery, low-profile modular seating",
      gradient: "from-amber-900/40 via-slate-900 to-slate-950",
      accent: "text-amber-400"
    },
    {
      id: "demo_render_02",
      title: "Nordic Artisan Cafe & Bakery",
      roomType: "Cafe & Restaurant",
      designStyle: "Scandinavian Modern",
      desc: "Warm birch timber counters, pendant lampshades, handcrafted ceramic tableware",
      gradient: "from-blue-900/40 via-slate-900 to-slate-950",
      accent: "text-cyan-400"
    },
    {
      id: "demo_render_03",
      title: "Biophilic Executive Suite",
      roomType: "Office & Study",
      designStyle: "Biophilic Luxury",
      desc: "Lush integrated greenery walls, polished Carrara marble desk surfaces, ergonomic leather",
      gradient: "from-emerald-900/40 via-slate-900 to-slate-950",
      accent: "text-emerald-400"
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#07080c] text-slate-100 p-6 sm:p-10 flex flex-col items-center justify-between select-none relative font-sans">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-blue-600/15 via-cyan-500/15 to-emerald-500/15 blur-[120px] pointer-events-none rounded-full" />

      <div className="w-full max-w-5xl space-y-10 z-10 my-auto">
        
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/90 border border-cyan-500/40 text-cyan-300 font-mono text-xs shadow-lg shadow-cyan-950/50 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>AI Spatial Design OS & Multi-Model Scene Graph Generator</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-100 font-sans leading-tight">
            Transform Any Interior Render into an <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">Interactive Studio</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed font-sans">
            Upload architectural renders to perform zero-shot open-vocabulary object detection, sub-pixel polygon segmentation, metric depth estimation, and active AI learning.
          </p>
        </div>

        {/* Action Dropzone & Setup Launcher */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Dropzone Uploader Card */}
          <div
            onClick={onUploadClick}
            className="lg:col-span-2 bg-slate-900/60 hover:bg-slate-900/90 border-2 border-dashed border-slate-800 hover:border-cyan-500/80 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group shadow-2xl relative overflow-hidden"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/10">
              <Upload className="w-8 h-8 group-hover:animate-bounce" />
            </div>

            <h3 className="text-lg font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
              Upload Architectural Render
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 max-w-md font-sans">
              Drag & drop your JPG/PNG render here, or click to browse. Automatically generates 3D spatial scene graphs and material layers.
            </p>

            <div className="mt-6 inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/25 transition-all group-hover:shadow-cyan-500/40">
              <span>Analyze Render</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Current Room Function & Style Context Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Target Context</span>
                <button
                  onClick={onOpenSetupModal}
                  className="p-1.5 text-cyan-400 hover:bg-slate-800/80 rounded-lg transition-all"
                  title="Change Setup"
                >
                  <Sliders className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                    <Home className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-mono">Room Function</div>
                    <div className="text-xs font-bold text-slate-200">{selectedRoomType}</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-800/60">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-mono">Design Style</div>
                    <div className="text-xs font-bold text-slate-200">{selectedDesignStyle}</div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenSetupModal}
              className="w-full mt-4 py-2.5 px-4 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
            >
              <span>Customize Room & Style</span>
            </button>
          </div>

        </div>

        {/* Interactive Sample Demo Renders Showcase */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Explore Sample Studio Scenes</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Select a demo scene to test interactive features</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sampleDemos.map((demo) => (
              <div
                key={demo.id}
                onClick={() => onSelectDemo(demo.id, demo.roomType, demo.designStyle)}
                className={`bg-gradient-to-b ${demo.gradient} border border-slate-800 hover:border-cyan-500/60 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-xl group flex flex-col justify-between space-y-4`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${demo.accent} bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800`}>
                      {demo.roomType}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 group-hover:text-cyan-200 transition-colors">
                    {demo.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans line-clamp-2">
                    {demo.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{demo.designStyle}</span>
                  <span className="text-cyan-400 group-hover:underline font-bold">Launch Studio →</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer Info */}
      <div className="w-full max-w-5xl pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-mono z-10 gap-2">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>5-Stage Production Stack Active (Grounding DINO + SAM + Depth Anything V2)</span>
        </div>
        <div>Antigravity Spatial OS v1.6</div>
      </div>

    </div>
  );
}
