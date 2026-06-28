"use client";

import React, { useState, useEffect } from "react";
import { SceneObject, OrchestratorResponse } from "@/types/scene";
import { Sparkles, Layers, ArrowRight, Wand2, Edit3, Check, X, Brain, Trash2, Gauge, Compass, Palette } from "lucide-react";

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

  if (!selectedObject) {
    return (
      <aside style={{ width }} className="h-full bg-[#0b0c10]/95 border-l border-slate-800/80 p-6 flex flex-col items-center justify-center text-center select-none backdrop-blur-xl shrink-0 transition-none shadow-xl z-20">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-cyan-400 shadow-inner">
          <Layers className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">No Object Selected</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-[200px] leading-relaxed font-sans">
          Select any element on the viewport canvas to inspect surface textures, train classes, or synthesize AI edits.
        </p>
      </aside>
    );
  }

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || newClassName.trim().toLowerCase() === selectedObject.class) {
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
    if (!textToUse.trim()) return;

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

  const presetMaterials = [
    { label: "Walnut Wood", prompt: `Replace ${selectedObject.class} with natural walnut wood` },
    { label: "Brass Metal", prompt: `Change ${selectedObject.class} to brushed brass metal` },
    { label: "Bouclé Fabric", prompt: `Upholster ${selectedObject.class} in cream bouclé fabric` },
    { label: "Cognac Leather", prompt: `Replace ${selectedObject.class} with cognac leather` }
  ];

  return (
    <aside style={{ width }} className="h-full bg-[#0b0c10]/95 border-l border-slate-800/80 p-4 flex flex-col justify-between overflow-y-auto select-none backdrop-blur-xl shrink-0 transition-none shadow-xl z-20">
      <div className="space-y-4">
        
        {/* Interactive Object Class Header */}
        <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/80 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            {isEditingClass ? (
              <form onSubmit={handleSaveClass} className="flex items-center space-x-1.5 flex-1 mr-2">
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="bg-slate-950 border border-cyan-400 rounded-lg px-2.5 py-1 text-xs text-cyan-200 font-mono focus:outline-none w-full shadow-sm"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isSavingClass}
                  className="p-1.5 text-emerald-400 hover:bg-slate-800 rounded-lg transition-all"
                  title="Save & Train Class"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingClass(false)}
                  className="p-1.5 text-slate-400 hover:bg-slate-800 rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="flex items-center space-x-2 group">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-800/60 shadow-sm">
                  {selectedObject.class}
                </span>
                <button
                  onClick={() => {
                    setNewClassName(selectedObject.class);
                    setIsEditingClass(true);
                  }}
                  className="p-1 text-slate-400 hover:text-cyan-300 transition-colors rounded-lg hover:bg-slate-800/60"
                  title="Edit object name"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-[10px] font-mono text-slate-400 font-medium">
                {selectedObject.id.split('_').slice(-2).join('_')}
              </span>
              <button
                onClick={handleDeleteObject}
                disabled={isDeleting}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/60 rounded-lg transition-all"
                title="Delete object"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
            <div className="flex items-center space-x-2.5 truncate">
              {selectedObject.color_hex && (
                <div
                  className="w-4 h-4 rounded-full border border-white/30 shrink-0 shadow-sm"
                  style={{ backgroundColor: selectedObject.color_hex }}
                />
              )}
              <h2 className="text-xs font-semibold text-slate-100 truncate">
                {selectedObject.material}
              </h2>
            </div>
            <div className="flex items-center text-[10px] text-cyan-300 font-mono font-medium bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40" title="Active Learning Engine Sync">
              <Brain className="w-3 h-3 text-cyan-400 mr-1 animate-pulse" /> Learned
            </div>
          </div>
        </div>

        {/* High-Legibility Metrics Dashboard Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 flex flex-col justify-between shadow-sm">
            <div className="text-slate-400 text-[10px] uppercase font-mono tracking-wider font-semibold flex items-center gap-1.5 mb-1">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Confidence
            </div>
            <span className="font-mono text-cyan-300 font-bold text-sm">
              {(selectedObject.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 flex flex-col justify-between shadow-sm">
            <div className="text-slate-400 text-[10px] uppercase font-mono tracking-wider font-semibold flex items-center gap-1.5 mb-1">
              <Compass className="w-3.5 h-3.5 text-emerald-400" /> Metric Depth
            </div>
            <span className="font-mono text-emerald-300 font-bold text-sm">
              {selectedObject.depth}m
            </span>
          </div>
        </div>

        {/* Quick Style & Texture Presets */}
        <div className="space-y-2 pt-3 border-t border-slate-800/80">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5 text-cyan-400" /> Material Presets
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

        {/* AI Synthesis Instruction Editor */}
        <div className="space-y-2.5 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-100 font-bold text-xs">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>AI Edit Synthesis</span>
          </div>

          <form onSubmit={handleOrchestrate} className="space-y-2.5">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`e.g. "Replace this ${selectedObject.class} with dark emerald velvet"`}
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all resize-none font-sans leading-relaxed shadow-inner"
            />

            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/25 active:scale-95"
            >
              {loading ? <span>Synthesizing...</span> : (
                <>
                  <span>Apply Generative Edit</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </aside>
  );
}
