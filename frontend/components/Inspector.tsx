"use client";

import React, { useState, useEffect } from "react";
import { SceneObject, OrchestratorResponse, SceneGraph } from "@/types/scene";
import { API_BASE } from "@/lib/api";
import {
  Sparkles, Layers, ArrowRight, Wand2, Edit3, Check, X, Brain, Trash2, Gauge,
  Compass, Palette, ChevronLeft, ChevronRight, SlidersHorizontal, Box, CheckCircle2,
  Clock, RotateCcw, History
} from "lucide-react";

interface InspectorProps {
  selectedObject: SceneObject | null;
  selectedObjectIds?: string[];
  sceneGraph?: SceneGraph | null;
  imageId: string;
  onOrchestratorSuccess: (response: OrchestratorResponse) => void;
  onClassUpdated?: (updatedObject: SceneObject) => void;
  onObjectDeleted?: (deletedObjectId: string) => void;
  onOrchestrateStart?: (prompt: string) => void;
  onOrchestrateEnd?: () => void;
  showToast?: (message: string, title?: string, type?: "info" | "success" | "ai") => void;
  width?: number;
}

export default function Inspector({
  selectedObject,
  selectedObjectIds = [],
  sceneGraph,
  imageId,
  onOrchestratorSuccess,
  onClassUpdated,
  onObjectDeleted,
  onOrchestrateStart,
  onOrchestrateEnd,
  showToast,
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

  // History tab states
  const [activeTab, setActiveTab] = useState<"details" | "history">("details");
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistory = async () => {
    if (!imageId) return;
    setLoadingHistory(true);
    try {
      const url = selectedObject && selectedObjectIds.length <= 1
        ? `${API_BASE}/api/v1/scene-graph/${imageId}/object/${selectedObject.id}/history`
        : `${API_BASE}/api/v1/scene-graph/${imageId}/history`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setHistoryItems(data);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history" && imageId) {
      fetchHistory();
    }
  }, [activeTab, imageId, selectedObject?.id]);

  const handleRestoreState = async (item: any) => {
    if (!item.image_url) return;
    try {
      if (showToast) showToast("Restoring project to this state...", "Time Machine", "ai");
      const res = await fetch(`${API_BASE}/api/v1/scene-graph/${imageId}/restore-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: item.image_url })
      });
      if (res.ok) {
        onOrchestratorSuccess({
          message: `Restored design to state: "${item.prompt}"`,
          updated_image_url: item.image_url
        });
        if (showToast) showToast("Design state restored successfully!", "Success", "success");
      }
    } catch (err) {
      console.error("Failed to restore history state:", err);
    }
  };

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
      const res = await fetch(`${API_BASE}/api/v1/object/update-class`, {
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
      const res = await fetch(`${API_BASE}/api/v1/object/${imageId}/${selectedObject.id}`, {
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
      const res = await fetch(`${API_BASE}/api/v1/orchestrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_id: imageId,
          target_id: selectedObjectIds.length === 1 ? selectedObjectIds[0] : (selectedObject ? selectedObject.id : null),
          target_ids: selectedObjectIds.length > 0 ? selectedObjectIds : (selectedObject ? [selectedObject.id] : []),
          prompt: textToUse.trim()
        })
      });
      const data: OrchestratorResponse = await res.json();
      onOrchestratorSuccess(data);
      setPrompt("");
      fetchHistory();
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
    { label: "Delete item", prompt: "delete" },
    { label: "Upgrade image (Upscale)", prompt: "upgrade image: make high quality" },
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

        {/* Submenu Tab Bar */}
        {imageId && (
          <div className="flex border-b border-[#E2E8F0] shrink-0 bg-slate-50/50 p-1">
            <button
              onClick={() => setActiveTab("details")}
              className={`flex-1 py-1.5 text-center text-[10px] uppercase font-bold tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "details"
                  ? "bg-white text-[#4F46E5] shadow-sm border border-[#E2E8F0] font-bold"
                  : "text-[#64748B] hover:text-[#0F172A] font-medium"
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Details</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-1.5 text-center text-[10px] uppercase font-bold tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "history"
                  ? "bg-white text-[#4F46E5] shadow-sm border border-[#E2E8F0] font-bold"
                  : "text-[#64748B] hover:text-[#0F172A] font-medium"
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>History</span>
            </button>
          </div>
        )}

        {activeTab === "history" && imageId ? (
          <div className="flex-1 p-3.5 space-y-4 overflow-y-auto flex flex-col justify-between custom-scrollbar bg-slate-50/20">
            <div className="flex-1 flex flex-col space-y-4">
              <div className="flex items-center gap-1.5 text-[#0F172A] font-bold text-xs font-sans border-b border-[#E2E8F0] pb-2">
                <Clock className="w-3.5 h-3.5 text-[#4F46E5]" />
                <span>Design Prompt History</span>
              </div>

              {loadingHistory ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-2 py-10">
                  <RotateCcw className="w-5 h-5 text-[#4F46E5] animate-spin" />
                  <span className="text-[10px] text-[#64748B] font-mono">Loading history...</span>
                </div>
              ) : historyItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2 py-10">
                  <History className="w-8 h-8 text-[#94A3B8] mb-1" />
                  <h4 className="text-[11px] font-bold text-[#475569] uppercase tracking-wide">No history yet</h4>
                  <p className="text-[10px] text-[#64748B] max-w-[180px] leading-relaxed">
                    Prompts and material changes you apply to this design will show up here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyItems.map((item) => {
                    const targetObj = sceneGraph?.objects.find(o => o.id === item.target_id);
                    const targetLabel = item.target_id === "all_image" ? "Entire Room" : (targetObj?.class || "Object");
                    const dateStr = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div key={item.id} className="bg-white border border-[#E2E8F0] rounded-xl p-3 space-y-2 shadow-sm hover:shadow-md transition-shadow relative group">
                        <div className="flex items-start justify-between">
                          <div className="space-y-0.5 max-w-[80%]">
                            <span className="text-[9px] font-mono text-[#4F46E5] bg-[#4F46E5]/10 px-1.5 py-0.5 rounded-full font-bold uppercase">
                              {targetLabel}
                            </span>
                            <p className="text-[10px] font-medium text-[#0F172A] leading-snug pt-1">
                              "{item.prompt}"
                            </p>
                          </div>
                          <span className="text-[9px] font-mono text-[#94A3B8] pt-0.5">{dateStr}</span>
                        </div>

                        {item.image_url && (
                          <div className="relative rounded-lg overflow-hidden border border-[#E2E8F0] aspect-[16/10] bg-slate-50">
                            <img
                              src={item.image_url}
                              alt={item.prompt}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => handleRestoreState(item)}
                              className="absolute inset-0 bg-[#0F172A]/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold gap-1 transition-opacity duration-200"
                              title="Restore design to this state"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restore State</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <React.Fragment>
            {!selectedObject || selectedObjectIds.length > 1 ? (
              <div className="flex-1 p-3.5 space-y-4 overflow-y-auto flex flex-col justify-between custom-scrollbar">
                {!imageId ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 py-10">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#4F46E5] shadow-sm">
                      <Box className="w-6 h-6" />
                    </div>
                    <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wide">
                      No project open
                    </h3>
                    <p className="text-[11px] text-[#64748B] max-w-[180px] leading-relaxed font-sans">
                      Upload a photo or open a saved project to inspect items.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 flex-1 flex flex-col">
                    {/* Header info */}
                    <div className="bg-slate-50 border border-[#E2E8F0] p-4 rounded-2xl space-y-1.5 shadow-inner">
                      <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wide flex items-center gap-1.5 font-sans">
                        <Layers className="w-3.5 h-3.5 text-[#4F46E5]" />
                        {selectedObjectIds.length > 1 ? "Batch AI Edit" : "Global AI Edit"}
                      </h3>
                      <p className="text-[10px] text-[#64748B] leading-relaxed font-sans">
                        {selectedObjectIds.length > 1
                          ? `You have selected ${selectedObjectIds.length} items. Your AI edit will apply to all selected objects.`
                          : "No items selected. Your AI edit will apply to the entire design image."}
                      </p>
                    </div>

                    {/* AI editor */}
                    <div className="space-y-2 pt-2 flex-1 flex flex-col">
                      <div className="flex items-center gap-1.5 text-[#0F172A] font-bold text-xs font-sans">
                        <Sparkles className="w-3.5 h-3.5 text-[#4F46E5] animate-pulse" />
                        <span>{selectedObjectIds.length > 1 ? "Batch prompt" : "Global prompt"}</span>
                      </div>

                      {selectedObjectIds.length <= 1 && (
                        <div className="space-y-1.5 mt-1">
                          <button
                            type="button"
                            onClick={() => setPrompt("upgrade image: make high quality")}
                            className="w-full px-2.5 py-2 hover:text-[#4F46E5] hover:border-[#4F46E5]/40 border border-[#E2E8F0] rounded-xl text-[11px] text-[#64748B] text-center transition-all duration-200 font-bold bg-slate-50/50 hover:bg-white shadow-sm active:scale-[0.97] flex items-center justify-center gap-1.5"
                          >
                            <Wand2 className="w-3.5 h-3.5 text-[#4F46E5]" /> ✨ Upgrade image: Make high quality (Upscale)
                          </button>
                        </div>
                      )}

                      <form onSubmit={handleOrchestrate} className="space-y-2 flex-1 flex flex-col justify-between">
                        <textarea
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder={
                            selectedObjectIds.length > 1
                              ? "Describe the changes for all selected items (e.g. Turn them to light beige)..."
                              : "Describe the changes to the entire room (e.g. Change walls to dark plaster)..."
                          }
                          rows={4}
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

                {/* 3D Scene Space Hierarchy (Phase 1) */}
                <div className="p-3 rounded-2xl bg-slate-50/50 border border-[#E2E8F0] text-xs space-y-2.5">
                  <div className="text-[#64748B] text-[10px] uppercase font-mono font-bold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#4F46E5]" /> 3D Scene Hierarchy
                  </div>
                  
                  <div className="flex flex-col space-y-1.5 font-sans">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#64748B]">Parent Layer:</span>
                      <span className="font-mono text-[#0F172A] font-medium">
                        {selectedObject.parent ? (
                          (() => {
                            const pObj = sceneGraph?.objects.find(o => o.id === selectedObject.parent);
                            return pObj ? `${pObj.class} (${selectedObject.parent.split("_").pop()})` : selectedObject.parent;
                          })()
                        ) : (
                          "None (Root)"
                        )}
                      </span>
                    </div>
                    
                    <div className="flex flex-col text-[11px] space-y-1">
                      <span className="text-[#64748B]">Sub-components:</span>
                      {selectedObject.sub_components && selectedObject.sub_components.length > 0 ? (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {selectedObject.sub_components.map((sub, i) => {
                            const sObj = sceneGraph?.objects.find(o => o.id === sub);
                            return (
                              <span key={i} className="text-[9px] font-mono font-bold bg-[#E2E8F0] text-[#0F172A] px-1.5 py-0.5 rounded-full">
                                {sObj ? sObj.class : sub.split("_").pop()}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-[#94A3B8] italic">No sub-assemblies</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Physical Specifications (Phase 1) */}
                <div className="p-3 rounded-2xl bg-white border border-[#E2E8F0] text-xs space-y-2">
                  <div className="text-[#64748B] text-[10px] uppercase font-mono font-bold flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#0EA5E9]" /> Spatial Specs
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 font-mono text-[10px] text-[#0F172A]">
                    <div className="flex flex-col">
                      <span className="text-[#64748B] text-[9px] font-sans uppercase font-bold">Orientation</span>
                      <span className="truncate">{selectedObject.surface_orientation || "N/A"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#64748B] text-[9px] font-sans uppercase font-bold">Reflectivity</span>
                      <span>{selectedObject.reflectivity ?? 0.2}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#64748B] text-[9px] font-sans uppercase font-bold">Roughness</span>
                      <span>{selectedObject.roughness ?? 0.5}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#64748B] text-[9px] font-sans uppercase font-bold">Normal Vec</span>
                      <span className="truncate">
                        {selectedObject.normal_vector 
                          ? `[${selectedObject.normal_vector.nx.toFixed(1)}, ${selectedObject.normal_vector.ny.toFixed(1)}, ${selectedObject.normal_vector.nz.toFixed(1)}]`
                          : "N/A"
                        }
                      </span>
                    </div>
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
          </React.Fragment>
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
