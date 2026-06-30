"use client";

import React, { useState, useRef, useEffect } from "react";
import { User, Project } from "@/types/scene";
import {
  Sparkles, Upload, ArrowRight, Home, Palette, Sliders, Cpu, Wand2,
  Compass, Box, FolderPlus, Trash2, ShieldCheck, Trees, Sofa, LayoutGrid, X
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

  // Before/After Slider State
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseDown = () => setIsDragging(true);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX);
      }
    };
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging]);

  const usageDemos = [
    {
      id: "demo_detection",
      title: "1. Find everything in your photo",
      badge: "Smart detection",
      desc: "Upload a design photo and we automatically find furniture, walls, and objects — organized into layers you can edit.",
      icon: Cpu,
      steps: ["Upload your photo", "We find furniture and items", "Click any layer to see details"]
    },
    {
      id: "demo_selection",
      title: "2. Select any area",
      badge: "Selection tools",
      desc: "Draw a shape, box, or freehand area directly on your image to pick exactly what you want to change.",
      icon: Compass,
      steps: ["Choose a selection tool", "Draw around the area you want", "Save it or edit with AI"]
    },
    {
      id: "demo_ai_inpainting",
      title: "3. Change materials with AI",
      badge: "AI makeover",
      desc: "Describe what you want — new fabric, wood finish, paint color — and see the change applied instantly.",
      icon: Wand2,
      steps: ["Select an area on the image", "Choose AI edit", "Describe the change you want"]
    }
  ];

  const galleryItems = [
    { title: "Nordic Minimalist Living", before: "/default.jpg", tag: "Living Room" },
    { title: "Futuristic Glass Facade", before: "/default.jpg", tag: "Exterior" },
    { title: "Green Executive Office", before: "/default.jpg", tag: "Office" }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAFAF9] text-[#0F172A] p-6 sm:p-12 md:p-16 flex flex-col items-center justify-between select-none relative font-sans">

      {/* Futuristic Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-[#4F46E5]/10 to-[#0EA5E9]/5 blur-[130px] pointer-events-none rounded-full" />

      <div className="w-full max-w-5xl space-y-24 z-10 my-auto">

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-8">
          <div className="lg:col-span-5 space-y-8 text-left animate-slide-up">
            <div className="inline-flex items-center space-x-2.5 px-4 py-2 rounded-full bg-white border border-[#E2E8F0] font-sans text-xs text-[#4F46E5] shadow-sm">
              <Sparkles className="w-4 h-4 text-[#0EA5E9]" />
              <span className="font-semibold tracking-wide">DesAIgn — AI design studio</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-[#0F172A] font-sans leading-[1.1]">
              Redesign any space <br />
              <span className="bg-gradient-to-r from-[#4F46E5] to-[#0EA5E9] bg-clip-text text-transparent">in seconds.</span>
            </h1>

            <p className="text-sm sm:text-base text-[#64748B] leading-relaxed max-w-md">
              Turn design photos into spaces you can edit. Change materials, try new finishes, and explore ideas instantly with AI.
            </p>

            <div className="pt-2 flex flex-wrap gap-4">
              <button
                onClick={onUploadClick}
                className="px-8 py-3.5 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:from-[#6366F1] hover:to-[#4F46E5] text-white border-0 font-bold rounded-xl text-xs uppercase tracking-wider transition-all duration-300 active:scale-95 flex items-center space-x-2 shadow-lg shadow-[#4F46E5]/20"
              >
                <span>Start Designing for Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Draggable Before/After Image Slider */}
          <div className="lg:col-span-7 flex justify-center animate-slide-up delay-100">
            <div
              ref={sliderRef}
              className="relative w-full h-[380px] rounded-3xl overflow-hidden border border-[#E2E8F0] select-none group shadow-lg"
              onMouseMove={(e) => {
                if (!isDragging) {
                  handleMove(e.clientX);
                }
              }}
              onTouchMove={handleTouchMove}
            >
              {/* After Image (AI Transformed Reality) */}
              <div className="absolute inset-0 bg-[url('/default.jpg')] bg-cover bg-center">
                <div className="absolute inset-0 bg-[#4F46E5]/5" />
              </div>
              <div className="absolute top-4 right-4 bg-white/95 text-[#4F46E5] border border-[#E2E8F0] px-3.5 py-1.5 rounded-full text-[10px] font-sans uppercase tracking-wider font-bold z-20 shadow-sm">
                After (with DesAIgn)
              </div>

              {/* Before Image (Raw Concept - Grayscale clipped) */}
              <div
                className="absolute inset-0 w-full h-full overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
              >
                <div
                  className="absolute inset-0 bg-[url('/default.jpg')] bg-cover bg-center"
                  style={{ width: sliderRef.current?.getBoundingClientRect().width || "100%" }}
                />
                <div className="absolute inset-0 bg-white/10 backdrop-grayscale-[85%] backdrop-brightness-[85%]" />
                <div className="absolute top-4 left-4 bg-white/95 text-[#64748B] border border-[#E2E8F0] px-3.5 py-1.5 rounded-full text-[10px] font-sans uppercase tracking-wider font-bold z-20 whitespace-nowrap shadow-sm">
                  Before (original)
                </div>
              </div>

              {/* Draggable Divider Line */}
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-[#E2E8F0] z-30 cursor-ew-resize flex items-center justify-center"
                style={{ left: `${sliderPosition}%` }}
                onMouseDown={handleMouseDown}
              >
                <div className={`w-9 h-9 rounded-full border border-[#E2E8F0] flex items-center justify-center -ml-4.5 active:scale-110 transition-all text-white shadow-md ${
                  isDragging ? "bg-[#4F46E5] shadow-lg shadow-[#4F46E5]/30" : "bg-[#64748B]"
                }`}>
                  ↔
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid (White Cards with Slate/Black Borders) */}
        <div className="space-y-8 pt-4 animate-slide-up delay-200">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-[#0F172A]">
              What you can redesign
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] font-medium">
              Quickly change structure and materials in any space
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-[#E2E8F0] hover:border-[#4F46E5] hover:shadow-md p-8 rounded-2xl space-y-4 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#64748B] group-hover:text-[#4F46E5] group-hover:border-[#4F46E5] transition-all duration-300 shadow-sm">
                <Home className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">Exteriors</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Find walls, roofs, garages, and windows so you can try new materials and finishes.
              </p>
            </div>

            <div className="bg-white border border-[#E2E8F0] hover:border-[#4F46E5] hover:shadow-md p-8 rounded-2xl space-y-4 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#64748B] group-hover:text-[#4F46E5] group-hover:border-[#4F46E5] transition-all duration-300 shadow-sm">
                <Trees className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">Landscaping</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Select lawns, plants, pools, and borders. Fill in gardens and outdoor areas in seconds.
              </p>
            </div>

            <div className="bg-white border border-[#E2E8F0] hover:border-[#4F46E5] hover:shadow-md p-8 rounded-2xl space-y-4 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#64748B] group-hover:text-[#4F46E5] group-hover:border-[#4F46E5] transition-all duration-300 shadow-sm">
                <Sofa className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">Interiors & Furniture</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Pick out furniture and layout, then change fabrics, colors, and finishes with AI.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="space-y-8 pt-4 animate-slide-up delay-300">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-[#0F172A]">How It Works</h2>
            <p className="text-xs sm:text-sm text-[#64748B] font-medium">Three simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative before:content-[''] before:hidden md:before:block before:absolute before:top-14 before:left-[16%] before:right-[16%] before:h-[1px] before:bg-[#E2E8F0]/85 before:-z-10">
            <div className="flex flex-col items-center text-center p-8 bg-white border border-[#E2E8F0] rounded-2xl relative shadow-sm">
              <div className="w-12 h-12 rounded-full bg-[#4F46E5] text-white font-extrabold flex items-center justify-center mb-4 z-10 shadow-md shadow-[#4F46E5]/20">
                1
              </div>
              <h3 className="text-base font-bold text-[#0F172A] mb-2">Upload a Photo</h3>
              <p className="text-xs text-[#64748B]">Upload any JPG or PNG — a photo, render, or plan.</p>
            </div>

            <div className="flex flex-col items-center text-center p-8 bg-white border border-[#E2E8F0] rounded-2xl relative shadow-sm">
              <div className="w-12 h-12 rounded-full bg-[#4F46E5] text-white font-extrabold flex items-center justify-center mb-4 z-10 shadow-md shadow-[#4F46E5]/20">
                2
              </div>
              <h3 className="text-base font-bold text-[#0F172A] mb-2">Describe what you want</h3>
              <p className="text-xs text-[#64748B]">Pick a style or type the material you want.</p>
            </div>

            <div className="flex flex-col items-center text-center p-8 bg-white border border-[#E2E8F0] rounded-2xl relative shadow-sm">
              <div className="w-12 h-12 rounded-full bg-[#4F46E5] text-white font-extrabold flex items-center justify-center mb-4 z-10 shadow-md shadow-[#4F46E5]/20">
                3
              </div>
              <h3 className="text-base font-bold text-[#0F172A] mb-2">Export Design</h3>
              <p className="text-xs text-[#64748B]">Get your finished image right away.</p>
            </div>
          </div>
        </div>

        {/* Gallery / Social Proof Grid */}
        <div className="space-y-8 pt-4 animate-slide-up delay-400">
          <div className="flex items-center space-x-2 border-b border-[#E2E8F0] pb-4">
            <LayoutGrid className="w-5 h-5 text-[#4F46E5]" />
            <h2 className="text-xl font-extrabold text-[#0F172A] uppercase tracking-wide">
              Community examples
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {galleryItems.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#E2E8F0] hover:border-[#4F46E5] rounded-2xl overflow-hidden shadow-sm group transition-all duration-300"
              >
                <div className="h-48 bg-[url('/default.jpg')] bg-cover bg-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />
                  <span className="absolute top-3 left-3 px-3 py-1 bg-white/95 text-[#4F46E5] border border-[#E2E8F0] rounded-lg text-[9px] font-mono font-bold tracking-wider uppercase shadow-sm">
                    {item.tag}
                  </span>
                </div>
                <div className="p-5">
                  <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#4F46E5] transition-colors">
                    {item.title}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workspace Operations Dashboard Segment */}
        <div className="border-t border-[#E2E8F0] pt-16 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-[#4F46E5] uppercase tracking-wider">
                <Sliders className="w-4 h-4" />
                <span>Open your studio</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
                Your projects
              </h2>
            </div>
            <span className="text-xs font-mono text-[#0F172A] bg-white px-4 py-2 rounded-xl border border-[#E2E8F0] shadow-sm">
              Upload a photo to start
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Dropzone Uploader Card */}
            <div
              onClick={onUploadClick}
              className="lg:col-span-2 bg-white hover:bg-slate-50/50 border-2 border-dashed border-[#4F46E5] hover:shadow-md rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group relative overflow-hidden"
            >
              <div className="w-16 h-16 rounded-2xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#4F46E5] mb-4 group-hover:scale-105 transition-transform duration-200 shadow-sm">
                <Upload className="w-8 h-8 group-hover:animate-bounce" />
              </div>

              <h3 className="text-xl font-bold text-[#0F172A] group-hover:text-[#4F46E5] transition-colors">
                Upload a new project
              </h3>
              <p className="text-xs text-[#64748B] mt-2.5 max-w-md leading-relaxed">
                Drop your photo here. We'll find furniture and objects automatically and save it under <span className="text-[#4F46E5] font-semibold">{activeUser?.name || "your account"}</span>.
              </p>

              <div className="mt-6 inline-flex items-center space-x-2 px-6 py-3 bg-[#4F46E5] hover:bg-[#6366F1] text-white border-0 font-bold rounded-xl text-xs tracking-wider transition-all duration-200 active:scale-[0.97] shadow-lg shadow-[#4F46E5]/20">
                <FolderPlus className="w-4 h-4" />
                <span>Upload & start</span>
              </div>
            </div>

            {/* Target Context Setup Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden shadow-sm">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider font-mono">Project settings</span>
                  <button
                    onClick={onOpenSetupModal}
                    className="p-2 text-[#64748B] hover:bg-slate-50 border border-transparent hover:border-[#E2E8F0] rounded-lg transition-all"
                    title="Change Setup"
                  >
                    <Sliders className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] flex items-center space-x-3 shadow-sm">
                    <div className="p-2.5 rounded-lg bg-[#4F46E5]/10 text-[#4F46E5] border border-[#E2E8F0]">
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-[#64748B] uppercase font-mono">Room type</div>
                      <div className="text-xs font-bold text-[#0F172A]">{selectedRoomType}</div>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] flex items-center space-x-3 shadow-sm">
                    <div className="p-2.5 rounded-lg bg-[#4F46E5]/10 text-[#4F46E5] border border-[#E2E8F0]">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-[#64748B] uppercase font-mono">Design Style</div>
                      <div className="text-xs font-bold text-[#0F172A]">{selectedDesignStyle}</div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={onOpenSetupModal}
                className="w-full mt-6 py-3 px-4 bg-transparent hover:bg-slate-50 text-[#0F172A] border border-[#E2E8F0] hover:border-[#4F46E5] rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all duration-200 active:scale-[0.97]"
              >
                <span>Change settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* User's Render Projects Showcase Grid */}
        <div className="space-y-6 pt-4 animate-slide-up delay-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-[#4F46E5]" />
              <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wide font-display">
                {activeUser ? `${activeUser.name}'s projects (${projects.length})` : `Recent projects (${projects.length})`}
              </h3>
            </div>
            <span className="text-xs text-[#64748B] font-mono">Click a project to open it</span>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#E2E8F0] text-[#64748B] font-mono text-xs shadow-sm">
              No projects yet. Upload a photo above to begin.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {projects.map((proj) => {
                const displayImg = proj.image_url || "/default.jpg";

                return (
                  <div
                    key={proj.id}
                    onClick={() => onSelectProject(proj)}
                    className="bg-white border border-[#E2E8F0] hover:border-[#4F46E5] hover:shadow-md rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-sm group flex flex-col justify-between relative"
                  >
                    {/* Render Image Thumbnail Header */}
                    <div className="h-40 w-full relative overflow-hidden bg-white">
                      <img
                        src={displayImg}
                        alt={proj.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />

                      <span className="absolute top-2.5 left-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#4F46E5] bg-white border border-[#E2E8F0] px-2.5 py-1 rounded-lg shadow-sm">
                        {proj.room_type}
                      </span>

                      {onDeleteProject && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteProject(proj.id);
                          }}
                          className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 p-2 bg-white text-[#0F172A] hover:text-red-500 rounded-lg transition-all border border-[#E2E8F0] shadow-sm"
                          title="Delete project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Card Content Details */}
                    <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold text-[#0F172A] group-hover:text-[#4F46E5] transition-colors line-clamp-1">
                          {proj.title}
                        </h4>

                        <div className="flex items-center space-x-2 text-[11px] text-[#64748B] font-mono">
                          <span>{proj.design_style}</span>
                          <span>•</span>
                          <span className="text-[#4F46E5] font-semibold">{proj.object_count || 0} items</span>
                        </div>
                      </div>

                      <div className="pt-3.5 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-mono">
                        <span className="text-[#64748B] text-[10px]">Project: {proj.image_id.split('_').slice(-1)[0]}</span>
                        <span className="text-[#64748B] group-hover:text-[#4F46E5] font-bold flex items-center gap-1 transition-colors">
                          <span>Open</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Interactive Video Demo Modal */}
      {activeDemoVideo && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/30 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none font-sans" onClick={() => setActiveDemoVideo(null)}>
          <div className="w-full max-w-lg bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-lg space-y-6 relative animate-scale-in" onClick={e => e.stopPropagation()}>

            {(() => {
              const demo = usageDemos.find((d) => d.id === activeDemoVideo);
              if (!demo) return null;
              const IconComp = demo.icon;
              return (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#4F46E5] shadow-sm">
                        <IconComp className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wide font-display">{demo.title}</h3>
                        <p className="text-[11px] font-mono text-[#64748B]">{demo.badge}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveDemoVideo(null)}
                      className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 border border-transparent hover:border-[#E2E8F0] rounded-lg transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-5 bg-slate-50 rounded-2xl border border-[#E2E8F0] space-y-4">
                    <div className="text-xs font-bold text-[#0F172A] uppercase tracking-wider font-mono">Steps:</div>
                    <div className="space-y-3">
                      {demo.steps.map((step, idx) => (
                        <div key={idx} className="flex items-start space-x-3 text-xs text-[#64748B]">
                          <div className="w-6 h-6 rounded-full bg-[#4F46E5] text-white text-[11px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-[#4F46E5]/15">
                            {idx + 1}
                          </div>
                          <span className="leading-relaxed pt-0.5">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setActiveDemoVideo(null)}
                      className="px-6 py-3 bg-[#4F46E5] hover:bg-[#6366F1] text-white border-0 font-bold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all duration-200 active:scale-[0.97]"
                    >
                      Got it
                    </button>
                  </div>
                </>
              );
            })()}

          </div>
        </div>
      )}

      {/* Final CTA Band */}
      <div className="w-full bg-[#4F46E5] border border-[#E2E8F0] rounded-3xl p-10 sm:p-14 text-center my-16 relative overflow-hidden shadow-lg z-10">
        <div className="absolute inset-0 bg-[#0EA5E9]/10 pointer-events-none" />
        <div className="relative z-10 max-w-xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Start your first redesign</h2>
          <p className="text-sm text-white/90 leading-relaxed max-w-md mx-auto">
            Turn any design photo into something you can change and explore endlessly.
          </p>
          <button
            onClick={onUploadClick}
            className="px-8 py-3.5 bg-white hover:bg-[#FAFAF9] text-[#4F46E5] font-bold border-0 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 active:scale-95 shadow-lg"
          >
            Start Designing Free
          </button>
        </div>
      </div>

      {/* Footer Columns */}
      <footer className="w-full max-w-5xl py-16 border-t border-[#E2E8F0] grid grid-cols-2 sm:grid-cols-4 gap-8 text-[#64748B] z-10">
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">Product</h4>
          <ul className="space-y-2.5 text-xs text-[#64748B]">
            <li><a href="#facades" className="hover:text-[#4F46E5] transition-colors">Facades</a></li>
            <li><a href="#landscapes" className="hover:text-[#4F46E5] transition-colors">Landscaping</a></li>
            <li><a href="#interiors" className="hover:text-[#4F46E5] transition-colors">Interiors</a></li>
          </ul>
        </div>
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">Company</h4>
          <ul className="space-y-2.5 text-xs text-[#64748B]">
            <li><a href="#about" className="hover:text-[#4F46E5] transition-colors">About Us</a></li>
            <li><a href="#careers" className="hover:text-[#4F46E5] transition-colors">Careers</a></li>
          </ul>
        </div>
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">Legal</h4>
          <ul className="space-y-2.5 text-xs text-[#64748B]">
            <li><a href="#privacy" className="hover:text-[#4F46E5] transition-colors">Privacy Policy</a></li>
            <li><a href="#terms" className="hover:text-[#4F46E5] transition-colors">Terms of Service</a></li>
          </ul>
        </div>
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">Social</h4>
          <ul className="space-y-2.5 text-xs text-[#64748B]">
            <li><a href="#twitter" className="hover:text-[#4F46E5] transition-colors">Twitter</a></li>
            <li><a href="#linkedin" className="hover:text-[#4F46E5] transition-colors">LinkedIn</a></li>
          </ul>
        </div>
      </footer>

      {/* Footer Info */}
      <div className="w-full max-w-5xl pt-8 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] font-mono z-10 gap-4">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4" />
          <span>Design studio ready</span>
        </div>
        <div>DesAIgn v3.0</div>
      </div>

    </div>
  );
}
