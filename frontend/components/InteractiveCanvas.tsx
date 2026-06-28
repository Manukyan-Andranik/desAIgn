"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Rect, Text, Group, Arrow } from "react-konva";
import useImage from "use-image";
import { SceneGraph } from "@/types/scene";
import { ZoomIn, ZoomOut, Maximize2, Move } from "lucide-react";

interface InteractiveCanvasProps {
  sceneGraph: SceneGraph | null;
  selectedObjectId: string | null;
  hoveredObjectId: string | null;
  showBBoxes?: boolean;
  onSelectObject: (id: string | null) => void;
  onHoverObject: (id: string | null) => void;
}

const DEFAULT_IMAGE_URL = "/default.jpg";

export default function InteractiveCanvas({
  sceneGraph,
  selectedObjectId,
  hoveredObjectId,
  showBBoxes = false,
  onSelectObject,
  onHoverObject
}: InteractiveCanvasProps) {
  const activeImageUrl = sceneGraph?.image_url || DEFAULT_IMAGE_URL;
  const [image] = useImage(activeImageUrl, "anonymous");
  const [stageDimensions, setStageDimensions] = useState({ width: 1000, height: 700 });
  
  // Interactive Zoom & Pan states
  const [zoomScale, setZoomScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const stageRef = useRef<any>(null);

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

  if (!sceneGraph) return null;

  // Compute spatial object centers for relationship rendering
  const objectCenters: Record<string, { x: number; y: number }> = {};
  sceneGraph.objects.forEach((obj) => {
    let rawPoints: number[] = [];
    if (obj.segmentation?.points && obj.segmentation.points.length > 0) {
      rawPoints = obj.segmentation.points.flatMap((p) => [p[0], p[1]]);
    } else if (obj.polygon && obj.polygon.length > 0) {
      rawPoints = obj.polygon.flatMap((p) => [p.x, p.y]);
    }
    if (rawPoints.length >= 4) {
      const cx = rawPoints.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0) / (rawPoints.length / 2);
      const cy = rawPoints.filter((_, i) => i % 2 === 1).reduce((a, b) => a + b, 0) / (rawPoints.length / 2);
      objectCenters[obj.id] = { x: cx, y: cy };
    }
  });

  // Filter relationships connected to selected object
  const activeRelationships = (sceneGraph.relationships || []).filter(
    (r) => r.subject_id === selectedObjectId || r.object_id === selectedObjectId
  );

  return (
    <div id="canvas-container" className="w-full h-full relative bg-[#07080c] flex items-center justify-center overflow-hidden">
      
      {/* Floating Canvas Controls Toolbar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-1.5 p-1.5 glass-panel rounded-2xl border border-slate-700/60 shadow-2xl shadow-black/80 backdrop-blur-xl">
        <button
          onClick={() => setZoomScale((prev) => Math.min(prev * 1.2, 5.0))}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoomScale((prev) => Math.max(prev / 1.2, 0.5))}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono px-2 text-slate-400 border-x border-slate-800">
          {Math.round(zoomScale * 100)}%
        </span>
        <button
          onClick={handleResetZoom}
          className="px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all flex items-center gap-1.5"
          title="Reset Zoom & Pan"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Fit</span>
        </button>
      </div>

      <Stage
        ref={stageRef}
        width={stageDimensions.width}
        height={stageDimensions.height}
        draggable
        x={stagePos.x + imageOffsetX}
        y={stagePos.y + imageOffsetY}
        onWheel={handleWheel}
        onDragEnd={(e) => {
          setStagePos({ x: e.target.x() - imageOffsetX, y: e.target.y() - imageOffsetY });
        }}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) onSelectObject(null);
        }}
        style={{ cursor: "grab" }}
      >
        <Layer scaleX={totalScale} scaleY={totalScale}>
          {/* Base Architectural Render Image */}
          {image && <KonvaImage image={image} width={sceneGraph.width} height={sceneGraph.height} />}

          {/* Object Mask Layers */}
          {sceneGraph.objects.map((obj) => {
            const isSelected = selectedObjectId === obj.id;
            const isHovered = hoveredObjectId === obj.id;
            
            let rawPoints: number[] = [];
            if (obj.segmentation?.points && obj.segmentation.points.length > 0) {
              rawPoints = obj.segmentation.points.flatMap((p) => [p[0], p[1]]);
            } else if (obj.polygon && obj.polygon.length > 0) {
              rawPoints = obj.polygon.flatMap((p) => [p.x, p.y]);
            }

            const center = objectCenters[obj.id] || { x: 100, y: 100 };
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
                        ? "rgba(59, 130, 246, 0.45)"
                        : isHovered
                        ? "rgba(6, 182, 212, 0.40)"
                        : "rgba(0, 0, 0, 0)"
                    }
                    stroke={
                      isSelected 
                        ? "#3b82f6" 
                        : isHovered 
                        ? "#06b6d4" 
                        : "rgba(0, 0, 0, 0)"
                    }
                    strokeWidth={isSelected ? 3.5 / totalScale : isHovered ? 2.5 / totalScale : 0}
                    shadowColor={isHovered ? "#06b6d4" : isSelected ? "#3b82f6" : undefined}
                    shadowBlur={isHovered || isSelected ? 12 : 0}
                    shadowOpacity={isHovered || isSelected ? 0.8 : 0}
                    onMouseEnter={() => onHoverObject(obj.id)}
                    onMouseLeave={() => onHoverObject(null)}
                    onClick={() => onSelectObject(obj.id)}
                  />
                )}

                {/* Vibrant & Interactive Bounding Box Frames when toggled ON */}
                {showBBoxes && obj.bbox && (
                  <Group>
                    <Rect
                      x={obj.bbox[0]}
                      y={obj.bbox[1]}
                      width={obj.bbox[2] - obj.bbox[0]}
                      height={obj.bbox[3] - obj.bbox[1]}
                      stroke={isSelected ? "#3b82f6" : isHovered ? "#06b6d4" : "rgba(6, 182, 212, 0.7)"}
                      strokeWidth={isSelected ? 2.5 / totalScale : 1.5 / totalScale}
                      dash={isSelected || isHovered ? [] : [6, 4]}
                      fill={isSelected ? "rgba(59, 130, 246, 0.15)" : isHovered ? "rgba(6, 182, 212, 0.15)" : "rgba(6, 182, 212, 0.05)"}
                      onMouseEnter={() => onHoverObject(obj.id)}
                      onMouseLeave={() => onHoverObject(null)}
                      onClick={() => onSelectObject(obj.id)}
                    />
                    <Group x={obj.bbox[0]} y={Math.max(0, obj.bbox[1] - 18)} listening={false}>
                      <Rect
                        width={Math.max(70, obj.class.length * 7 + 35)}
                        height={16}
                        fill={isSelected ? "#2563eb" : isHovered ? "#0891b2" : "rgba(15, 23, 42, 0.85)"}
                        cornerRadius={3}
                      />
                      <Text
                        text={`${obj.class.toUpperCase()} (${(obj.confidence * 100).toFixed(0)}%)`}
                        fontSize={9}
                        fontFamily="monospace"
                        fontStyle="bold"
                        fill="#ffffff"
                        padding={3}
                      />
                    </Group>
                  </Group>
                )}

                {/* Hover / Selection Object Tag Label */}
                {(isSelected || isHovered) && (
                  <Group x={center.x - 45} y={center.y - 14} listening={false}>
                    <Rect
                      width={90}
                      height={22}
                      fill={isSelected ? "#2563eb" : "#0891b2"}
                      cornerRadius={6}
                      shadowColor="#000000"
                      shadowBlur={8}
                      shadowOpacity={0.5}
                    />
                    <Text
                      text={`${obj.class.toUpperCase()}`}
                      fontSize={10}
                      fontFamily="sans-serif"
                      fontStyle="bold"
                      fill="#ffffff"
                      padding={5}
                      align="center"
                      width={90}
                    />
                  </Group>
                )}
              </Group>
            );
          })}

          {/* Spatial Relationship Vector Connectors */}
          {activeRelationships.map((rel, index) => {
            const start = objectCenters[rel.subject_id];
            const end = objectCenters[rel.object_id];
            if (!start || !end) return null;

            return (
              <Group key={`rel_${index}`}>
                <Arrow
                  points={[start.x, start.y, end.x, end.y]}
                  pointerLength={8}
                  pointerWidth={8}
                  fill="#38bdf8"
                  stroke="#0284c7"
                  strokeWidth={2 / totalScale}
                  dash={[6, 4]}
                  opacity={0.85}
                  listening={false}
                />
                <Group x={(start.x + end.x) / 2 - 35} y={(start.y + end.y) / 2 - 10} listening={false}>
                  <Rect
                    width={70}
                    height={18}
                    fill="rgba(15, 23, 42, 0.9)"
                    stroke="#0284c7"
                    strokeWidth={1}
                    cornerRadius={4}
                  />
                  <Text
                    text={rel.predicate}
                    fontSize={9}
                    fontFamily="monospace"
                    fill="#38bdf8"
                    padding={4}
                    align="center"
                    width={70}
                  />
                </Group>
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}
