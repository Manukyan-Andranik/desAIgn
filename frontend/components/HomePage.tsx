"use client";

import React from "react";
import { User, Project } from "@/types/scene";
import {
  Sparkles, Upload, ArrowRight, Layers, Home, Palette, ShieldCheck, Cpu, Wand2,
  Compass, Box, Sliders, FolderPlus, Trash2, User as UserIcon, CheckCircle2
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
  return (
    <div className="flex-1 overflow-y-auto bg-[#07080c] text-slate-100 p-6 sm:p-10 flex flex-col items-center justify-between select-none relative font-sans">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-blue-600/15 via-cyan-500/15 to-emerald-500/15 blur-[120px] pointer-events-none rounded-full" />

      <div className="w-full max-w-5xl space-y-10 z-10 my-auto">
        
        {/* Hero Section with Active Workspace User Badge */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/40 text-cyan-300 font-mono text-xs shadow-lg shadow-cyan-950/50 animate-fade-in">
            {activeUser?.avatar ? (
              <img src={activeUser.avatar} alt={activeUser.name} className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span className="font-semibold">{activeUser ? `${activeUser.name}'s Studio Workspace` : "Multi-Tenant Design OS"}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-100 font-sans leading-tight">
            Architectural Render Projects & <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">Scene Graphs</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed font-sans">
            Each project represents a distinct architectural render image with its own zero-shot object detections, sub-pixel segmentation masks, and spatial scene graphs.
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
                {activeUser?.name}'s Render Projects ({projects.length})
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Select any project to launch its interactive studio</span>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-10 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 font-mono text-xs">
              No projects created for this user yet. Upload a render above!
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

      {/* Footer Info */}
      <div className="w-full max-w-5xl pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-mono z-10 gap-2">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Multi-Tenant Multi-Project Studio Active</span>
        </div>
        <div>Antigravity Spatial OS v2.5</div>
      </div>

    </div>
  );
}
