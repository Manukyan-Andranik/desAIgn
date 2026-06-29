"use client";

import React, { useState } from "react";
import { User, Project } from "@/types/scene";
import {
  Sparkles, Upload, ArrowRight, Layers, Home, Palette, ShieldCheck, Cpu, Wand2,
  Compass, Box, Sliders, FolderPlus, Trash2, User as UserIcon, CheckCircle2,
  Play, Video, Waypoints, Square, Paintbrush, HelpCircle, X, Check
} from "lucide-react";

interface HomePageProps {
  activeUser: User | null;
  projects: Project[];
  onUploadClick: () => void;
  onSelectProject: (proj: Project) => void;
  onDeleteProject?: (id: string) => void;
  selectedRoomType: string;
  selectedDesignStyle: string;
  onOpenSetupModal: () => void;
}

export default function HomePage({
  activeUser,
  projects,
  onUploadClick,
  onSelectProject,
  onDeleteProject,
  selectedRoomType,
  selectedDesignStyle,
  onOpenSetupModal
}: HomePageProps) {
  const [activeDemoVideo, setActiveDemoVideo] = useState<string | null>(null);

  const usageDemos = [
    {
      id: "demo_detection",
      title: "1. Detect & Extract 3D Scene Graph",
      badge: "AI Vision Pipeline",
      desc: "Upload any 2D architectural render image. The vision engine automatically extracts furniture objects, calculates monocular depth, and constructs hierarchical scene layers.",
      gradient: "from-blue-600/30 via-cyan-500/20 to-transparent",
      icon: Cpu,
      steps: ["Drag & drop render file", "AI detects furniture objects & bounding boxes", "Click any layer in sidebar to inspect parameters"]
    },
    {
      id: "demo_selection",
      title: "2. Point-by-Point & Rectangle Selection",
      badge: "Interactive Canvas Tools",
      desc: "Use straight-line Polygon Area, Rectangle Box, or freehand Brush tools to select custom regions directly on the viewport canvas.",
      gradient: "from-cyan-500/30 via-teal-500/20 to-transparent",
      icon: Waypoints,
      steps: ["Select Polygon or Rectangle tool from canvas toolbar", "Click points to form straight-line polygon edges", "Complete selection to register object or edit"]
    },
    {
      id: "demo_ai_inpainting",
      title: "3. Gemini AI Material Synthesis",
      badge: "Generative Transformation",
      desc: "Directly prompt Gemini AI to re-texture, replace materials, or transform selected furniture regions in real time.",
      gradient: "from-purple-600/30 via-pink-500/20 to-transparent",
      icon: Wand2,
      steps: ["Mark object region with selection tool", "Choose 'Call Gemini AI' option", "Type prompt (e.g. 'Replace with cognac leather') and synthesize"]
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#07080c] text-slate-100 p-6 sm:p-10 flex flex-col items-center justify-between select-none relative font-sans">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-blue-600/15 via-cyan-500/15 to-purple-600/15 blur-[140px] pointer-events-none rounded-full" />

      <div className="w-full max-w-5xl space-y-12 z-10 my-auto">
        
        {/* Hero Section & Project Overview */}
        <div className="text-center space-y-4 max-w-3xl mx-auto pt-4">
          <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/40 text-cyan-300 font-mono text-xs shadow-lg shadow-cyan-950/50 animate-fade-in">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold">Next-Gen Architectural Scene OS</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-100 font-sans leading-tight">
            Spatial 3D Vision & <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">AI Scene Generation</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed font-sans">
            Antigravity Spatial OS transforms static architectural renders into interactive, layer-separated 3D scene graphs with real-time generative AI material synthesis.
          </p>
        </div>

        {/* Short Information About Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl space-y-2 shadow-md">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 text-cyan-400 flex items-center justify-center border border-cyan-800/60">
              <Cpu className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">3D Scene Graphs</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">Automatic zero-shot furniture detection and depth extraction.</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl space-y-2 shadow-md">
            <div className="w-9 h-9 rounded-xl bg-blue-950 text-blue-400 flex items-center justify-center border border-blue-800/60">
              <Waypoints className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Polygon Tools</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">Straight-line polygon, box, and freehand brush selection.</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl space-y-2 shadow-md">
            <div className="w-9 h-9 rounded-xl bg-purple-950 text-purple-400 flex items-center justify-center border border-purple-800/60">
              <Wand2 className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Gemini Inpainting</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">Direct AI material texture synthesis and style modification.</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl space-y-2 shadow-md">
            <div className="w-9 h-9 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-800/60">
              <Layers className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Control Panel</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">Multi-tenant per-user project management and duplication.</p>
          </div>
        </div>

        {/* Ad-like Video Demo Showcase Section (Examples How to Use) */}
        <div className="space-y-6 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                <Video className="w-4 h-4" />
                <span>Feature Showcase & Video Demos</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 font-sans">
                Interactive Examples: <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">How to Use Spatial OS</span>
              </h2>
            </div>
            <span className="hidden sm:inline-block text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              Click any video card to preview
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {usageDemos.map((demo) => {
              const IconComp = demo.icon;
              return (
                <div
                  key={demo.id}
                  onClick={() => setActiveDemoVideo(demo.id)}
                  className="bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/70 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 shadow-2xl group flex flex-col justify-between"
                >
                  {/* Ad Video Preview Reel Simulation Box */}
                  <div className={`h-44 bg-gradient-to-br ${demo.gradient} bg-slate-950 relative flex items-center justify-center p-6 overflow-hidden border-b border-slate-800/80`}>
                    
                    {/* Animated Grid Background Simulation */}
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:16px_16px]" />

                    {/* Glowing Play Overlay Button */}
                    <div className="w-14 h-14 rounded-2xl bg-slate-900/90 border border-cyan-500/60 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-black transition-all shadow-xl z-10">
                      <Play className="w-6 h-6 fill-current ml-0.5" />
                    </div>

                    <span className="absolute top-3 left-3 px-2.5 py-1 bg-slate-900/90 border border-slate-700/80 rounded-lg text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider shadow-sm">
                      {demo.badge}
                    </span>
                  </div>

                  {/* Demo Details */}
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                        {demo.title}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-sans">
                        {demo.desc}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-cyan-400 font-bold group-hover:underline">
                      <span>Watch Interactive Demo</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Dropzone & Setup Launcher */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          
          {/* Main Dropzone Uploader Card */}
          <div
            onClick={onUploadClick}
            className="lg:col-span-2 bg-slate-900/60 hover:bg-slate-900/90 border-2 border-dashed border-slate-800 hover:border-cyan-500/80 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group shadow-2xl relative overflow-hidden"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/10">
              <Upload className="w-8 h-8 group-hover:animate-bounce" />
            </div>

            <h3 className="text-lg font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
              New Render Project Upload
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 max-w-md font-sans">
              Drag & drop your JPG/PNG render here. Automatically creates a new project under <span className="text-cyan-300 font-semibold">{activeUser?.name || "active workspace"}</span> and generates 3D spatial scene graphs.
            </p>

            <div className="mt-6 inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/25 transition-all group-hover:shadow-cyan-500/40">
              <FolderPlus className="w-4 h-4" />
              <span>Create & Analyze New Project</span>
            </div>
          </div>

          {/* Target Context Setup Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Target Preset</span>
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
              <span>Customize Preset</span>
            </button>
          </div>

        </div>

        {/* User's Render Projects Showcase Grid */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                {activeUser ? `${activeUser.name}'s Active Projects (${projects.length})` : `Recent Workspace Projects (${projects.length})`}
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Select any project to launch studio</span>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-10 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 font-mono text-xs">
              No projects created yet. Upload a render above to get started!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => onSelectProject(proj)}
                  className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/60 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-xl group flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                        {proj.room_type}
                      </span>
                      {onDeleteProject && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteProject(proj.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 hover:bg-red-950/60 rounded-lg transition-all"
                          title="Delete project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-cyan-200 transition-colors line-clamp-1">
                      {proj.title}
                    </h4>

                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
                      <span>{proj.design_style}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold">{proj.object_count || 0} objects</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 text-[10px]">Render ID: {proj.image_id.split('_').slice(-1)[0]}</span>
                    <span className="text-cyan-400 group-hover:underline font-bold flex items-center gap-1">
                      <span>Launch Studio</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Interactive Video Demo Modal */}
      {activeDemoVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in select-none font-sans">
          <div className="w-full max-w-lg bg-[#0c0e14] border border-cyan-500/60 rounded-3xl p-6 shadow-2xl space-y-5 relative">
            
            {(() => {
              const demo = usageDemos.find((d) => d.id === activeDemoVideo);
              if (!demo) return null;
              const IconComp = demo.icon;
              return (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-lg">
                        <IconComp className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">{demo.title}</h3>
                        <p className="text-[11px] font-mono text-cyan-400">{demo.badge}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveDemoVideo(null)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-3">
                    <div className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">Execution Steps:</div>
                    <div className="space-y-2">
                      {demo.steps.map((step, idx) => (
                        <div key={idx} className="flex items-start space-x-2.5 text-xs text-slate-300">
                          <div className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <span className="leading-relaxed">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setActiveDemoVideo(null)}
                      className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-cyan-500/25 transition-all"
                    >
                      Got It!
                    </button>
                  </div>
                </>
              );
            })()}

          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="w-full max-w-5xl pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-mono z-10 gap-2">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Multi-Tenant Architectural Studio Active</span>
        </div>
        <div>Antigravity Spatial OS v2.5</div>
      </div>

    </div>
  );
}
