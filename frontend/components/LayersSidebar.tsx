"use client";

import React from "react";
import { SceneGraph } from "@/types/scene";
import { Layers, Box, Eye, CheckCircle2 } from "lucide-react";

interface LayersSidebarProps {
  sceneGraph: SceneGraph | null;
  selectedObjectId: string | null;
  onSelectObject: (id: string) => void;
}

export default function LayersSidebar({ sceneGraph, selectedObjectId, onSelectObject }: LayersSidebarProps) {
  if (!sceneGraph) return null;

  return (
    <aside className="w-64 h-full glass-panel border-r border-slate-800 flex flex-col justify-between">
      <div>
        {/* Workspace Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
              AG
            </div>
            <span className="text-xs font-semibold tracking-wide text-slate-200">Scene Layers</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
            v{sceneGraph.version}
          </span>
        </div>

        {/* Object Tree List */}
        <div className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          <div className="text-[10px] font-mono text-slate-500 uppercase px-2 py-1 flex justify-between">
            <span>Elements ({sceneGraph.objects.length})</span>
            <span>Confidence</span>
          </div>

          {sceneGraph.objects.map((obj) => {
            const isSelected = selectedObjectId === obj.id;
            return (
              <button
                key={obj.id}
                onClick={() => onSelectObject(obj.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between text-xs transition-all ${
                  isSelected
                    ? "bg-blue-600/20 text-blue-300 border border-blue-500/30 font-medium"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Box className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-blue-400" : "text-slate-500"}`} />
                  <div className="truncate">
                    <div className="truncate font-mono">{obj.id}</div>
                    <div className="text-[10px] text-slate-500 capitalize">{obj.class}</div>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-slate-500 shrink-0 ml-2">
                  {(obj.confidence * 100).toFixed(0)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Status */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/50 text-[11px] text-slate-400 flex items-center justify-between font-mono">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Graph Synchronized
        </span>
      </div>
    </aside>
  );
}
