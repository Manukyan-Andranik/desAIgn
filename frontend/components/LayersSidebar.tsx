"use client";

import React, { useState } from "react";
import { SceneGraph } from "@/types/scene";
import {
  Box, CheckCircle2, Search, ChevronLeft, ChevronRight, Trash2, GitMerge,
  Armchair, Tv, Lamp, DoorOpen, Maximize2, Sparkles, Home, Palette, Shield
} from "lucide-react";

interface LayersSidebarProps {
  sceneGraph: SceneGraph | null;
  selectedObjectId: string | null;
  selectedObjectIds: string[];
  onSelectObject: (id: string) => void;
  onToggleSelectObject: (id: string, isMulti: boolean) => void;
  onMergeObjects?: () => void;
  onDeleteObject?: (id: string) => void;
  width?: number;
}

export default function LayersSidebar({
  sceneGraph,
  selectedObjectId,
  selectedObjectIds,
  onSelectObject,
  onToggleSelectObject,
  onMergeObjects,
  onDeleteObject,
  width = 250
}: LayersSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const objectCount = sceneGraph?.objects.length ?? 0;

  if (collapsed) {
    return (
      <aside className="w-11 h-full bg-white border-r border-[#E2E8F0] flex flex-col items-center py-4 justify-between transition-all select-none shrink-0 z-20 shadow-sm">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 text-[#64748B] hover:text-[#4F46E5] hover:bg-slate-100 rounded-xl transition-all shadow-inner"
          title="Expand layers"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="flex flex-col items-center space-y-3 font-mono text-[11px] text-[#64748B] tracking-wider rotate-180 [writing-mode:vertical-lr]">
          <span className="font-semibold text-[#64748B]">LAYERS ({objectCount})</span>
        </div>
        <div className="w-2 h-2 rounded-full bg-[#4F46E5] animate-pulse shadow-sm shadow-[#4F46E5]/50" />
      </aside>
    );
  }

  const filteredObjects = (sceneGraph?.objects ?? []).filter((obj) => {
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "furniture" && obj.layer === "furniture") ||
      (activeTab === "decor" && obj.layer === "decor") ||
      (activeTab === "structural" && obj.layer === "structural");

    const matchesSearch =
      !searchQuery.trim() ||
      obj.class.toLowerCase().includes(searchQuery.toLowerCase()) ||
      obj.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const getCategoryIcon = (cls: string) => {
    const clean = cls.toLowerCase();
    if (clean.includes("chair") || clean.includes("sofa") || clean.includes("armchair") || clean.includes("bench")) return <Armchair className="w-3.5 h-3.5" />;
    if (clean.includes("television") || clean.includes("screen") || clean.includes("tv") || clean.includes("monitor")) return <Tv className="w-3.5 h-3.5" />;
    if (clean.includes("lamp") || clean.includes("light") || clean.includes("chandelier") || clean.includes("sconce")) return <Lamp className="w-3.5 h-3.5" />;
    if (clean.includes("door") || clean.includes("entry")) return <DoorOpen className="w-3.5 h-3.5" />;
    if (clean.includes("window") || clean.includes("glass")) return <Maximize2 className="w-3.5 h-3.5" />;
    return <Box className="w-3.5 h-3.5" />;
  };

  return (
    <aside style={{ width }} className="h-full bg-white border-r border-[#E2E8F0] flex flex-col justify-between select-none shrink-0 transition-none shadow-sm z-20">
      <div className="flex flex-col h-full overflow-hidden">
        
        {/* Panel Header */}
        <div className="p-3.5 border-b border-[#E2E8F0] flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <span className="text-xs font-bold tracking-tight text-[#0F172A] uppercase font-sans">Layers</span>
            <span className="text-[11px] font-mono text-[#4F46E5] bg-[#4F46E5]/10 px-2 py-0.5 rounded-full font-bold">
              {objectCount}
            </span>
          </div>
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 rounded-lg transition-all"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Multi-Selection Combine Action Banner */}
        {selectedObjectIds.length >= 2 && onMergeObjects && (
          <div className="p-3 bg-[#4F46E5] text-white border-b border-[#E2E8F0] flex items-center justify-between animate-fade-in shrink-0 shadow-md">
            <span className="text-xs font-mono font-bold flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-white animate-bounce" />
              <span>{selectedObjectIds.length} Selected</span>
            </span>
            <button
              onClick={onMergeObjects}
              className="px-3.5 py-1.5 bg-white text-[#4F46E5] hover:bg-slate-50 font-bold rounded-lg text-xs transition-all shadow-sm flex items-center gap-1.5 active:scale-95 border-0"
            >
              <span>Combine</span>
            </button>
          </div>
        )}

        {/* Search Input Bar */}
        <div className="p-2.5 shrink-0 bg-slate-50/30">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search layers..."
              className="w-full bg-white border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#0F172A] placeholder-[#64748B]/50 focus:outline-none transition-all font-sans"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="px-2.5 py-1.5 flex gap-1 text-[11px] font-medium shrink-0 border-b border-[#E2E8F0] bg-slate-50/30">
          {[
            { id: "all", label: "All" },
            { id: "furniture", label: "Furniture" },
            { id: "decor", label: "Decor" },
            { id: "structural", label: "Structure" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1 rounded-lg transition-all border ${
                activeTab === tab.id
                  ? "bg-[#4F46E5] text-white border-0 font-bold shadow-sm shadow-[#4F46E5]/15"
                  : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 border-transparent font-mono"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* High-Legibility Object Card List */}
        <div className="p-2.5 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar">
          {filteredObjects.length === 0 ? (
            <div className="text-center py-8 px-4 text-xs text-[#64748B] font-sans space-y-2">
              {!sceneGraph ? (
                <>
                  <p className="font-semibold text-[#0F172A]">No layers yet</p>
                  <p className="leading-relaxed">Upload a room photo to detect furniture and decor.</p>
                </>
              ) : (
                <p className="font-mono">No items found</p>
              )}
            </div>
          ) : (
            filteredObjects.map((obj) => {
              const isChecked = selectedObjectIds.includes(obj.id);
              const isPrimarySelected = selectedObjectId === obj.id;
              const isHighlighted = isChecked || isPrimarySelected;

              return (
                <div
                  key={obj.id}
                  onClick={(e) => {
                    if (e.shiftKey || e.metaKey || e.ctrlKey) {
                      onToggleSelectObject(obj.id, true);
                    } else {
                      onSelectObject(obj.id);
                    }
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between text-xs transition-all cursor-pointer group/item border ${
                    isHighlighted
                      ? "bg-[#4F46E5]/10 border-[#4F46E5]/20 text-[#4F46E5] font-semibold"
                      : "bg-white text-[#0F172A] hover:bg-slate-50 border-[#E2E8F0] shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        e.stopPropagation();
                        onToggleSelectObject(obj.id, true);
                      }}
                      className="w-4 h-4 rounded border-[#E2E8F0] bg-white text-[#4F46E5] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#4F46E5] shrink-0"
                    />
                    <div className={`${isHighlighted ? "text-[#4F46E5]" : "text-[#64748B] group-hover/item:text-[#4F46E5]"} shrink-0 transition-colors`}>
                      {getCategoryIcon(obj.class)}
                    </div>
                    <span className="truncate font-sans tracking-tight text-xs font-semibold text-[#0F172A]">
                      {obj.class.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 ml-1">
                    {onDeleteObject && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteObject(obj.id);
                        }}
                        className="opacity-0 group-hover/item:opacity-100 p-1 text-[#64748B] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                      obj.confidence >= 0.7 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100 font-bold" 
                        : "bg-slate-50 text-[#64748B] border-slate-100 font-medium"
                    }`}>
                      {(obj.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Status Bar */}
      <div className="p-3 border-t border-[#E2E8F0] bg-slate-50/50 text-[11px] text-[#64748B] flex items-center justify-between font-mono shrink-0">
        <span className="flex items-center gap-1.5 font-semibold text-[#0F172A]">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          Ready
        </span>
        <span className="text-[10px] text-[#64748B] font-sans">Ready</span>
      </div>
    </aside>
  );
}
