"use client";

import React, { useState } from "react";
import { SceneGraph } from "@/types/scene";
import { Box, CheckCircle2, Search, ChevronLeft, ChevronRight, Trash2, Layers, GitMerge } from "lucide-react";

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
  width = 240
}: LayersSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  if (!sceneGraph) return null;

  if (collapsed) {
    return (
      <aside className="w-10 h-full bg-[#0c0e14]/90 border-r border-slate-800/80 flex flex-col items-center py-3 justify-between transition-all select-none backdrop-blur-md shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-all"
          title="Expand Layers"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="flex flex-col items-center space-y-3 font-mono text-[10px] text-slate-500 rotate-180 [writing-mode:vertical-lr]">
          <span>LAYERS (v{sceneGraph.version})</span>
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
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

  return (
    <aside style={{ width }} className="h-full bg-[#0c0e14]/90 border-r border-slate-800/80 flex flex-col justify-between select-none backdrop-blur-md shrink-0 transition-none">
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <span className="text-xs font-bold text-slate-200">Scene Layers</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/50">
              v{sceneGraph.version}
            </span>
            <button
              onClick={() => setCollapsed(true)}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-all"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Multi-Selection Combine Action Bar */}
        {selectedObjectIds.length >= 2 && onMergeObjects && (
          <div className="p-2 bg-gradient-to-r from-blue-950/90 to-cyan-950/90 border-b border-cyan-800/60 flex items-center justify-between animate-fade-in shrink-0">
            <span className="text-[11px] font-mono text-cyan-300 font-medium flex items-center gap-1">
              <GitMerge className="w-3.5 h-3.5" />
              <span>Selected ({selectedObjectIds.length})</span>
            </span>
            <button
              onClick={onMergeObjects}
              className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-medium transition-all shadow-md shadow-cyan-600/30 flex items-center gap-1"
            >
              <span>Combine Objects</span>
            </button>
          </div>
        )}

        {/* Search */}
        <div className="p-2 shrink-0">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search layers..."
              className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-2 py-1 flex gap-1 text-[10px] font-mono shrink-0 border-b border-slate-800/60">
          {[
            { id: "all", label: "All" },
            { id: "furniture", label: "Furniture" },
            { id: "decor", label: "Decor" },
            { id: "structural", label: "Struct" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-0.5 rounded transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Object Tree List with Multi-Selection Support */}
        <div className="p-2 space-y-0.5 overflow-y-auto flex-1">
          {filteredObjects.length === 0 ? (
            <div className="text-center py-6 text-[11px] text-slate-500 font-mono">
              No matching elements
            </div>
          ) : (
            filteredObjects.map((obj) => {
              const isSelected = selectedObjectIds.includes(obj.id) || selectedObjectId === obj.id;
              return (
                <div
                  key={obj.id}
                  onClick={(e) => onToggleSelectObject(obj.id, e.shiftKey || e.metaKey || e.ctrlKey)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-all cursor-pointer group/item ${
                    isSelected
                      ? "bg-blue-600/20 text-blue-200 border border-blue-500/40 font-medium"
                      : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        onToggleSelectObject(obj.id, true);
                      }}
                      className="w-3 h-3 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                    <Box className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-cyan-400" : "text-slate-500"}`} />
                    <div className="truncate">
                      <div className="truncate font-mono font-medium text-xs">{obj.class}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    {onDeleteObject && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteObject(obj.id);
                        }}
                        className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded transition-all"
                        title="Delete object"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                    <span className="font-mono text-[10px] text-slate-500 ml-1">
                      {(obj.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Status */}
      <div className="p-2.5 border-t border-slate-800/80 bg-slate-950/40 text-[10px] text-slate-500 flex items-center justify-between font-mono shrink-0">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          Scene Live
        </span>
        <span className="text-[9px] text-slate-600">Shift+Click to Multi-Select</span>
      </div>
    </aside>
  );
}
