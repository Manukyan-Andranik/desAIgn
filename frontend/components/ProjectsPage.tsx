"use client";

import React, { useState } from "react";
import { User, Project } from "@/types/scene";
import {
  Folder, FolderPlus, Search, ArrowRight, Trash2, Home, Palette, ShieldCheck,
  Filter, Layers, Sparkles, Box, CheckCircle2, User as UserIcon, Copy, Plus, X, BarChart3, Sliders
} from "lucide-react";

interface ProjectsPageProps {
  activeUser: User | null;
  projects: Project[];
  onUploadClick: () => void;
  onSelectProject: (proj: Project) => void;
  onDeleteProject?: (id: string) => void;
  onDuplicateProject?: (id: string) => void;
  onOpenAuthModal?: () => void;
}

const ROOM_OPTIONS = [
  "Living Room", "Kitchen", "Bedroom", "Bathroom", "Office & Study", "Cafe & Restaurant", "Outdoor Patio"
];

export default function ProjectsPage({
  activeUser,
  projects,
  onUploadClick,
  onSelectProject,
  onDeleteProject,
  onDuplicateProject,
  onOpenAuthModal
}: ProjectsPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoomFilter, setSelectedRoomFilter] = useState("all");

  const roomFilters = [
    { id: "all", label: "All Rooms" },
    ...ROOM_OPTIONS.map((r) => ({ id: r, label: r }))
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

  const totalObjectsCount = projects.reduce((acc, p) => acc + (p.object_count || 0), 0);
  const uniqueRoomsCount = new Set(projects.map((p) => p.room_type)).size;

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAFAF9] text-[#0F172A] p-6 sm:p-10 flex flex-col items-center select-none relative font-sans">
      
      {/* Ambient Radial Lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-[#4F46E5]/5 to-[#0EA5E9]/5 blur-[150px] pointer-events-none rounded-full" />

      <div className="w-full max-w-5xl space-y-8 z-10">
        
        {/* Page Header & Control Panel Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0] animate-slide-up">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-[#E2E8F0] text-[#4F46E5] font-mono text-xs shadow-sm">
              {activeUser?.avatar ? (
                <img src={activeUser.avatar} alt={activeUser.name} className="w-4 h-4 rounded-full object-cover" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-[#4F46E5]" />
              )}
              <span className="font-semibold">{activeUser ? `${activeUser.name}'s projects` : "Sign in to view projects"}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] uppercase tracking-tight font-sans">
              Your design projects
            </h1>
            <p className="text-xs text-[#64748B] max-w-xl font-sans">
              Manage your rooms, AI redesigns, and saved items in one place.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {!activeUser && onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 text-[#0F172A] border border-[#E2E8F0] font-semibold rounded-xl text-xs transition-all duration-200"
              >
                Sign In to Unlock
              </button>
            )}

            <button
              onClick={onUploadClick}
              className="px-5 py-2.5 bg-[#4F46E5] hover:bg-[#6366F1] text-white border-0 font-bold rounded-xl text-xs flex items-center space-x-2 transition-all duration-200 active:scale-[0.97] shadow-lg shadow-[#4F46E5]/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create new project</span>
            </button>
          </div>
        </div>

        {/* Workspace Quick Statistics Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-slide-up delay-100">
          <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl space-y-1 hover:border-[#4F46E5] transition-all duration-200 shadow-sm">
            <div className="text-[11px] text-[#64748B] font-mono flex items-center space-x-1.5">
              <Folder className="w-3.5 h-3.5 text-[#4F46E5]" />
              <span>Total Projects</span>
            </div>
            <div className="text-xl font-extrabold text-[#0F172A] font-mono">{projects.length} projects</div>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl space-y-1 hover:border-[#4F46E5] transition-all duration-200 shadow-sm">
            <div className="text-[11px] text-[#64748B] font-mono flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-[#4F46E5]" />
              <span>Detected items</span>
            </div>
            <div className="text-xl font-extrabold text-[#0F172A] font-mono">{totalObjectsCount} items</div>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl space-y-1 hover:border-[#4F46E5] transition-all duration-200 shadow-sm">
            <div className="text-[11px] text-[#64748B] font-mono flex items-center space-x-1.5">
              <Home className="w-3.5 h-3.5 text-[#4F46E5]" />
              <span>Room Types</span>
            </div>
            <div className="text-xl font-extrabold text-[#0F172A] font-mono">{uniqueRoomsCount} types</div>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl space-y-1 hover:border-[#4F46E5] transition-all duration-200 shadow-sm">
            <div className="text-[11px] text-[#64748B] font-mono flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#0EA5E9]" />
              <span>AI editing</span>
            </div>
            <div className="text-xl font-extrabold text-[#4F46E5] font-mono">Ready</div>
          </div>
        </div>

        {/* Filter Controls & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 animate-slide-up delay-200">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#64748B]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, room, or style..."
              className="w-full bg-white border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl pl-10 pr-9 py-2 text-xs text-[#0F172A] placeholder-[#64748B]/50 focus:outline-none transition-all duration-200 font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto custom-scrollbar pb-1 font-sans text-xs">
            <Filter className="w-3.5 h-3.5 text-[#64748B] shrink-0 mr-1" />
            {roomFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedRoomFilter(filter.id)}
                className={`px-3 py-1.5 rounded-xl transition-all duration-200 whitespace-nowrap border ${
                  selectedRoomFilter === filter.id
                    ? "bg-[#4F46E5] text-white border-0 font-bold"
                    : "bg-white text-[#64748B] hover:text-[#0F172A] border-[#E2E8F0]"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Control Panel Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          
          {/* Create New Project Dropzone Tile */}
          <div
            onClick={onUploadClick}
            className="bg-white hover:bg-slate-50/50 border-2 border-dashed border-[#E2E8F0] hover:border-[#4F46E5] hover:shadow-md rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group min-h-[220px] animate-slide-up delay-300"
          >
            <div className="w-14 h-14 rounded-2xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#4F46E5] mb-3 group-hover:scale-110 transition-transform duration-200 shadow-sm">
              <FolderPlus className="w-7 h-7 group-hover:animate-bounce" />
            </div>
            <h4 className="text-sm font-bold text-[#0F172A] group-hover:text-[#4F46E5] transition-colors">
              New project
            </h4>
            <p className="text-[11px] text-[#64748B]/80 mt-1 max-w-[200px] font-sans">
              Upload a photo to start a new project.
            </p>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="lg:col-span-2 text-center py-12 bg-white rounded-2xl border border-[#E2E8F0] text-[#64748B] font-mono text-xs flex flex-col items-center justify-center space-y-2 shadow-sm">
              <Box className="w-8 h-8 text-[#64748B] animate-pulse" />
              <span>No projects match your search.</span>
            </div>
          ) : (
            filteredProjects.map((proj, idx) => {
              const displayImg = proj.image_url || "/default.jpg";

              return (
                <div
                  key={proj.id}
                  onClick={() => onSelectProject(proj)}
                  className="bg-white border border-[#E2E8F0] hover:border-[#4F46E5] hover:shadow-md rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 group flex flex-col justify-between relative animate-slide-up shadow-sm"
                  style={{ animationDelay: `${(idx + 4) * 50}ms` }}
                >
                  {/* Original Render Image Header */}
                  <div className="h-44 w-full relative overflow-hidden bg-white">
                    <img
                      src={displayImg}
                      alt={proj.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                    
                    <span className="absolute top-3 left-3 text-[10px] font-mono font-bold uppercase tracking-wider text-[#4F46E5] bg-white px-2.5 py-1 rounded-lg border border-[#E2E8F0] shadow-sm">
                      {proj.room_type}
                    </span>

                    <div className="absolute top-3 right-3 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white p-1 rounded-lg border border-[#E2E8F0] shadow-sm">
                      {onDuplicateProject && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateProject(proj.id);
                          }}
                          className="p-1.5 text-[#64748B] hover:text-[#4F46E5] hover:bg-slate-50 rounded-lg transition-all"
                          title="Duplicate project"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDeleteProject && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteProject(proj.id);
                          }}
                          className="p-1.5 text-[#64748B] hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition-all"
                          title="Delete project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card Content Details */}
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-[#0F172A] group-hover:text-[#4F46E5] transition-colors line-clamp-1">
                        {proj.title}
                      </h3>

                      <div className="flex items-center space-x-2 text-xs text-[#64748B] font-mono">
                        <span>{proj.design_style}</span>
                        <span>•</span>
                        <span className="text-[#4F46E5] font-semibold">{proj.object_count || 0} items</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-mono">
                      <span className="text-[#64748B] text-[10px]">ID: {proj.image_id.split('_').slice(-1)[0]}</span>
                      <span className="text-[#64748B] group-hover:text-[#4F46E5] font-bold flex items-center gap-1 transition-colors">
                        <span>Open</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}

        </div>

      </div>

    </div>
  );
}
