"use client";

import React, { useState, useEffect } from "react";
import { SceneObject, OrchestratorResponse } from "@/types/scene";
import {
  Sparkles, Layers, ArrowRight, Wand2, Edit3, Check, X, Brain, Trash2, Gauge,
  Compass, Palette, ChevronLeft, ChevronRight, SlidersHorizontal, Box, CheckCircle2
} from "lucide-react";

interface InspectorProps {
  selectedObject: SceneObject | null;
  imageId: string;
  onOrchestratorSuccess: (response: OrchestratorResponse) => void;
  onClassUpdated?: (updatedObject: SceneObject) => void;
  onObjectDeleted?: (deletedObjectId: string) => void;
  onOrchestrateStart?: (prompt: string) => void;
  onOrchestrateEnd?: () => void;
  width?: number;
}

export default function Inspector({
  selectedObject,
  imageId,
  onOrchestratorSuccess,
  onClassUpdated,
  onObjectDeleted,
  onOrchestrateStart,
  onOrchestrateEnd,
  width = 280
}: InspectorProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  // Active Learning Class Edit State
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [isSavingClass, setIsSavingClass] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (selectedObject) {
      setNewClassName(selectedObject.class);
      setIsEditingClass(false);
    }
  }, [selectedObject?.id, selectedObject?.class]);

  if (collapsed) {
    return (
      <aside className="w-11 h-full bg-[#0b0c10]/95 border-l border-slate-800/80 flex flex-col items-center py-4 justify-between transition-all select-none backdrop-blur-xl shrink-0 z-20 shadow-xl">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 rounded-xl transition-all shadow-sm"
          title="Expand Inspector Panel"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex flex-col items-center space-y-3 font-mono text-[11px] text-slate-400 tracking-wider rotate-180 [writing-mode:vertical-lr]">
          <span className="font-semibold text-slate-300">INSPECTOR</span>
        </div>
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400/50" />
      </aside>
    );
  }

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedObject || !newClassName.trim() || newClassName.trim().toLowerCase() === selectedObject.class) {
      setIsEditingClass(false);
      return;
    }

    setIsSavingClass(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/object/update-class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_id: imageId,
          object_id: selectedObject.id,
          new_class: newClassName.trim()
        })
      });
      if (res.ok) {
        const data = await res.json();
        setIsEditingClass(false);
        if (onClassUpdated && data.updated_object) {
          onClassUpdated(data.updated_object);
        }
      }
    } catch (err) {
      console.error("Failed to update object class:", err);
    } finally {
      setIsSavingClass(false);
    }
  };

  const handleDeleteObject = async () => {
    if (!selectedObject) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/object/${imageId}/${selectedObject.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        if (onObjectDeleted) {
          onObjectDeleted(selectedObject.id);
        }
      }
    } catch (err) {
      console.error("Failed to delete object:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOrchestrateWithText = async (textToUse: string) => {
    if (!selectedObject || !textToUse.trim()) return;

    setLoading(true);
    if (onOrchestrateStart) onOrchestrateStart(textToUse.trim());
    try {
      const res = await fetch("http://localhost:8000/api/v1/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_id: imageId,
          target_id: selectedObject.id,
          prompt: textToUse.trim()
        })
      });
      const data: OrchestratorResponse = await res.json();
      onOrchestratorSuccess(data);
      setPrompt("");
    } catch (err) {
      console.error("Orchestrator execution error:", err);
    } finally {
      setLoading(false);
      if (onOrchestrateEnd) onOrchestrateEnd();
    }
  };

  const handleOrchestrate = (e: React.FormEvent) => {
    e.preventDefault();
    handleOrchestrateWithText(prompt);
  };

  const presetMaterials = selectedObject ? [
    { label: "Walnut Wood", prompt: `Replace ${selectedObject.class} with natural walnut wood` },
    { label: "Brass Metal", prompt: `Change ${selectedObject.class} to brushed brass metal` },
    { label: "Bouclé Fabric", prompt: `Upholster ${selectedObject.class} in cream bouclé fabric` },
    { label: "Cognac Leather", prompt: `Replace ${selectedObject.class} with cognac leather` }
  ] : [];

  return (
    <aside style={{ width }} className="h-full bg-[#0b0c10]/95 border-l border-slate-800/80 flex flex-col justify-between select-none backdrop-blur-xl shrink-0 transition-none shadow-xl z-20">
      <div className="flex flex-col h-full overflow-hidden">
        
        {/* Panel Header - Styled 1-to-1 with LayersSidebar */}
        <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-950/40">
          <div className="flex items-center space-x-2.5">
            <span className="text-xs font-bold tracking-tight text-slate-100 uppercase">Inspector</span>
            {selectedObject && (
              <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800/60 font-semibold shadow-sm truncate max-w-[120px]">
                {selectedObject.class.toUpperCase()}
              </span>
            )}
          </div>
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded-lg transition-all"
            title="Collapse Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {!selectedObject ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 shadow-inner">
              <Box className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">No Element Selected</h3>
            <p className="text-[11px] text-slate-400 max-w-[180px] leading-relaxed font-sans">
              Select an element in scene layers or click on the viewport to inspect parameters.
            </p>
          </div>
        ) : (
          <div className="p-3.5 space-y-3.5 overflow-y-auto flex-1 custom-scrollbar">
            
            {/* Interactive Class Card */}
            <div className="bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/80 p-3 rounded-xl shadow-sm space-y-2.5 transition-all">
              <div className="flex items-center justify-between">
                {isEditingClass ? (
                  <form onSubmit={handleSaveClass} className="flex items-center space-x-1.5 flex-1 mr-2">
                    <input
                      type="text"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      className="bg-slate-950 border border-cyan-500 rounded-lg px-2 py-1 text-xs text-cyan-200 font-mono focus:outline-none w-full shadow-sm"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={isSavingClass}
                      className="p-1 text-emerald-400 hover:bg-slate-800 rounded-lg"
                      title="Save & Train Class"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingClass(false)}
                      className="p-1 text-slate-400 hover:bg-slate-800 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center space-x-2 truncate">
                    <span className="text-xs font-mono font-bold uppercase tracking-tight text-slate-100 truncate">
                      {selectedObject.class}
                    </span>
                    <button
                      onClick={() => {
                        setNewClassName(selectedObject.class);
                        setIsEditingClass(true);
                      }}
                      className="p-1 text-slate-400 hover:text-cyan-300 transition-colors rounded-lg hover:bg-slate-800/60"
                      title="Edit class name"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center space-x-1.5 shrink-0 ml-1">
                  <button
                    onClick={handleDeleteObject}
                    disabled={isDeleting}
                    className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-950/60 rounded-lg transition-all"
                    title="Delete object"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                <div className="flex items-center space-x-2 truncate">
                  {selectedObject.color_hex && (
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0 shadow-sm"
                      style={{ backgroundColor: selectedObject.color_hex }}
                    />
                  )}
                  <span className="font-medium text-slate-200 truncate">{selectedObject.material}</span>
                </div>
                <div className="flex items-center text-[10px] text-cyan-300 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40" title="Active Learning Sync">
                  <Brain className="w-3 h-3 text-cyan-400 mr-1 animate-pulse" /> Learned
                </div>
              </div>
            </div>

            {/* Metrics Dashboard Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60 flex flex-col justify-between shadow-sm">
                <div className="text-slate-400 text-[10px] uppercase font-mono font-semibold flex items-center gap-1.5 mb-1">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Conf.
                </div>
                <span className="font-mono text-cyan-300 font-bold text-xs">
                  {(selectedObject.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60 flex flex-col justify-between shadow-sm">
                <div className="text-slate-400 text-[10px] uppercase font-mono font-semibold flex items-center gap-1.5 mb-1">
                  <Compass className="w-3.5 h-3.5 text-emerald-400" /> Depth
                </div>
                <span className="font-mono text-emerald-300 font-bold text-xs">
                  {selectedObject.depth}m
                </span>
              </div>
            </div>

            {/* Material Presets */}
            <div className="space-y-2 pt-2 border-t border-slate-800/60">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-cyan-400" /> Style Presets
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {presetMaterials.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(preset.prompt)}
                    className="px-2.5 py-1.5 bg-slate-900/60 hover:bg-cyan-950/60 hover:text-cyan-200 hover:border-cyan-500/50 border border-slate-800 rounded-xl text-[11px] text-slate-300 text-left transition-all truncate font-medium shadow-sm active:scale-95"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Synthesis Editor */}
            <div className="space-y-2 pt-2 border-t border-slate-800/60">
              <div className="flex items-center gap-1.5 text-slate-200 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>AI Synthesis Edit</span>
              </div>

              <form onSubmit={handleOrchestrate} className="space-y-2">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={`Replace ${selectedObject.class} with dark velvet...`}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all resize-none font-sans leading-relaxed shadow-inner"
                />

                <button
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 active:scale-95"
                >
                  {loading ? <span>Synthesizing...</span> : (
                    <>
                      <span>Apply AI Edit</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>

          </div>
        )}
      </div>

      {/* Footer Status Bar - Styled 1-to-1 with LayersSidebar */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-[11px] text-slate-300 flex items-center justify-between font-mono shrink-0">
        <span className="flex items-center gap-1.5 font-semibold text-slate-200">
          <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
          Inspector
        </span>
        <span className="text-[10px] text-slate-400 font-sans">Active Studio</span>
      </div>
    </aside>
  );
}
