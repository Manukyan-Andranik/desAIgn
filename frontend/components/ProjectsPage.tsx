"use client";

import React, { useState } from "react";
import { User, Project } from "@/types/scene";
import {
  Folder, FolderPlus, Search, ArrowRight, Trash2, Home, Palette, ShieldCheck,
  Filter, Layers, Sparkles, Box, CheckCircle2, User as UserIcon
} from "lucide-react";

interface ProjectsPageProps {
  activeUser: User | null;
  projects: Project[];
  onUploadClick: () => void;
  onSelectProject: (proj: Project) => void;
  onDeleteProject?: (id: string) => void;
  onOpenAuthModal?: () => void;
}

export default function ProjectsPage({
  activeUser,
  projects,
  onUploadClick,
  onSelectProject,
  onDeleteProject,
  onOpenAuthModal
}: ProjectsPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoomFilter, setSelectedRoomFilter] = useState("all");

  const roomFilters = [
    { id: "all", label: "All Rooms" },
    { id: "Living Room", label: "Living Room" },
    { id: "Kitchen", label: "Kitchen" },
    { id: "Bedroom", label: "Bedroom" },
    { id: "Office & Study", label: "Office & Study" },
    { id: "Cafe & Restaurant", label: "Cafe & Restaurant" }
  ];

  const filteredProjects = projects.filter((proj) => {
    const matchesRoom = selectedRoomFilter === "all" || proj.room_type === selectedRoomFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      proj.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.room_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.design_style.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRoom && matchesSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-[#07080c] text-slate-100 p-6 sm:p-10 flex flex-col items-center select-none relative font-sans">
      
      {/* Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-cyan-600/10 via-blue-600/10 to-purple-600/10 blur-[140px] pointer-events-none rounded-full" />

      <div className="w-full max-w-6xl space-y-8 z-10">
        
        {/* Page Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-cyan-500/40 text-cyan-300 font-mono text-xs shadow-lg">
              {activeUser?.avatar ? (
                <img src={activeUser.avatar} alt={activeUser.name} className="w-4 h-4 rounded-full object-cover" />
              ) : (
                <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span className="font-semibold">{activeUser ? `${activeUser.name}'s Workspace Portfolio` : "Guest Projects Workspace"}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-100 font-sans">
              Architectural Render <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Projects</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-sans max-w-xl">
              Each project maintains independent monocular depth maps, sub-pixel segmentation layers, and spatial scene graphs.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {!activeUser && onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border border-slate-700"
              >
                <UserIcon className="w-4 h-4 text-cyan-400" />
                <span>Sign In / Register</span>
              </button>
            )}

            <button
              onClick={onUploadClick}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all active:scale-95"
            >
              <FolderPlus className="w-4 h-4" />
              <span>New Project Upload</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by title, room, or style..."
              className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-500/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all font-sans shadow-inner"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 font-mono text-xs scrollbar-none">
            {roomFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedRoomFilter(filter.id)}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  selectedRoomFilter === filter.id
                    ? "bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20"
                    : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

        </div>

        {/* Projects Portfolio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          
          {/* Create New Project Dropzone Tile */}
          <div
            onClick={onUploadClick}
            className="bg-slate-900/40 hover:bg-slate-900/80 border-2 border-dashed border-slate-800 hover:border-cyan-500/80 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group shadow-xl min-h-[220px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-110 transition-transform shadow-lg">
              <FolderPlus className="w-7 h-7 group-hover:animate-bounce" />
            </div>
            <h4 className="text-sm font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
              Add Render Project
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 max-w-[200px] font-sans">
              Upload architectural render to initialize spatial scene graph.
            </p>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="lg:col-span-2 text-center py-12 bg-slate-900/30 rounded-3xl border border-slate-800 text-slate-400 font-mono text-xs flex flex-col items-center justify-center space-y-2">
              <Box className="w-8 h-8 text-slate-600" />
              <span>No matching render projects found.</span>
            </div>
          ) : (
            filteredProjects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => onSelectProject(proj)}
                className="bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/60 rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1.5 shadow-xl group flex flex-col justify-between space-y-5 relative overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-800/60 shadow-sm">
                      {proj.room_type}
                    </span>
                    {onDeleteProject && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteProject(proj.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/60 rounded-xl transition-all"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-200 transition-colors line-clamp-1">
                    {proj.title}
                  </h3>

                  <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                    <span>{proj.design_style}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">{proj.object_count || 0} objects</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500 text-[10px]">ID: {proj.image_id.split('_').slice(-1)[0]}</span>
                  <span className="text-cyan-400 group-hover:underline font-bold flex items-center gap-1">
                    <span>Launch Studio</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            ))
          )}

        </div>

      </div>

    </div>
  );
}
