"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { SceneGraph, OrchestratorResponse } from "@/types/scene";
import LayersSidebar from "@/components/LayersSidebar";
import Inspector from "@/components/Inspector";
import { Sparkles, Upload, RefreshCw, Cpu, CheckCircle2, Scan } from "lucide-react";

const InteractiveCanvas = dynamic(() => import("@/components/InteractiveCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#07080c] text-slate-400 font-mono text-sm">
      Loading Canvas Engine...
    </div>
  )
});

export default function StudioPage() {
  const [sceneGraph, setSceneGraph] = useState<SceneGraph | null>(null);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null);
  const [showBBoxes, setShowBBoxes] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; model?: string; type?: "info" | "success" | "ai" } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzingStage, setAnalyzingStage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageId, setImageId] = useState("demo_render_01");

  const showToast = (message: string, model?: string, type: "info" | "success" | "ai" = "info") => {
    setNotification({ message, model, type });
    setTimeout(() => setNotification(null), 6000);
  };

  const fetchSceneGraph = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/scene-graph/${id}`);
      if (!res.ok) return;
      const data: SceneGraph = await res.json();
      setSceneGraph(data);
      if (data.objects.length > 0) {
        setSelectedObjectId(data.objects[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch scene graph:", err);
    }
  };

  useEffect(() => {
    fetchSceneGraph(imageId);
    showToast("System ready. Vision pipeline active.", "YOLOv8 + SAM 2 + Depth Anything V2", "info");
  }, [imageId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setAnalyzingStage("Executing YOLO Neural Detection & SAM 2 Segmentation...");

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
        showToast(
          `Analyzed ${data.objects.length} elements from render. Scene graph generated.`,
          "YOLOv8 + SAM 2 + OpenCLIP Engine",
          "success"
        );
      }
    } catch (err) {
      console.error("File upload error:", err);
      showToast("Analysis pipeline failed to connect to backend service.", "Backend API Error", "info");
    } finally {
      setUploading(false);
      setAnalyzingStage(null);
    }
  };

  const handleOrchestratorSuccess = (res: OrchestratorResponse) => {
    showToast(
      res.message,
      res.action.material ? `ControlNet / SDXL Inpaint (${res.action.material})` : "AI Orchestrator Engine",
      "ai"
    );

    if (res.updated_object && sceneGraph) {
      setSceneGraph((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          version: prev.version + 1,
          objects: prev.objects.map((obj) =>
            obj.id === res.updated_object?.id ? res.updated_object : obj
          )
        };
      });
    }
  };

  const selectedObject = sceneGraph?.objects.find((obj) => obj.id === selectedObjectId) || null;

  return (
    <div className="w-screen h-screen flex flex-col bg-[#090a0f] text-slate-100 overflow-hidden select-none">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Top Navigation Bar */}
      <header className="h-14 glass-panel border-b border-slate-800 px-6 flex items-center justify-between z-20">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-blue-500/30">
              A
            </div>
            <span className="font-semibold text-sm tracking-tight text-slate-100">Antigravity</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-400">Architectural Scene OS</span>
            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded font-mono">
              YOLOv8 • SAM 2 • Depth Anything V2
            </span>
          </div>
        </div>

        {/* Model Telemetry & Controls */}
        <div className="flex items-center space-x-3">
          {uploading && (
            <div className="bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 text-xs px-3.5 py-1.5 rounded-xl flex items-center space-x-2 animate-pulse shadow-lg shadow-cyan-500/10">
              <Cpu className="w-4 h-4 text-cyan-400 animate-spin" />
              <span className="font-mono text-[11px]">{analyzingStage || "Analyzing Vision Pipeline..."}</span>
            </div>
          )}

          {notification && !uploading && (
            <div
              className={`text-xs px-3.5 py-1.5 rounded-xl flex items-center space-x-2.5 animate-fade-in shadow-lg ${
                notification.type === "ai"
                  ? "bg-indigo-950/90 border border-indigo-500/50 text-indigo-200 shadow-indigo-500/10"
                  : notification.type === "success"
                  ? "bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 shadow-emerald-500/10"
                  : "bg-slate-900/90 border border-slate-700 text-slate-200"
              }`}
            >
              {notification.type === "ai" ? (
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 animate-pulse" />
              ) : notification.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
              )}
              <div className="flex flex-col text-left">
                <span className="font-medium leading-tight">{notification.message}</span>
                {notification.model && (
                  <span className="text-[10px] opacity-75 font-mono">Model: {notification.model}</span>
                )}
              </div>
            </div>
          )}

          {/* Toggle YOLO BBoxes */}
          <button
            onClick={() => setShowBBoxes(!showBBoxes)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-all border ${
              showBBoxes
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                : "bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200"
            }`}
            title="Toggle YOLO Bounding Boxes"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>YOLO Frames: {showBBoxes ? "ON" : "OFF"}</span>
          </button>

          <button
            onClick={() => {
              fetchSceneGraph(imageId);
              showToast("Refreshed Digital Scene Graph state from DB.", "SQLAlchemy Session Sync", "info");
            }}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors"
            title="Refresh Scene Graph"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-xs font-medium flex items-center space-x-2 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? "Analyzing Render..." : "Upload Render"}</span>
          </button>
        </div>
      </header>

      {/* Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        <LayersSidebar
          sceneGraph={sceneGraph}
          selectedObjectId={selectedObjectId}
          onSelectObject={(id) => setSelectedObjectId(id)}
        />

        <main className="flex-1 h-full relative">
          <InteractiveCanvas
            sceneGraph={sceneGraph}
            selectedObjectId={selectedObjectId}
            hoveredObjectId={hoveredObjectId}
            showBBoxes={showBBoxes}
            onSelectObject={(id) => setSelectedObjectId(id)}
            onHoverObject={(id) => setHoveredObjectId(id)}
          />
        </main>

        <Inspector
          selectedObject={selectedObject}
          imageId={imageId}
          onOrchestratorSuccess={handleOrchestratorSuccess}
        />
      </div>
    </div>
  );
}
