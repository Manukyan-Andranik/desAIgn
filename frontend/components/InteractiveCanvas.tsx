"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Rect, Text, Group } from "react-konva";
import useImage from "use-image";
import { SceneGraph } from "@/types/scene";

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
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const scale = useMemo(() => {
    if (!image || !sceneGraph) return 1;
    const scaleX = stageDimensions.width / sceneGraph.width;
    const scaleY = stageDimensions.height / sceneGraph.height;
    return Math.min(scaleX, scaleY, 1.2);
  }, [image, sceneGraph, stageDimensions]);

  if (!sceneGraph) return null;

  return (
    <div id="canvas-container" className="w-full h-full relative bg-[#07080c] flex items-center justify-center">
      <Stage
        width={stageDimensions.width}
        height={stageDimensions.height}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) onSelectObject(null);
        }}
      >
        <Layer scaleX={scale} scaleY={scale}>
          {/* Base Render Image */}
          {image && <KonvaImage image={image} width={sceneGraph.width} height={sceneGraph.height} />}

          {/* Object Mask Layers */}
          {sceneGraph.objects.map((obj) => {
            const isSelected = selectedObjectId === obj.id;
            const isHovered = hoveredObjectId === obj.id;
            
            // Extract exact pixel mask polygon points
            let rawPoints: number[] = [];
            if (obj.segmentation?.points && obj.segmentation.points.length > 0) {
              rawPoints = obj.segmentation.points.flatMap((p) => [p[0], p[1]]);
            } else if (obj.polygon && obj.polygon.length > 0) {
              rawPoints = obj.polygon.flatMap((p) => [p.x, p.y]);
            }

            const centerX = rawPoints.length >= 4 
              ? (rawPoints.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0) / (rawPoints.length / 2))
              : 100;
            const centerY = rawPoints.length >= 4 
              ? (rawPoints.filter((_, i) => i % 2 === 1).reduce((a, b) => a + b, 0) / (rawPoints.length / 2))
              : 100;

            const isOrganic = ["tree", "bush", "grass", "water", "pool", "sofa", "rug"].includes(obj.class);

            return (
              <Group key={obj.id}>
                {/* Exact Mask Outline: Transparent when idle, vibrant highlight ONLY on hover or selection */}
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
                        : "rgba(0, 0, 0, 0)" // Completely invisible when not hovered or selected
                    }
                    stroke={
                      isSelected 
                        ? "#3b82f6" 
                        : isHovered 
                        ? "#06b6d4" 
                        : "rgba(0, 0, 0, 0)" // Completely invisible stroke when idle
                    }
                    strokeWidth={isSelected ? 3.5 : isHovered ? 2.5 : 0}
                    shadowColor={isHovered ? "#06b6d4" : isSelected ? "#3b82f6" : undefined}
                    shadowBlur={isHovered || isSelected ? 12 : 0}
                    shadowOpacity={isHovered || isSelected ? 0.8 : 0}
                    onMouseEnter={() => onHoverObject(obj.id)}
                    onMouseLeave={() => onHoverObject(null)}
                    onClick={() => onSelectObject(obj.id)}
                  />
                )}

                {/* Optional Bounding Box Frames (Only when explicitly turned ON and NOT hovered) */}
                {showBBoxes && obj.bbox && !isHovered && !isSelected && (
                  <Group>
                    <Rect
                      x={obj.bbox[0]}
                      y={obj.bbox[1]}
                      width={obj.bbox[2] - obj.bbox[0]}
                      height={obj.bbox[3] - obj.bbox[1]}
                      stroke="rgba(148, 163, 184, 0.3)"
                      strokeWidth={1}
                      dash={[4, 4]}
                      listening={false}
                    />
                  </Group>
                )}

                {/* Hover / Selection Object Tag Label */}
                {(isSelected || isHovered) && (
                  <Group x={centerX - 45} y={centerY - 14} listening={false}>
                    <Rect
                      width={90}
                      height={20}
                      fill={isSelected ? "#2563eb" : "#0891b2"}
                      cornerRadius={4}
                      shadowColor="#000000"
                      shadowBlur={6}
                      shadowOpacity={0.4}
                    />
                    <Text
                      text={`${obj.class.toUpperCase()}`}
                      fontSize={10}
                      fontFamily="sans-serif"
                      fontStyle="bold"
                      fill="#ffffff"
                      padding={4}
                      align="center"
                    />
                  </Group>
                )}
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}
