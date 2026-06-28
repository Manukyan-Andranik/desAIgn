"use client";

import React, { useState, useEffect } from "react";
import { SceneObject, OrchestratorResponse } from "@/types/scene";
import { Sparkles, Layers, ArrowRight, Wand2, Edit3, Check, X, Brain, Trash2 } from "lucide-react";

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
      <aside style={{ width }} className="h-full bg-[#0c0e14]/90 border-l border-slate-800/80 p-6 flex flex-col items-center justify-center text-center select-none backdrop-blur-md shrink-0 transition-none">
        <div className="w-12 h-12 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-center mb-3 text-slate-400">
          <Layers className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-xs font-semibold text-slate-300">No Element Selected</h3>
        <p className="text-[11px] text-slate-500 mt-1.5 max-w-[180px]">
          Select an object on the canvas to inspect surface parameters, train object classes, or orchestrate edits.
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
    <aside style={{ width }} className="h-full bg-[#0c0e14]/90 border-l border-slate-800/80 p-4.5 flex flex-col justify-between overflow-y-auto select-none backdrop-blur-md shrink-0 transition-none">
      <div className="space-y-4">
        {/* Interactive Object Class Header with Active Learning Controls & Delete Button */}
        <div>
          <div className="flex items-center justify-between">
            {isEditingClass ? (
              <form onSubmit={handleSaveClass} className="flex items-center space-x-1.5 flex-1 mr-2">
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="bg-slate-900 border border-cyan-500 rounded px-2 py-0.5 text-xs text-cyan-300 font-mono focus:outline-none w-full"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isSavingClass}
                  className="p-1 text-emerald-400 hover:bg-slate-800 rounded"
                  title="Save & Train Class"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingClass(false)}
                  className="p-1 text-slate-400 hover:bg-slate-800 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <div className="flex items-center space-x-1.5 group">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50 font-medium">
                  {selectedObject.class}
                </span>
                <button
                  onClick={() => {
                    setNewClassName(selectedObject.class);
                    setIsEditingClass(true);
                  }}
                  className="p-1 text-slate-500 hover:text-cyan-300 transition-colors rounded hover:bg-slate-800/60"
                  title="Edit class name (Model learns from your feedback)"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="flex items-center space-x-1.5 shrink-0">
              <span className="text-[10px] font-mono text-slate-500">
                {selectedObject.id}
              </span>
              <button
                onClick={handleDeleteObject}
                disabled={isDeleting}
                className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded transition-all"
                title="Delete object from scene graph"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2.5">
            <div className="flex items-center space-x-2.5 truncate">
              {selectedObject.color_hex && (
                <div
                  className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                  style={{ backgroundColor: selectedObject.color_hex }}
                />
              )}
              <h2 className="text-xs font-semibold text-slate-100 truncate">
                {selectedObject.material}
              </h2>
            </div>
            <div className="flex items-center text-[10px] text-slate-500 font-mono" title="Active Learning Engine Sync">
              <Brain className="w-3 h-3 text-cyan-400 mr-1" /> Learned
            </div>
          </div>
        </div>

        {/* Specs */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <div className="text-slate-500 text-[10px] mb-0.5">Confidence</div>
            <span className="font-mono text-slate-200 font-medium text-xs">
              {(selectedObject.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <div className="text-slate-500 text-[10px] mb-0.5">Metric Depth</div>
            <span className="font-mono text-slate-200 font-medium text-xs">
              {selectedObject.depth}m
            </span>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-medium flex items-center gap-1">
            <Wand2 className="w-3 h-3 text-cyan-400" /> Presets
          </span>
          <div className="grid grid-cols-2 gap-1">
            {presetMaterials.map((preset, i) => (
              <button
                key={i}
                onClick={() => setPrompt(preset.prompt)}
                className="px-2 py-1 bg-slate-800/40 hover:bg-cyan-950/60 hover:text-cyan-300 border border-slate-700/40 rounded text-[10px] text-slate-300 text-left transition-all truncate font-mono"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI Orchestrator Form */}
        <div className="space-y-2 pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium text-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>AI Edit Instruction</span>
          </div>

          <form onSubmit={handleOrchestrate} className="space-y-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`e.g. "Make this ${selectedObject.class} dark walnut"`}
              rows={2}
              className="w-full bg-slate-900/80 border border-slate-700/60 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all resize-none font-sans"
            />

            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              {loading ? <span>Processing...</span> : (
                <>
                  <span>Apply Edit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
