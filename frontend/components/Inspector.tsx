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
      <aside className="w-11 h-full bg-white border-l border-[#E2E8F0] flex flex-col items-center py-4 justify-between transition-all select-none shrink-0 z-20 shadow-sm">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 text-[#64748B] hover:text-[#4F46E5] hover:bg-slate-100 rounded-xl transition-all shadow-inner"
          title="Expand panel"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex flex-col items-center space-y-3 font-mono text-[11px] text-[#64748B] tracking-wider rotate-180 [writing-mode:vertical-lr]">
          <span className="font-semibold text-[#64748B]">INSPECTOR</span>
        </div>
        <div className="w-2 h-2 rounded-full bg-[#4F46E5] animate-pulse shadow-sm shadow-[#4F46E5]/50" />
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
    <aside style={{ width }} className="h-full bg-white border-l border-[#E2E8F0] flex flex-col justify-between select-none shrink-0 transition-none shadow-sm z-20">
      <div className="flex flex-col h-full overflow-hidden">
        
        {/* Panel Header - Styled 1-to-1 with LayersSidebar */}
        <div className="p-3.5 border-b border-[#E2E8F0] flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <span className="text-xs font-bold tracking-tight text-[#0F172A] uppercase font-sans">Inspector</span>
            {selectedObject && (
              <span className="text-[11px] font-mono text-[#4F46E5] bg-[#4F46E5]/10 px-2 py-0.5 rounded-full font-bold truncate max-w-[120px]">
                {selectedObject.class.toUpperCase()}
              </span>
            )}
          </div>
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 rounded-lg transition-all"
            title="Collapse Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {!selectedObject ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#4F46E5] shadow-sm">
              <Box className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wide">
              {!imageId ? "No project open" : "Nothing selected"}
            </h3>
            <p className="text-[11px] text-[#64748B] max-w-[180px] leading-relaxed font-sans">
              {!imageId
                ? "Upload a photo or open a saved project to inspect items."
                : "Select an item in the layers list or click it on the image."}
            </p>
          </div>
        ) : (
          <div className="p-3.5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
            
            {/* Interactive Class Card */}
            <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-sm space-y-3 transition-all hover:border-[#4F46E5]/50">
              <div className="flex items-center justify-between">
                {isEditingClass ? (
                  <form onSubmit={handleSaveClass} className="flex items-center space-x-1.5 flex-1 mr-2">
                    <input
                      type="text"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      className="bg-white border border-[#4F46E5] rounded-xl px-2 py-1 text-xs text-[#0F172A] font-mono focus:outline-none w-full shadow-inner"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={isSavingClass}
                      className="p-1 text-emerald-600 hover:bg-slate-100 rounded-lg"
                      title="Save name"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingClass(false)}
                      className="p-1 text-[#64748B] hover:bg-slate-100 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center space-x-2 truncate">
                    <span className="text-xs font-mono font-bold uppercase tracking-tight text-[#0F172A] truncate">
                      {selectedObject.class}
                    </span>
                    <button
                      onClick={() => {
                        setNewClassName(selectedObject.class);
                        setIsEditingClass(true);
                      }}
                      className="p-1 text-[#64748B] hover:text-[#4F46E5] transition-colors rounded-lg hover:bg-slate-100"
                      title="Rename"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center space-x-1.5 shrink-0 ml-1">
                  <button
                    onClick={handleDeleteObject}
                    disabled={isDeleting}
                    className="p-1 text-[#64748B] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-[#E2E8F0] text-xs">
                <div className="flex items-center space-x-2 truncate">
                  {selectedObject.color_hex && (
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-[#E2E8F0] shrink-0 shadow-sm"
                      style={{ backgroundColor: selectedObject.color_hex }}
                    />
                  )}
                  <span className="font-medium text-[#0F172A] truncate">{selectedObject.material}</span>
                </div>
                <div className="flex items-center text-[10px] font-mono bg-[#4F46E5]/10 text-[#4F46E5] border border-[#E2E8F0] px-2 py-0.5 rounded" title="Remembered">
                  <Brain className="w-3 h-3 text-[#4F46E5] mr-1 animate-pulse" /> Saved
                </div>
              </div>
            </div>

            {/* Metrics Dashboard Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-sans">
              <div className="p-3 rounded-2xl bg-white border border-[#E2E8F0] flex flex-col justify-between shadow-sm">
                <div className="text-[#64748B] text-[10px] uppercase font-mono font-bold flex items-center gap-1.5 mb-1">
                  <Gauge className="w-3.5 h-3.5 text-[#4F46E5]" /> Match
                </div>
                <span className="font-mono text-[#4F46E5] font-black text-xs">
                  {(selectedObject.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-[#E2E8F0] flex flex-col justify-between shadow-sm">
                <div className="text-[#64748B] text-[10px] uppercase font-mono font-bold flex items-center gap-1.5 mb-1">
                  <Compass className="w-3.5 h-3.5 text-[#0EA5E9]" /> Depth
                </div>
                <span className="font-mono text-[#0EA5E9] font-black text-xs">
                  {selectedObject.depth}m
                </span>
              </div>
            </div>

            {/* Material Presets */}
            <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-[#4F46E5]" /> Quick styles
              </span>
              <div className="grid grid-cols-2 gap-2">
                {presetMaterials.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(preset.prompt)}
                    className="px-2.5 py-1.5 bg-white hover:text-[#4F46E5] hover:border-[#4F46E5]/40 border border-[#E2E8F0] rounded-xl text-[11px] text-[#64748B] text-left transition-all duration-200 truncate font-medium shadow-sm active:scale-[0.97]"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI editor */}
            <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
              <div className="flex items-center gap-1.5 text-[#0F172A] font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#4F46E5] animate-pulse" />
                <span>AI edit</span>
              </div>

              <form onSubmit={handleOrchestrate} className="space-y-2">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={`Replace ${selectedObject.class} with dark velvet...`}
                  rows={2}
                  className="w-full bg-white border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]/30 rounded-xl p-2.5 text-xs text-[#0F172A] placeholder-[#64748B]/50 focus:outline-none transition-all duration-200 resize-none font-sans leading-relaxed shadow-inner"
                />

                <button
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  className="w-full py-2.5 px-3 bg-[#4F46E5] hover:bg-[#6366F1] disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all duration-200 shadow-md shadow-[#4F46E5]/15 active:scale-[0.97] border-0"
                >
                  {loading ? <span>Applying...</span> : (
                    <>
                      <span>Apply AI edit</span>
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
      <div className="p-3 border-t border-[#E2E8F0] bg-slate-50/50 text-[11px] text-[#64748B] flex items-center justify-between font-mono shrink-0">
        <span className="flex items-center gap-1.5 font-semibold text-[#0F172A]">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#4F46E5]" />
          Inspector
        </span>
        <span className="text-[10px] text-[#64748B] font-sans">Ready</span>
      </div>
    </aside>
  );
}
