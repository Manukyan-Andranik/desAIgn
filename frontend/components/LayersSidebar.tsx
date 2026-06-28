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

  if (!sceneGraph) return null;

  if (collapsed) {
    return (
      <aside className="w-11 h-full bg-[#0b0c10]/95 border-r border-slate-800/80 flex flex-col items-center py-4 justify-between transition-all select-none backdrop-blur-xl shrink-0 z-20 shadow-xl">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 rounded-xl transition-all shadow-sm"
          title="Expand Scene Layers"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="flex flex-col items-center space-y-3 font-mono text-[11px] text-slate-400 tracking-wider rotate-180 [writing-mode:vertical-lr]">
          <span className="font-semibold text-slate-300">LAYERS ({sceneGraph.objects.length})</span>
        </div>
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400/50" />
      </aside>
    );
  }

  const filteredObjects = sceneGraph.objects.filter((obj) => {
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
    <aside style={{ width }} className="h-full bg-[#0b0c10]/95 border-r border-slate-800/80 flex flex-col justify-between select-none backdrop-blur-xl shrink-0 transition-none shadow-xl z-20">
      <div className="flex flex-col h-full overflow-hidden">
        
        {/* Panel Header */}
        <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-950/40">
          <div className="flex items-center space-x-2.5">
            <span className="text-xs font-bold tracking-tight text-slate-100 uppercase">Scene Layers</span>
            <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800/60 font-semibold shadow-sm">
              {sceneGraph.objects.length}
            </span>
          </div>
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded-lg transition-all"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Multi-Selection Combine Action Banner */}
        {selectedObjectIds.length >= 2 && onMergeObjects && (
          <div className="p-2.5 bg-gradient-to-r from-blue-950/90 via-cyan-950/90 to-slate-900 border-b border-cyan-500/50 flex items-center justify-between animate-fade-in shrink-0 shadow-lg">
            <span className="text-xs font-mono text-cyan-300 font-bold flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-cyan-400 animate-bounce" />
              <span>{selectedObjectIds.length} Selected</span>
            </span>
            <button
              onClick={onMergeObjects}
              className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-lg text-xs transition-all shadow-md shadow-cyan-500/25 flex items-center gap-1.5 active:scale-95"
            >
              <span>Combine</span>
            </button>
          </div>
        )}

        {/* Search Input Bar */}
        <div className="p-2.5 shrink-0 bg-slate-900/20">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scene layers..."
              className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-500/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all font-sans"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="px-2.5 py-1.5 flex gap-1 text-[11px] font-medium shrink-0 border-b border-slate-800/60 bg-slate-950/20">
          {[
            { id: "all", label: "All" },
            { id: "furniture", label: "Furniture" },
            { id: "decor", label: "Decor" },
            { id: "structural", label: "Struct" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1 rounded-lg transition-all ${
                activeTab === tab.id
                  ? "bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 font-mono"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* High-Legibility Object Card List */}
        <div className="p-2.5 space-y-1.5 overflow-y-auto flex-1">
          {filteredObjects.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 font-mono">
              No matching scene elements found
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
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs transition-all cursor-pointer group/item border ${
                    isHighlighted
                      ? "bg-cyan-950/60 text-cyan-100 border-cyan-500/60 font-semibold shadow-md shadow-cyan-950/50"
                      : "bg-slate-900/40 text-slate-200 hover:bg-slate-800/70 hover:border-slate-700/80 border-slate-800/40"
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
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-cyan-500 shrink-0"
                    />
                    <div className={`${isHighlighted ? "text-cyan-400" : "text-slate-400 group-hover/item:text-cyan-300"} shrink-0 transition-colors`}>
                      {getCategoryIcon(obj.class)}
                    </div>
                    <span className="truncate font-sans tracking-tight text-xs font-semibold text-slate-100">
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
                        className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-400 hover:text-red-400 hover:bg-red-950/60 rounded-lg transition-all"
                        title="Delete object"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                      obj.confidence >= 0.7 ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 font-bold" : "bg-slate-800 text-slate-300 font-medium"
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
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-[11px] text-slate-300 flex items-center justify-between font-mono shrink-0">
        <span className="flex items-center gap-1.5 font-semibold text-slate-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Scene Live
        </span>
        <span className="text-[10px] text-slate-400 font-sans">Active Studio</span>
      </div>
    </aside>
  );
}
