"use client";

import React, { useState } from "react";
import { SceneObject, OrchestratorResponse } from "@/types/scene";
import { Sparkles, Layers, ShieldCheck, Cpu, Box, ArrowRight, Compass, Activity } from "lucide-react";

interface InspectorProps {
  selectedObject: SceneObject | null;
  imageId: string;
  onOrchestratorSuccess: (response: OrchestratorResponse) => void;
}

export default function Inspector({ selectedObject, imageId, onOrchestratorSuccess }: InspectorProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  if (!selectedObject) {
    return (
      <aside className="w-80 h-full glass-panel border-l border-slate-800 p-6 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mb-4 text-slate-400">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-medium text-slate-200">No Node Selected</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
          Select an architectural element on the viewport canvas to inspect sub-pixel spatial context and physical surface parameters.
        </p>
      </aside>
    );
  }

  const handleOrchestrate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_id: imageId,
          target_id: selectedObject.id,
          prompt: prompt.trim()
        })
      });
      const data: OrchestratorResponse = await res.json();
      onOrchestratorSuccess(data);
      setPrompt("");
    } catch (err) {
      console.error("Orchestrator execution error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="w-80 h-full glass-panel border-l border-slate-800 p-5 flex flex-col justify-between overflow-y-auto">
      <div className="space-y-5">
        {/* Object Header & Color Swatch */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              {selectedObject.class}
            </span>
            <span className="text-xs font-mono text-slate-400">ID: {selectedObject.id}</span>
          </div>

          <div className="flex items-center space-x-3 mt-2.5">
            {selectedObject.color_hex && (
              <div
                className="w-5 h-5 rounded-full border border-white/20 shadow-sm shrink-0"
                style={{ backgroundColor: selectedObject.color_hex }}
                title={`Color HEX: ${selectedObject.color_hex}`}
              />
            )}
            <h2 className="text-sm font-semibold text-slate-100 leading-tight">
              {selectedObject.material}
            </h2>
          </div>
        </div>

        {/* Model Pipeline Execution Tags */}
        <div className="glass-card p-2.5 rounded-lg space-y-1.5 border border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
            <Activity className="w-3 h-3 text-cyan-400" /> Model Lineage Telemetry
          </span>
          <div className="flex flex-wrap gap-1 text-[10px] font-mono">
            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded">YOLOv8 Neural Detector</span>
            <span className="bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded">SAM 2</span>
            <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded">Depth Anything V2</span>
            <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">OpenCLIP</span>
          </div>
        </div>

        {/* Spatial & Physical Surface Parameters */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">Physical Surface Specs</h4>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="glass-card p-2 rounded-lg">
              <div className="text-slate-400 flex items-center gap-1 mb-1 text-[10px]">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Confidence</span>
              </div>
              <span className="font-mono text-slate-200 font-medium text-xs">
                {(selectedObject.confidence * 100).toFixed(1)}%
              </span>
            </div>

            <div className="glass-card p-2 rounded-lg">
              <div className="text-slate-400 flex items-center gap-1 mb-1 text-[10px]">
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span>Metric Depth</span>
              </div>
              <span className="font-mono text-slate-200 font-medium text-xs">
                {selectedObject.depth}m
              </span>
            </div>
          </div>

          <div className="glass-card p-2.5 rounded-lg space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1 text-[10px]">
                <Compass className="w-3 h-3 text-indigo-400" /> Surface Orientation
              </span>
              <span className="text-slate-200 font-medium text-[10px] truncate max-w-[120px]" title={selectedObject.surface_orientation}>
                {selectedObject.surface_orientation || "Vertical Plane"}
              </span>
            </div>

            {selectedObject.reflectivity !== undefined && (
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400">Reflectivity / Roughness</span>
                <span className="text-slate-200 font-mono">
                  {(selectedObject.reflectivity * 100).toFixed(0)}% / {(selectedObject.roughness! * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>

          {/* Granular Sub-components List */}
          {selectedObject.sub_components && selectedObject.sub_components.length > 0 && (
            <div className="glass-card p-2.5 rounded-lg space-y-1 text-xs">
              <span className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                <Box className="w-3 h-3 text-blue-400" /> Sub-Assemblies ({selectedObject.sub_components.length})
              </span>
              <ul className="space-y-0.5 pl-2 border-l border-slate-700">
                {selectedObject.sub_components.map((sub, i) => (
                  <li key={i} className="text-[10px] text-slate-300 truncate">
                    • {sub}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* AI Orchestrator Prompt Engine */}
        <div className="space-y-2.5 pt-2.5 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">AI Orchestrator Engine</h4>
          </div>

          <form onSubmit={handleOrchestrate} className="space-y-2.5">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`e.g., "Make this ${selectedObject.class} dark standing seam metal"`}
              rows={2}
              className="w-full bg-slate-900/90 border border-slate-700/60 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all resize-none"
            />

            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
            >
              {loading ? <span>Orchestrating...</span> : (
                <>
                  <span>Orchestrate Edit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="text-[10px] text-slate-500 text-center font-mono pt-2">
        Antigravity Model Telemetry Active
      </div>
    </aside>
  );
}
