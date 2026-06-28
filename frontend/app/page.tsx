"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { SceneGraph, OrchestratorResponse } from "@/types/scene";
import LayersSidebar from "@/components/LayersSidebar";
import Inspector from "@/components/Inspector";
import { Sparkles, Upload, RefreshCw, Cpu, CheckCircle2, Scan, Loader2 } from "lucide-react";

const InteractiveCanvas = dynamic(() => import("@/components/InteractiveCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#07080c] text-slate-400 font-mono text-xs space-y-3 select-none">
      <Cpu className="w-5 h-5 text-cyan-400 animate-spin" />
      <span>Loading Viewport...</span>
    </div>
  )
});

export default function StudioPage() {
  const [sceneGraph, setSceneGraph] = useState<SceneGraph | null>(null);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null);
  const [showBBoxes, setShowBBoxes] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; model?: string; type?: "info" | "success" | "ai" } | null>(null);
  
  // Loading states
  const [uploading, setUploading] = useState(false);
  const [isOrchestrating, setIsOrchestrating] = useState(false);

  // Resizable Panel Width States
  const [leftWidth, setLeftWidth] = useState(240);
  const [rightWidth, setRightWidth] = useState(280);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageId, setImageId] = useState("demo_render_01");

  // Mouse drag listeners for panel resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft) {
        const newWidth = Math.min(Math.max(e.clientX, 160), 500);
        setLeftWidth(newWidth);
      } else if (isDraggingRight) {
        const newWidth = Math.min(Math.max(window.innerWidth - e.clientX, 200), 550);
        setRightWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
    };

    if (isDraggingLeft || isDraggingRight) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingLeft, isDraggingRight]);

  const showToast = (message: string, model?: string, type: "info" | "success" | "ai" = "info") => {
    setNotification({ message, model, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchSceneGraph = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/scene-graph/${id}`);
      if (!res.ok) return;
      const data: SceneGraph = await res.json();
      setSceneGraph(data);
      if (data.objects.length > 0 && !selectedObjectId) {
        setSelectedObjectId(data.objects[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch scene graph:", err);
    }
  };

  useEffect(() => {
    fetchSceneGraph(imageId);
  }, [imageId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/api/v1/analyze", {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const data: SceneGraph = await res.json();
        setSceneGraph(data);
        setImageId(data.image_id);
        if (data.objects.length > 0) {
          setSelectedObjectId(data.objects[0].id);
        }
        showToast(`Analyzed render (${data.objects.length} elements).`, "Vision Engine", "success");
      }
    } catch (err) {
      console.error("File upload error:", err);
      showToast("Analysis pipeline failed.", "API Error", "info");
    } finally {
      setUploading(false);
    }
  };

  const handleOrchestratorSuccess = (res: OrchestratorResponse) => {
    showToast(res.message, "Generative AI", "ai");

    if ((res.updated_object || res.updated_image_url) && sceneGraph) {
      setSceneGraph((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          version: prev.version + 1,
          image_url: res.updated_image_url || prev.image_url,
          objects: res.updated_object
            ? prev.objects.map((obj) => (obj.id === res.updated_object?.id ? res.updated_object : obj))
            : prev.objects
        };
      });
    }
  };

  const selectedObject = sceneGraph?.objects.find((obj) => obj.id === selectedObjectId) || null;

  return (
    <div className="w-screen h-screen flex flex-col bg-[#090a0f] text-slate-100 overflow-hidden select-none font-sans">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Sleek Minimalist Navigation Bar */}
      <header className="h-13 bg-[#0c0e14]/90 border-b border-slate-800/80 px-5 flex items-center justify-between z-20 shrink-0 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-blue-500/20">
            A
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-100">Antigravity</span>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">• Studio OS</span>
        </div>

        {/* Minimal Actions */}
        <div className="flex items-center space-x-2.5">
          {notification && !uploading && !isOrchestrating && (
            <div className="text-xs px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 flex items-center space-x-2 animate-fade-in font-mono">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{notification.message}</span>
            </div>
          )}

          <button
            onClick={() => setShowBBoxes(!showBBoxes)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all border ${
              showBBoxes
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-medium"
                : "bg-slate-800/50 text-slate-400 border-slate-700/60 hover:text-slate-200"
            }`}
            title="Toggle Bounding Boxes"
          >
            Boxes: {showBBoxes ? "ON" : "OFF"}
          </button>

          <button
            onClick={() => fetchSceneGraph(imageId)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-all"
            title="Refresh Scene Graph"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || isOrchestrating}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all shadow-md shadow-blue-600/20 active:scale-95 disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? "Analyzing..." : "Upload Render"}</span>
          </button>
        </div>
      </header>

      {/* Main Studio Workspace with Resizable Control Panels */}
      <div className="flex-1 flex overflow-hidden relative">
        <LayersSidebar
          sceneGraph={sceneGraph}
          selectedObjectId={selectedObjectId}
          onSelectObject={(id) => setSelectedObjectId(id)}
          width={leftWidth}
        />

        {/* Left Resizer Handle */}
        <div
          onMouseDown={() => setIsDraggingLeft(true)}
          className="w-1.5 h-full cursor-col-resize bg-slate-800/40 hover:bg-cyan-500/50 active:bg-cyan-500 transition-colors shrink-0 z-30 flex items-center justify-center group"
          title="Drag to resize left panel width"
        >
          <div className="w-0.5 h-6 bg-slate-600 group-hover:bg-cyan-300 rounded" />
        </div>

        <main className="flex-1 h-full relative">
          <InteractiveCanvas
            sceneGraph={sceneGraph}
            selectedObjectId={selectedObjectId}
            hoveredObjectId={hoveredObjectId}
            showBBoxes={showBBoxes}
            onSelectObject={(id) => setSelectedObjectId(id)}
            onHoverObject={(id) => setHoveredObjectId(id)}
          />

          {/* Minimal Glassmorphism Loading Overlay */}
          {(uploading || isOrchestrating) && (
            <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in p-4 select-none">
              <div className="px-6 py-4 rounded-2xl border border-slate-700/80 bg-slate-900/90 shadow-2xl flex items-center space-x-3.5 font-mono text-xs text-slate-200">
                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                <span>{uploading ? "Analyzing Scene Graph..." : "Synthesizing AI Edit..."}</span>
              </div>
            </div>
          )}
        </main>

        {/* Right Resizer Handle */}
        <div
          onMouseDown={() => setIsDraggingRight(true)}
          className="w-1.5 h-full cursor-col-resize bg-slate-800/40 hover:bg-cyan-500/50 active:bg-cyan-500 transition-colors shrink-0 z-30 flex items-center justify-center group"
          title="Drag to resize right panel width"
        >
          <div className="w-0.5 h-6 bg-slate-600 group-hover:bg-cyan-300 rounded" />
        </div>

        <Inspector
          selectedObject={selectedObject}
          imageId={imageId}
          onOrchestratorSuccess={handleOrchestratorSuccess}
          onOrchestrateStart={() => setIsOrchestrating(true)}
          onOrchestrateEnd={() => setIsOrchestrating(false)}
          width={rightWidth}
        />
      </div>
    </div>
  );
}
