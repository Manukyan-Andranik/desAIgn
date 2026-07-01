"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Rect, Text, Group, Circle } from "react-konva";
import useImage from "use-image";
import { SceneGraph } from "@/types/scene";
import { ZoomIn, ZoomOut, Maximize2, Move, Paintbrush, MousePointer, Check, X, Sparkles, Square, Wand2, ArrowRight, Layers, Waypoints, RotateCcw } from "lucide-react";

interface InteractiveCanvasProps {
  sceneGraph: SceneGraph | null;
  selectedObjectId: string | null;
  selectedObjectIds?: string[];
  hoveredObjectId: string | null;
  showBBoxes?: boolean;
  onSelectObject: (id: string | null, isMulti?: boolean) => void;
  onHoverObject: (id: string | null) => void;
  onAddCustomObject?: (className: string, points: number[][]) => void;
  onAIEditRegion?: (bbox: number[], objectName: string, prompt: string, points: number[][]) => Promise<void>;
}

const DEFAULT_IMAGE_URL = "/default.jpg";

export default function InteractiveCanvas({
  sceneGraph,
  selectedObjectId,
  selectedObjectIds = [],
  hoveredObjectId,
  showBBoxes = false,
  onSelectObject,
  onHoverObject,
  onAddCustomObject,
  onAIEditRegion
}: InteractiveCanvasProps) {
  const activeImageUrl = sceneGraph?.image_url || DEFAULT_IMAGE_URL;
  const [image] = useImage(activeImageUrl, "anonymous");
  const [stageDimensions, setStageDimensions] = useState({ width: 1000, height: 700 });
  
  // Interactive Zoom & Pan states
  const [zoomScale, setZoomScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const stageRef = useRef<any>(null);

  // Active Tool Mode: Pointer Select vs Brush Draw vs Rectangle Box vs Point-by-Point Polygon
  const [activeTool, setActiveTool] = useState<"select" | "brush" | "rectangle" | "polygon">("select");
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokePoints, setStrokePoints] = useState<number[][]>([]);
  
  // Rectangle Selection State
  const [rectStartPos, setRectStartPos] = useState<[number, number] | null>(null);
  const [rectCurrentPos, setRectCurrentPos] = useState<[number, number] | null>(null);

  // Point-by-Point Polygon Selection State
  const [polygonPoints, setPolygonPoints] = useState<number[][]>([]);
  const [polygonCursorPos, setPolygonCursorPos] = useState<[number, number] | null>(null);

  // Modal State for Action Choice (Define Object vs Call Gemini AI)
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [actionTab, setActionTab] = useState<"define" | "ai">("define");
  const [customClassName, setCustomClassName] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        if (activeTool === "polygon" && polygonPoints.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          setPolygonPoints((prev) => prev.slice(0, prev.length - 1));
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTool, polygonPoints.length]);

  useEffect(() => {
    const updateDimensions = () => {
      const container = document.getElementById("canvas-container");
      if (container) {
        setStageDimensions({
          width: container.clientWidth,
          height: container.clientHeight
        });
      }
    };
    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    const container = document.getElementById("canvas-container");
    if (container) resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Compute fit-to-screen base scale
  const baseScale = useMemo(() => {
    if (!image || !sceneGraph) return 1;
    const scaleX = stageDimensions.width / sceneGraph.width;
    const scaleY = stageDimensions.height / sceneGraph.height;
    return Math.min(scaleX, scaleY, 1.2);
  }, [image, sceneGraph, stageDimensions]);

  const totalScale = baseScale * zoomScale;

  // Center image in viewport
  const imageOffsetX = useMemo(() => {
    if (!sceneGraph) return 0;
    return Math.max(0, (stageDimensions.width - sceneGraph.width * totalScale) / 2);
  }, [stageDimensions.width, sceneGraph, totalScale]);

  const imageOffsetY = useMemo(() => {
    if (!sceneGraph) return 0;
    return Math.max(0, (stageDimensions.height - sceneGraph.height * totalScale) / 2);
  }, [stageDimensions.height, sceneGraph, totalScale]);

  const handleResetZoom = () => {
    setZoomScale(1);
    setStagePos({ x: 0, y: 0 });
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.08;
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = zoomScale;
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.min(Math.max(newScale, 0.5), 5.0);
    setZoomScale(clampedScale);
  };

  // Convert Pointer Screen Coordinates to Raw Image Coordinates
  const getRawImagePointerPos = (): [number, number] | null => {
    const stage = stageRef.current;
    if (!stage || !sceneGraph) return null;
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;

    const currentX = stage.x();
    const currentY = stage.y();

    const imgX = (pointer.x - currentX) / totalScale;
    const imgY = (pointer.y - currentY) / totalScale;
    return [Math.round(imgX), Math.round(imgY)];
  };

  const handleMouseDown = (e: any) => {
    if (activeTool === "brush") {
      const pos = getRawImagePointerPos();
      if (pos) {
        setIsDrawing(true);
        setStrokePoints([pos]);
      }
      return;
    }

    if (activeTool === "rectangle") {
      const pos = getRawImagePointerPos();
      if (pos) {
        setIsDrawing(true);
        setRectStartPos(pos);
        setRectCurrentPos(pos);
      }
      return;
    }

    if (activeTool === "polygon") {
      const pos = getRawImagePointerPos();
      if (pos) {
        // If clicking near start point when >= 3 points, complete polygon
        if (polygonPoints.length >= 3) {
          const first = polygonPoints[0];
          const dist = Math.hypot(pos[0] - first[0], pos[1] - first[1]);
          if (dist < 25 / totalScale) {
            setShowSelectionModal(true);
            return;
          }
        }
        setPolygonPoints((prev) => [...prev, pos]);
      }
      return;
    }

    if (e.target === e.target.getStage()) {
      onSelectObject(null);
    }
  };

  const handleMouseMove = () => {
    const pos = getRawImagePointerPos();
    if (!pos) return;

    if (activeTool === "polygon") {
      setPolygonCursorPos(pos);
      return;
    }

    if (!isDrawing) return;

    if (activeTool === "brush") {
      setStrokePoints((prev) => [...prev, pos]);
    } else if (activeTool === "rectangle") {
      setRectCurrentPos(pos);
    }
  };

  const handleMouseUp = () => {
    if (activeTool === "polygon") return;
    if (!isDrawing) return;
    setIsDrawing(false);

    if (activeTool === "brush" && strokePoints.length >= 3) {
      setShowSelectionModal(true);
    } else if (activeTool === "rectangle" && rectStartPos && rectCurrentPos) {
      const dx = Math.abs(rectCurrentPos[0] - rectStartPos[0]);
      const dy = Math.abs(rectCurrentPos[1] - rectStartPos[1]);
      if (dx >= 10 && dy >= 10) {
        setShowSelectionModal(true);
      } else {
        setRectStartPos(null);
        setRectCurrentPos(null);
      }
    }
  };

  const handleDblClick = () => {
    if (activeTool === "polygon" && polygonPoints.length >= 3) {
      setShowSelectionModal(true);
    }
  };

  // Calculate current selection geometry (points & bounding box)
  const currentSelection = useMemo(() => {
    let pts: number[][] = [];
    if (activeTool === "brush" && strokePoints.length >= 3) {
      pts = strokePoints;
    } else if (activeTool === "rectangle" && rectStartPos && rectCurrentPos) {
      const xmin = Math.min(rectStartPos[0], rectCurrentPos[0]);
      const xmax = Math.max(rectStartPos[0], rectCurrentPos[0]);
      const ymin = Math.min(rectStartPos[1], rectCurrentPos[1]);
      const ymax = Math.max(rectStartPos[1], rectCurrentPos[1]);
      pts = [
        [xmin, ymin],
        [xmax, ymin],
        [xmax, ymax],
        [xmin, ymax]
      ];
    } else if (activeTool === "polygon" && polygonPoints.length >= 3) {
      pts = polygonPoints;
    }
    if (pts.length === 0) return null;

    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const xmin = Math.min(...xs);
    const xmax = Math.max(...xs);
    const ymin = Math.min(...ys);
    const ymax = Math.max(...ys);

    return {
      points: pts,
      bbox: [xmin, ymin, xmax, ymax]
    };
  }, [strokePoints, rectStartPos, rectCurrentPos, polygonPoints, activeTool]);

  const handleClearSelectionState = () => {
    setShowSelectionModal(false);
    setCustomClassName("");
    setAiPrompt("");
    setStrokePoints([]);
    setRectStartPos(null);
    setRectCurrentPos(null);
    setPolygonPoints([]);
    setPolygonCursorPos(null);
    setIsSubmitting(false);
  };

  const handleDefineObjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customClassName.trim() || !currentSelection || !onAddCustomObject) return;

    setIsSubmitting(true);
    onAddCustomObject(customClassName.trim(), currentSelection.points);
    handleClearSelectionState();
  };

  const handleAIEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customClassName.trim() || !aiPrompt.trim() || !currentSelection || !onAIEditRegion) return;

    setIsSubmitting(true);
    await onAIEditRegion(currentSelection.bbox, customClassName.trim(), aiPrompt.trim(), currentSelection.points);
    handleClearSelectionState();
  };

  if (!sceneGraph) return null;

  const flatStrokePoints = strokePoints.flatMap((p) => [p[0], p[1]]);
  const flatPolygonPoints = polygonPoints.flatMap((p) => [p[0], p[1]]);

  // Active Rectangle bounds for stage drawing preview
  let activeRectProps = null;
  if (activeTool === "rectangle" && rectStartPos && rectCurrentPos) {
    const xmin = Math.min(rectStartPos[0], rectCurrentPos[0]);
    const xmax = Math.max(rectStartPos[0], rectCurrentPos[0]);
    const ymin = Math.min(rectStartPos[1], rectCurrentPos[1]);
    const ymax = Math.max(rectStartPos[1], rectCurrentPos[1]);
    activeRectProps = { x: xmin, y: ymin, width: xmax - xmin, height: ymax - ymin };
  }

  return (
    <div id="canvas-container" className="w-full h-full relative bg-[#FAFAF9] flex items-center justify-center overflow-hidden font-sans border-r border-[#E2E8F0] shadow-inner">
      
      {/* Active Polygon Live Control Bar overlay when placing points */}
      {activeTool === "polygon" && polygonPoints.length > 0 && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-3 px-4 py-2 bg-white/95 border border-[#E2E8F0] rounded-2xl shadow-xl backdrop-blur-md animate-fade-in">
          <div className="flex items-center space-x-2 text-xs font-mono text-[#4F46E5]">
            <Waypoints className="w-4 h-4 text-[#4F46E5] animate-pulse" />
            <span>Polygon Points: <strong>{polygonPoints.length}</strong></span>
          </div>
          <div className="h-4 w-[1px] bg-[#E2E8F0]" />
          <button
            onClick={() => setPolygonPoints((prev) => prev.slice(0, prev.length - 1))}
            className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-[#64748B] border border-[#E2E8F0] text-xs font-semibold flex items-center space-x-1 transition-all"
            title="Undo last point (Ctrl+Z)"
          >
            <RotateCcw className="w-3 h-3 text-[#4F46E5]" />
            <span>Undo Point</span>
          </button>
          <button
            onClick={() => setPolygonPoints([])}
            className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-[#64748B] border border-[#E2E8F0] text-xs font-semibold flex items-center space-x-1 transition-all"
          >
            <X className="w-3 h-3" />
            <span>Clear</span>
          </button>
          <button
            onClick={() => {
              if (polygonPoints.length >= 3) setShowSelectionModal(true);
            }}
            disabled={polygonPoints.length < 3}
            className="px-3 py-1.5 rounded-lg bg-[#4F46E5] hover:bg-[#6366F1] text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-[#4F46E5]/15 transition-all disabled:opacity-50 border-0"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Complete Selection</span>
          </button>
        </div>
      )}

      {/* Floating Canvas Controls Toolbar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-2 p-1.5 bg-white/95 rounded-2xl border border-[#E2E8F0] shadow-xl backdrop-blur-md animate-fade-in">
        
        {/* Tool Mode Toggles */}
        <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-xl border border-[#E2E8F0]">
          <button
            onClick={() => {
              setActiveTool("select");
              setStrokePoints([]);
              setRectStartPos(null);
              setRectCurrentPos(null);
              setPolygonPoints([]);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 flex items-center space-x-1.5 active:scale-[0.97] border-0 ${
              activeTool === "select"
                ? "bg-[#4F46E5] text-white font-bold shadow-md shadow-[#4F46E5]/15"
                : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 bg-transparent"
            }`}
            title="Select tool"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Select</span>
          </button>

          <button
            onClick={() => {
              setActiveTool("brush");
              setRectStartPos(null);
              setRectCurrentPos(null);
              setPolygonPoints([]);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 flex items-center space-x-1.5 active:scale-[0.97] border-0 ${
              activeTool === "brush"
                ? "bg-[#4F46E5] text-white font-bold shadow-md shadow-[#4F46E5]/15"
                : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 bg-transparent"
            }`}
            title="Draw freehand"
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Draw</span>
          </button>

          <button
            onClick={() => {
              setActiveTool("rectangle");
              setStrokePoints([]);
              setPolygonPoints([]);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 flex items-center space-x-1.5 active:scale-[0.97] border-0 ${
              activeTool === "rectangle"
                ? "bg-[#4F46E5] text-white font-bold shadow-md shadow-[#4F46E5]/15"
                : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 bg-transparent"
            }`}
            title="Draw a box"
          >
            <Square className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Box</span>
          </button>

          <button
            onClick={() => {
              setActiveTool("polygon");
              setStrokePoints([]);
              setRectStartPos(null);
              setRectCurrentPos(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 flex items-center space-x-1.5 active:scale-[0.97] border-0 ${
              activeTool === "polygon"
                ? "bg-[#4F46E5] text-white font-bold shadow-md shadow-[#4F46E5]/15"
                : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 bg-transparent"
            }`}
            title="Click points to draw a shape"
          >
            <Waypoints className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Polygon</span>
          </button>
        </div>

        <span className="h-4 w-[1px] bg-[#E2E8F0]" />

        {/* Zoom Controls */}
        <button
          onClick={() => setZoomScale((prev) => Math.min(prev * 1.2, 5.0))}
          className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 rounded-xl transition-all duration-200 border-0 bg-transparent"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoomScale((prev) => Math.max(prev / 1.2, 0.5))}
          className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 rounded-xl transition-all duration-200 border-0 bg-transparent"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono px-2 text-[#64748B]">
          {Math.round(zoomScale * 100)}%
        </span>
        <button
          onClick={handleResetZoom}
          className="px-3 py-1.5 text-xs font-mono text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 rounded-xl transition-all duration-200 flex items-center gap-1.5 border-0 bg-transparent"
          title="Reset Zoom & Pan"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Fit</span>
        </button>
      </div>

      {/* Dual Action Selection Modal (Define Object OR Call Gemini AI) */}
      {showSelectionModal && currentSelection && (
        <div className="absolute inset-0 z-50 bg-[#0F172A]/30 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={handleClearSelectionState}>
          <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xl space-y-5 animate-scale-in" onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#4F46E5]/10 text-[#4F46E5] border border-[#E2E8F0] flex items-center justify-center shadow-sm">
                  {activeTool === "brush" ? (
                    <Paintbrush className="w-5 h-5 animate-pulse" />
                  ) : activeTool === "rectangle" ? (
                    <Square className="w-5 h-5 animate-pulse" />
                  ) : (
                    <Waypoints className="w-5 h-5 animate-pulse" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wide">
                    {activeTool === "brush" ? "Area selected" : activeTool === "rectangle" ? "Area selected" : "Area selected"}
                  </h3>
                  <p className="text-[11px] text-[#64748B] font-mono">
                    Area selected
                  </p>
                </div>
              </div>
              <button
                onClick={handleClearSelectionState}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 border border-transparent hover:border-[#E2E8F0] rounded-xl transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Common Object Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider flex items-center space-x-1">
                <span>What is this?</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customClassName}
                onChange={(e) => setCustomClassName(e.target.value)}
                placeholder="e.g. Armchair, Vintage Lamp, Marble Coffee Table"
                className="w-full bg-white border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] placeholder-[#64748B]/50 focus:outline-none font-sans shadow-inner"
                autoFocus
              />
            </div>

            {/* Choice Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-2xl border border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setActionTab("define")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 border-0 ${
                  actionTab === "define"
                    ? "bg-white text-[#4F46E5] shadow-sm font-bold border border-[#E2E8F0]"
                    : "text-[#64748B] hover:text-[#0F172A] bg-transparent"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#4F46E5]" />
                <span>Save to design</span>
              </button>

              <button
                type="button"
                onClick={() => setActionTab("ai")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 border-0 ${
                  actionTab === "ai"
                    ? "bg-[#4F46E5] text-white shadow-md shadow-[#4F46E5]/15"
                    : "text-[#64748B] hover:text-[#0F172A] bg-transparent"
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Edit with AI</span>
              </button>
            </div>

            {/* Tab 1: Define Scene Object Form */}
            {actionTab === "define" && (
              <form onSubmit={handleDefineObjectSubmit} className="space-y-4 pt-1">
                <p className="text-xs text-[#64748B] leading-relaxed bg-slate-50 p-3 rounded-xl border border-[#E2E8F0] font-sans">
                  Save this area as an item you can edit later — no AI change yet.
                </p>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleClearSelectionState}
                    className="flex-1 py-2.5 bg-transparent hover:bg-slate-50 border border-[#E2E8F0] text-[#0F172A] rounded-xl text-xs font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !customClassName.trim()}
                    className="flex-1 py-2.5 bg-[#4F46E5] hover:bg-[#6366F1] text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-[#4F46E5]/15 transition-all disabled:opacity-50 border-0"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save item</span>
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Gemini AI Direct Transformation Form */}
            {actionTab === "ai" && (
              <form onSubmit={handleAIEditSubmit} className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
                    <span>Describe the change</span>
                  </label>
                  <textarea
                    rows={3}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Replace this selected object with a luxury cognac leather armchair with brushed brass legs"
                    className="w-full bg-white border border-[#E2E8F0] focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] rounded-xl p-3 text-xs text-[#0F172A] placeholder-[#64748B]/50 focus:outline-none font-sans shadow-inner resize-none"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleClearSelectionState}
                    className="flex-1 py-2.5 bg-transparent hover:bg-slate-50 border border-[#E2E8F0] text-[#0F172A] rounded-xl text-xs font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !customClassName.trim() || !aiPrompt.trim()}
                    className="flex-1 py-2.5 bg-[#4F46E5] hover:bg-[#6366F1] text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-[#4F46E5]/15 transition-all disabled:opacity-50 border-0"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span>Apply with AI</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      <Stage
        ref={stageRef}
        width={stageDimensions.width}
        height={stageDimensions.height}
        draggable={activeTool === "select"}
        x={stagePos.x + imageOffsetX}
        y={stagePos.y + imageOffsetY}
        onWheel={handleWheel}
        onDragEnd={(e) => {
          if (activeTool === "select") {
            setStagePos({ x: e.target.x() - imageOffsetX, y: e.target.y() - imageOffsetY });
          }
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDblClick={handleDblClick}
        style={{ cursor: activeTool === "select" ? "grab" : "crosshair" }}
      >
        <Layer scaleX={totalScale} scaleY={totalScale}>
          {/* Base Architectural Render Image */}
          {image && <KonvaImage image={image} width={sceneGraph.width} height={sceneGraph.height} />}

          {/* Object Mask Layers */}
          {sceneGraph.objects.map((obj) => {
            const isSelected = selectedObjectId === obj.id || selectedObjectIds.includes(obj.id);
            const isHovered = hoveredObjectId === obj.id;
            
            let rawPoints: number[] = [];
            if (obj.segmentation?.points && obj.segmentation.points.length > 0) {
              rawPoints = obj.segmentation.points.flatMap((p) => [p[0], p[1]]);
            } else if (obj.polygon && obj.polygon.length > 0) {
              rawPoints = obj.polygon.flatMap((p) => [p.x, p.y]);
            }

            const isOrganic = ["tree", "bush", "grass", "water", "pool", "sofa", "rug", "plant"].includes(obj.class);

            return (
              <Group key={obj.id}>
                {/* Pixel-Exact Mask Outline */}
                {rawPoints.length >= 6 && (
                  <Line
                    points={rawPoints}
                    closed={true}
                    tension={isOrganic ? 0.35 : 0.05}
                    fill={
                      isSelected
                        ? "rgba(79, 70, 229, 0.35)"
                        : isHovered
                        ? "rgba(14, 165, 233, 0.25)"
                        : "rgba(0, 0, 0, 0)"
                    }
                    stroke={
                      isSelected 
                        ? "#4F46E5" 
                        : isHovered 
                        ? "#0EA5E9" 
                        : "rgba(0, 0, 0, 0)"
                    }
                    strokeWidth={isSelected ? 3.5 / totalScale : isHovered ? 2.5 / totalScale : 0}
                    shadowColor={isHovered ? "#0EA5E9" : isSelected ? "#4F46E5" : undefined}
                    shadowBlur={isHovered || isSelected ? 12 : 0}
                    shadowOpacity={isHovered || isSelected ? 0.8 : 0}
                    onMouseEnter={() => activeTool === "select" && onHoverObject(obj.id)}
                    onMouseLeave={() => activeTool === "select" && onHoverObject(null)}
                    onClick={(e) => {
                      if (activeTool === "select") {
                        const isMulti = e.evt ? (e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey) : false;
                        onSelectObject(obj.id, isMulti);
                      }
                    }}
                  />
                )}

                {/* Vibrant Bounding Box Frames when toggled ON */}
                {showBBoxes && obj.bbox && (
                  <Group>
                    <Rect
                      x={obj.bbox[0]}
                      y={obj.bbox[1]}
                      width={obj.bbox[2] - obj.bbox[0]}
                      height={obj.bbox[3] - obj.bbox[1]}
                      stroke={isSelected ? "#4F46E5" : isHovered ? "#0EA5E9" : "rgba(79, 70, 229, 0.4)"}
                      strokeWidth={isSelected ? 2.5 / totalScale : 1.5 / totalScale}
                      dash={isSelected || isHovered ? [] : [6, 4]}
                      fill={isSelected ? "rgba(79, 70, 229, 0.15)" : isHovered ? "rgba(14, 165, 233, 0.15)" : "rgba(14, 165, 233, 0.05)"}
                      onMouseEnter={() => activeTool === "select" && onHoverObject(obj.id)}
                      onMouseLeave={() => activeTool === "select" && onHoverObject(null)}
                      onClick={(e) => {
                        if (activeTool === "select") {
                          const isMulti = e.evt ? (e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey) : false;
                          onSelectObject(obj.id, isMulti);
                        }
                      }}
                    />
                  </Group>
                )}
              </Group>
            );
          })}

          {/* Active User Brush Stroke Preview */}
          {activeTool === "brush" && flatStrokePoints.length >= 4 && (
            <Line
              points={flatStrokePoints}
              stroke="#0EA5E9"
              strokeWidth={16 / totalScale}
              lineCap="round"
              lineJoin="round"
              shadowColor="#0EA5E9"
              shadowBlur={15}
              shadowOpacity={0.9}
              closed={false}
            />
          )}

          {/* Active User Rectangle Selection Box Preview */}
          {activeTool === "rectangle" && activeRectProps && activeRectProps.width > 0 && activeRectProps.height > 0 && (
            <Rect
              x={activeRectProps.x}
              y={activeRectProps.y}
              width={activeRectProps.width}
              height={activeRectProps.height}
              stroke="#0EA5E9"
              strokeWidth={2.5 / totalScale}
              dash={[8, 4]}
              fill="rgba(14, 165, 233, 0.25)"
              shadowColor="#0EA5E9"
              shadowBlur={10}
            />
          )}

          {/* Active User Point-by-Point Straight-Line Polygon Preview */}
          {activeTool === "polygon" && (
            <Group>
              {/* Placed straight lines connecting points */}
              {flatPolygonPoints.length >= 4 && (
                <Line
                  points={flatPolygonPoints}
                  stroke="#0EA5E9"
                  strokeWidth={2.5 / totalScale}
                  closed={false}
                  tension={0}
                  shadowColor="#0EA5E9"
                  shadowBlur={10}
                />
              )}

              {/* Dynamic live rubberband line from last placed point to mouse cursor */}
              {polygonPoints.length > 0 && polygonCursorPos && (
                <Line
                  points={[
                    polygonPoints[polygonPoints.length - 1][0],
                    polygonPoints[polygonPoints.length - 1][1],
                    polygonCursorPos[0],
                    polygonCursorPos[1]
                  ]}
                  stroke="rgba(14, 165, 233, 0.8)"
                  strokeWidth={1.5 / totalScale}
                  dash={[6, 4]}
                />
              )}

              {/* Glowing circular nodes at each polygon vertex */}
              {polygonPoints.map((p, idx) => (
                <Circle
                  key={idx}
                  x={p[0]}
                  y={p[1]}
                  radius={(idx === 0 ? 7 : 4) / totalScale}
                  fill={idx === 0 ? "#10B981" : "#0EA5E9"}
                  stroke="#ffffff"
                  strokeWidth={1.5 / totalScale}
                  shadowColor={idx === 0 ? "#10B981" : "#0EA5E9"}
                  shadowBlur={8}
                />
              ))}
            </Group>
          )}

        </Layer>
      </Stage>
    </div>
  );
}
