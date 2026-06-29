"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { SceneGraph, SceneObject, OrchestratorResponse, User, Project } from "@/types/scene";
import LayersSidebar from "@/components/LayersSidebar";
import Inspector from "@/components/Inspector";
import HomePage from "@/components/HomePage";
import ProjectsPage from "@/components/ProjectsPage";
import AuthModal from "@/components/AuthModal";
import ProgressLoader from "@/components/ProgressLoader";
import UserAccountMenu from "@/components/UserAccountMenu";
import { Sparkles, Upload, RefreshCw, Cpu, CheckCircle2, Scan, Loader2, Home, Palette, Sliders, Layers, ArrowRight, X, LayoutDashboard, Plus, Trash2, Folder, Undo2, Redo2, ShieldAlert, LogIn, Lock } from "lucide-react";

const InteractiveCanvas = dynamic(() => import("@/components/InteractiveCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#07080c] text-slate-400 font-mono text-xs space-y-3 select-none">
      <Cpu className="w-5 h-5 text-cyan-400 animate-spin" />
      <span>Loading Viewport...</span>
    </div>
  )
});

const ROOM_OPTIONS = [
  { id: "Living Room", label: "Living Room", icon: "🛋️", desc: "Sofas, coffee tables, TV consoles, lounge armchairs" },
  { id: "Kitchen", label: "Kitchen", icon: "🍳", desc: "Kitchen islands, stoves, refrigerators, cabinets, sinks" },
  { id: "Bedroom", label: "Bedroom", icon: "🖏️", desc: "Beds, nightstands, headboards, wardrobes, dressers" },
  { id: "Bathroom", label: "Bathroom", icon: "🛁", desc: "Bathtubs, shower enclosures, vanities, mirrors, sinks" },
  { id: "Office & Study", label: "Office & Study", icon: "💼", desc: "Executive desks, task chairs, bookcases, monitors" },
  { id: "Cafe & Restaurant", label: "Cafe & Restaurant", icon: "☕", desc: "Espresso machines, cafe tables, bar counters, displays" },
  { id: "Outdoor Patio", label: "Outdoor Patio", icon: "🌿", desc: "Patio loungers, outdoor dining, pergolas, planters" }
];

const STYLE_OPTIONS = [
  { id: "Japandi Minimalist", label: "Japandi Minimalist", desc: "Clean organic warm timber, muted tones, uncluttered forms" },
  { id: "Scandinavian Modern", label: "Scandinavian Modern", desc: "Nordic light woods, cozy wool textiles, functional design" },
  { id: "Industrial Brutalist", label: "Industrial Brutalist", desc: "Exposed concrete, dark steel framing, raw tactile elements" },
  { id: "Biophilic Luxury", label: "Biophilic Luxury", desc: "Rich lush indoor greenery, natural stone, organic curvature" },
  { id: "Mid-Century Modern", label: "Mid-Century Modern", desc: "Iconic tapered legs, warm walnut wood, vibrant accents" },
  { id: "Classic Art Deco", label: "Classic Art Deco", desc: "Opulent brass metals, geometric motifs, polished marble" }
];

export default function StudioPage() {
  const [viewMode, setViewMode] = useState<"home" | "projects" | "studio">("home");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sceneGraph, setSceneGraph] = useState<SceneGraph | null>(null);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([]);
  const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null);
  const [showBBoxes, setShowBBoxes] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; model?: string; type?: "info" | "success" | "ai" } | null>(null);

  // Undo / Redo History Stacks State
  const [historyStack, setHistoryStack] = useState<SceneGraph[]>([]);
  const [redoStack, setRedoStack] = useState<SceneGraph[]>([]);

  const historyStackRef = useRef<SceneGraph[]>([]);
  const redoStackRef = useRef<SceneGraph[]>([]);
  const sceneGraphRef = useRef<SceneGraph | null>(null);

  useEffect(() => {
    historyStackRef.current = historyStack;
  }, [historyStack]);

  useEffect(() => {
    redoStackRef.current = redoStack;
  }, [redoStack]);

  useEffect(() => {
    sceneGraphRef.current = sceneGraph;
  }, [sceneGraph]);

  const syncSceneGraphToDB = async (sg: SceneGraph) => {
    try {
      await fetch("http://localhost:8000/api/v1/scene-graph/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sg)
      });
    } catch (err) {
      console.error("Failed to sync restored scene graph to DB:", err);
    }
  };

  const pushHistorySnapshot = (currentSG?: SceneGraph | null) => {
    const targetSG = currentSG || sceneGraphRef.current;
    if (!targetSG) return;
    const clone = JSON.parse(JSON.stringify(targetSG));
    setHistoryStack((prev) => [...prev.slice(-30), clone]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    const history = historyStackRef.current;
    const current = sceneGraphRef.current;
    if (history.length === 0 || !current) return;

    const previous = history[history.length - 1];
    const newHistory = history.slice(0, history.length - 1);
    const newRedo = [...redoStackRef.current, JSON.parse(JSON.stringify(current))];

    setHistoryStack(newHistory);
    setRedoStack(newRedo);
    setSceneGraph(previous);
    syncSceneGraphToDB(previous);
    showToast("Undo (Ctrl+Z): Restored previous scene state.", "History OS", "info");
  };

  const handleRedo = () => {
    const redo = redoStackRef.current;
    const current = sceneGraphRef.current;
    if (redo.length === 0 || !current) return;

    const next = redo[redo.length - 1];
    const newRedo = redo.slice(0, redo.length - 1);
    const newHistory = [...historyStackRef.current, JSON.parse(JSON.stringify(current))];

    setRedoStack(newRedo);
    setHistoryStack(newHistory);
    setSceneGraph(next);
    syncSceneGraphToDB(next);
    showToast("Redo (Ctrl+Shift+Z): Re-applied scene state.", "History OS", "info");
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      if (!isCmdOrCtrl) return;

      const key = e.key.toLowerCase();
      if (key === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if (key === "y") {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown, true);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown, true);
  }, []);
  
  // Interactive Room Function & Style Setup State
  const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
  const [roomType, setRoomType] = useState<string>("Living Room");
  const [designStyle, setDesignStyle] = useState<string>("Japandi Minimalist");

  // Loading states
  const [uploading, setUploading] = useState(false);
  const [isOrchestrating, setIsOrchestrating] = useState(false);

  // Resizable Panel Width States
  const [leftWidth, setLeftWidth] = useState(250);
  const [rightWidth, setRightWidth] = useState(250);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageId, setImageId] = useState("demo_render_01");
  const [isInitialized, setIsInitialized] = useState(false);

  // Restore State from localStorage on Mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedImageId = localStorage.getItem("antigravity_imageId");
      const savedViewMode = localStorage.getItem("antigravity_viewMode") as "home" | "studio";
      const savedRoomType = localStorage.getItem("antigravity_roomType");
      const savedDesignStyle = localStorage.getItem("antigravity_designStyle");
      const savedLeftWidth = localStorage.getItem("antigravity_leftWidth");
      const savedRightWidth = localStorage.getItem("antigravity_rightWidth");

      if (savedImageId) setImageId(savedImageId);
      if (savedViewMode) setViewMode(savedViewMode);
      if (savedRoomType) setRoomType(savedRoomType);
      if (savedDesignStyle) setDesignStyle(savedDesignStyle);
      if (savedLeftWidth) setLeftWidth(parseInt(savedLeftWidth, 10));
      if (savedRightWidth) setRightWidth(parseInt(savedRightWidth, 10));

      setIsInitialized(true);
      fetchSceneGraph(savedImageId || "demo_render_01");
    }
  }, []);

  // Synchronize State Updates to localStorage
  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      localStorage.setItem("antigravity_imageId", imageId);
      localStorage.setItem("antigravity_viewMode", viewMode);
      localStorage.setItem("antigravity_roomType", roomType);
      localStorage.setItem("antigravity_designStyle", designStyle);
      localStorage.setItem("antigravity_leftWidth", leftWidth.toString());
      localStorage.setItem("antigravity_rightWidth", rightWidth.toString());
    }
  }, [imageId, viewMode, roomType, designStyle, leftWidth, rightWidth, isInitialized]);

  // Mouse drag listeners for panel resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft) {
        const newWidth = Math.min(Math.max(e.clientX, 160), Math.max(window.innerWidth - 300, 300));
        setLeftWidth(newWidth);
      } else if (isDraggingRight) {
        const newWidth = Math.min(Math.max(window.innerWidth - e.clientX, 160), Math.max(window.innerWidth - 300, 300));
        setRightWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
    };

    if (isDraggingLeft || isDraggingRight) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingLeft, isDraggingRight]);

  const showToast = (message: string, model?: string, type: "info" | "success" | "ai" = "info") => {
    setNotification({ message, model, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchSceneGraph = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/scene-graph/${id}`);
      if (!res.ok) return;
      const data: SceneGraph = await res.json();
      setSceneGraph(data);
      if (data.room_type) setRoomType(data.room_type);
      if (data.design_style) setDesignStyle(data.design_style);

      const validIds = new Set(data.objects.map(o => o.id));
      setSelectedObjectIds(prev => prev.filter(oid => validIds.has(oid)));
      
      if (data.objects.length > 0 && !selectedObjectId) {
        setSelectedObjectId(data.objects[0].id);
        setSelectedObjectIds([data.objects[0].id]);
      }
    } catch (err) {
      console.error("Failed to fetch scene graph:", err);
    }
  };

  // Multi-User & Multi-Project State
  const [users, setUsers] = useState<User[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/users");
      if (res.ok) {
        const data: User[] = await res.json();
        setUsers(data);
        if (data.length > 0) {
          const savedUserId = typeof window !== "undefined" ? localStorage.getItem("antigravity_userId") : null;
          const found = data.find(u => u.id === savedUserId) || data[0];
          setActiveUser(found);
        }
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const fetchUserProjects = async (userId: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/users/${userId}/projects`);
      if (res.ok) {
        const data: Project[] = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error("Failed to fetch user projects:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeUser) {
      if (typeof window !== "undefined") {
        localStorage.setItem("antigravity_userId", activeUser.id);
      }
      fetchUserProjects(activeUser.id);
    }
  }, [activeUser?.id]);

  const handleSelectProject = (proj: Project) => {
    setRoomType(proj.room_type);
    setDesignStyle(proj.design_style);
    setImageId(proj.image_id);
    setSelectedObjectIds([]);
    fetchSceneGraph(proj.image_id);
    setViewMode("studio");
    showToast(`Launched Studio for '${proj.title}'`, "Project OS", "info");
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/projects/${projectId}`, { method: "DELETE" });
      if (res.ok && activeUser) {
        fetchUserProjects(activeUser.id);
        showToast("Deleted project from control panel.", "Projects OS", "info");
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  const handleDuplicateProject = async (projectId: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/projects/${projectId}/duplicate`, { method: "POST" });
      if (res.ok && activeUser) {
        fetchUserProjects(activeUser.id);
        showToast("Duplicated project in control panel.", "Projects OS", "success");
      }
    } catch (err) {
      console.error("Failed to duplicate project:", err);
    }
  };

  const handleLogOut = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("antigravity_userId");
    }
    setActiveUser(null);
    setProjects([]);
    showToast("Logged out of account session.", "Account System", "info");
    setShowAuthModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setSelectedObjectIds([]);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("room_type", roomType);
    formData.append("design_style", designStyle);
    formData.append("user_id", activeUser?.id || "");
    formData.append("project_title", `${roomType} (${file.name})`);

    try {
      const res = await fetch("http://localhost:8000/api/v1/analyze", {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const data: SceneGraph = await res.json();
        setSceneGraph(data);
        setImageId(data.image_id);
        if (data.objects.length > 0) {
          setSelectedObjectId(data.objects[0].id);
          setSelectedObjectIds([data.objects[0].id]);
        }
        if (activeUser) {
          fetchUserProjects(activeUser.id);
        }
        setViewMode("studio");
        showToast(`Analyzed ${roomType} (${data.objects.length} high-confidence elements).`, `${designStyle}`, "success");
      }
    } catch (err) {
      console.error("File upload error:", err);
      showToast("Analysis pipeline failed.", "API Error", "info");
    } finally {
      setUploading(false);
    }
  };

  const handleOrchestratorSuccess = (res: OrchestratorResponse) => {
    showToast(res.message, "Generative AI", "ai");

    if ((res.updated_object || res.updated_image_url) && sceneGraph) {
      pushHistorySnapshot();
      setSceneGraph((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          version: prev.version + 1,
          image_url: res.updated_image_url || prev.image_url,
          objects: res.updated_object
            ? prev.objects.map((obj) => (obj.id === res.updated_object?.id ? res.updated_object : obj))
            : prev.objects
        };
      });
    }
  };

  const handleClassUpdated = (updatedObj: SceneObject) => {
    showToast(`Updated class to '${updatedObj.class}'. Model learned new taxonomy!`, "Active Learning", "success");
    pushHistorySnapshot();
    setSceneGraph((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        version: prev.version + 1,
        objects: prev.objects.map((obj) => (obj.id === updatedObj.id ? updatedObj : obj))
      };
    });
  };

  const handleObjectDeleted = async (deletedId: string) => {
    try {
      pushHistorySnapshot();
      const res = await fetch(`http://localhost:8000/api/v1/object/${imageId}/${deletedId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        showToast(`Deleted object from scene graph.`, "Scene Graph Engine", "info");
        if (selectedObjectId === deletedId) {
          setSelectedObjectId(null);
        }
        setSelectedObjectIds((prev) => prev.filter((i) => i !== deletedId));
        setSceneGraph((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            version: prev.version + 1,
            objects: prev.objects.filter((obj) => obj.id !== deletedId),
            relationships: (prev.relationships || []).filter(
              (r) => r.subject_id !== deletedId && r.object_id !== deletedId
            )
          };
        });
      }
    } catch (err) {
      console.error("Failed to delete object:", err);
    }
  };

  const handleToggleSelectObject = (id: string | null, isMulti: boolean) => {
    if (!id) {
      setSelectedObjectId(null);
      setSelectedObjectIds([]);
      return;
    }
    if (isMulti) {
      setSelectedObjectIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
      setSelectedObjectId(id);
    } else {
      setSelectedObjectIds([id]);
      setSelectedObjectId(id);
    }
  };

  const handleMergeObjects = async () => {
    if (selectedObjectIds.length < 2) return;
    try {
      pushHistorySnapshot();
      const res = await fetch("http://localhost:8000/api/v1/object/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_id: imageId,
          object_ids: selectedObjectIds
        })
      });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message, "Object Merger Engine", "success");
        if (data.merged_object) {
          setSelectedObjectId(data.merged_object.id);
          setSelectedObjectIds([data.merged_object.id]);
        }
        fetchSceneGraph(imageId);
      }
    } catch (err) {
      console.error("Failed to merge objects:", err);
    }
  };

  const handleAddCustomObject = async (className: string, brushPoints: number[][]) => {
    if (!imageId || !className.trim() || brushPoints.length < 3) return;
    try {
      pushHistorySnapshot();
      const res = await fetch("http://localhost:8000/api/v1/object/add-custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_id: imageId,
          object_class: className.trim(),
          brush_points: brushPoints
        })
      });
      if (res.ok) {
        const data = await res.json();
        fetchSceneGraph(imageId);
        if (data.new_object) {
          setSelectedObjectId(data.new_object.id);
          setSelectedObjectIds([data.new_object.id]);
        }
        showToast(`Added custom object '${className}' to scene graph.`, "Active AI Learning", "success");
      }
    } catch (err) {
      console.error("Failed to add custom object:", err);
    }
  };

  const handleAIEditRegion = async (bbox: number[], objectName: string, prompt: string, points: number[][]) => {
    if (!imageId || !objectName.trim() || !prompt.trim()) return;
    setIsOrchestrating(true);
    try {
      pushHistorySnapshot();
      const res = await fetch("http://localhost:8000/api/v1/object/ai-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_id: imageId,
          bbox: bbox,
          object_name: objectName.trim(),
          prompt: prompt.trim(),
          points: points
        })
      });
      if (res.ok) {
        const data = await res.json();
        fetchSceneGraph(imageId);
        if (data.new_object) {
          setSelectedObjectId(data.new_object.id);
          setSelectedObjectIds([data.new_object.id]);
        }
        showToast(data.message || `Applied AI region edit for '${objectName}'.`, "Gemini AI Engine", "success");
      }
    } catch (err) {
      console.error("Failed to execute AI region edit:", err);
    } finally {
      setIsOrchestrating(false);
    }
  };

  const selectedObject = sceneGraph?.objects.find((obj) => obj.id === selectedObjectId) || null;

  return (
    <div className="w-screen h-screen flex flex-col bg-[#090a0f] text-slate-100 overflow-hidden select-none font-sans">
      <ProgressLoader
        isLoading={uploading || isOrchestrating}
        title={uploading ? `Analyzing ${roomType} Render...` : "Synthesizing AI Edit Instructions..."}
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Navigation & Context Selector Bar */}
      <header className="h-14 bg-[#0c0e14]/95 border-b border-slate-800/80 px-5 flex items-center justify-between z-20 shrink-0 backdrop-blur-md">
        <div className="flex items-center space-x-5">
          <button
            onClick={() => {
              setViewMode("home");
              showToast("Navigated to Home Landing Hub", "Studio Navigation", "info");
            }}
            className="flex items-center space-x-2.5 group focus:outline-none"
            title="Return to Home Dashboard"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              A
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-100 group-hover:text-cyan-300 transition-colors">Antigravity</span>
          </button>

          {/* High-Visibility Page Switching Pills */}
          <div className="flex items-center space-x-1 bg-slate-950/90 p-1 rounded-xl border border-slate-800/80 font-mono text-xs shadow-inner">
            <button
              onClick={() => {
                setViewMode("home");
                showToast("Navigated to Home Landing Hub", "Studio Navigation", "info");
              }}
              className={`px-3 py-1 rounded-lg transition-all flex items-center space-x-1.5 ${
                viewMode === "home"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-md shadow-cyan-500/25"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
            <button
              onClick={() => {
                setViewMode("projects");
                showToast("Navigated to Projects Portfolio", "Studio Navigation", "info");
              }}
              className={`px-3 py-1 rounded-lg transition-all flex items-center space-x-1.5 ${
                viewMode === "projects"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-md shadow-cyan-500/25"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Projects</span>
            </button>
            <button
              onClick={() => {
                setViewMode("studio");
                showToast(`Navigated to Studio Workspace (${roomType})`, "Studio Navigation", "info");
              }}
              className={`px-3 py-1 rounded-lg transition-all flex items-center space-x-1.5 ${
                viewMode === "studio"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-md shadow-cyan-500/25"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Studio Workspace</span>
            </button>
          </div>

          {viewMode === "studio" && (
            <button
              onClick={() => setShowSetupModal(true)}
              className="hidden md:flex items-center space-x-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/70 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 transition-all shadow-sm group"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-45 transition-transform" />
              <span>{roomType} • {designStyle}</span>
              <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/60 ml-1">Setup</span>
            </button>
          )}
        </div>

        {/* Minimal Actions */}
        <div className="flex items-center space-x-2.5">
          {notification && !uploading && !isOrchestrating && (
            <div className="text-xs px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 flex items-center space-x-2 animate-fade-in font-mono">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{notification.message}</span>
            </div>
          )}

          {viewMode === "studio" && (
            <>
              <button
                onClick={() => setShowBBoxes(!showBBoxes)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all border ${
                  showBBoxes
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-medium"
                    : "bg-slate-800/50 text-slate-400 border-slate-700/60 hover:text-slate-200"
                }`}
                title="Toggle Bounding Boxes"
              >
                Boxes: {showBBoxes ? "ON" : "OFF"}
              </button>

              <button
                onClick={handleUndo}
                disabled={historyStack.length === 0}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-all disabled:opacity-30"
                title="Undo Previous Action (Ctrl+Z / Cmd+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-all disabled:opacity-30"
                title="Redo Next Action (Ctrl+Shift+Z / Cmd+Shift+Z)"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => fetchSceneGraph(imageId)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-all"
                title="Refresh Scene Graph"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* Active User Account Menu & Auth Manager */}
          <UserAccountMenu
            users={users}
            activeUser={activeUser}
            onSelectUser={(u) => {
              setActiveUser(u);
              showToast(`Switched active workspace user to ${u.name}`, "Account System", "info");
            }}
            onLogOut={handleLogOut}
            onOpenAuthModal={() => setShowAuthModal(true)}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || isOrchestrating}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all shadow-md shadow-blue-600/20 active:scale-95 disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? `Analyzing ${roomType}...` : `Upload Render`}</span>
          </button>
        </div>
      </header>

      {/* View Mode Router: Home Landing vs Projects Portfolio vs Interactive Studio Workspace */}
      {viewMode === "home" ? (
        <HomePage
          activeUser={activeUser}
          projects={projects}
          onUploadClick={() => fileInputRef.current?.click()}
          onSelectProject={handleSelectProject}
          onDeleteProject={handleDeleteProject}
          selectedRoomType={roomType}
          selectedDesignStyle={designStyle}
          onOpenSetupModal={() => setShowSetupModal(true)}
        />
      ) : !activeUser ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#07080c] text-center relative select-none font-sans overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-cyan-600/10 blur-[130px] rounded-full pointer-events-none" />
          <div className="w-16 h-16 rounded-3xl bg-cyan-950 border border-cyan-500/60 flex items-center justify-center text-cyan-400 mb-5 shadow-2xl shadow-cyan-500/25 z-10">
            <Lock className="w-8 h-8 animate-pulse text-cyan-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 uppercase tracking-tight z-10">
            Workspace Inactive
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mt-2.5 leading-relaxed font-sans z-10">
            An authenticated studio account is required to activate spatial 3D rendering, scene graphs, and the projects control panel.
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold rounded-2xl text-xs shadow-xl shadow-cyan-500/30 flex items-center space-x-2 transition-all active:scale-95 z-10"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In or Register to Unlock</span>
          </button>
        </div>
      ) : viewMode === "projects" ? (
        <ProjectsPage
          activeUser={activeUser}
          projects={projects}
          onUploadClick={() => fileInputRef.current?.click()}
          onSelectProject={handleSelectProject}
          onDeleteProject={handleDeleteProject}
          onDuplicateProject={handleDuplicateProject}
          onOpenAuthModal={() => setShowAuthModal(true)}
        />
      ) : (
        <div className="flex-1 flex overflow-hidden relative">
          <LayersSidebar
            sceneGraph={sceneGraph}
            selectedObjectId={selectedObjectId}
            selectedObjectIds={selectedObjectIds}
            onSelectObject={(id) => setSelectedObjectId(id)}
            onToggleSelectObject={handleToggleSelectObject}
            onMergeObjects={handleMergeObjects}
            onDeleteObject={handleObjectDeleted}
            width={leftWidth}
          />

          {/* Left Resizer Handle */}
          <div
            onMouseDown={() => setIsDraggingLeft(true)}
            className="w-1.5 h-full cursor-col-resize bg-slate-800/40 hover:bg-cyan-500/50 active:bg-cyan-500 transition-colors shrink-0 z-30 flex items-center justify-center group"
            title="Drag to resize left panel width"
          >
            <div className="w-0.5 h-6 bg-slate-600 group-hover:bg-cyan-300 rounded" />
          </div>

          <main className="flex-1 h-full relative">
            <InteractiveCanvas
              sceneGraph={sceneGraph}
              selectedObjectId={selectedObjectId}
              selectedObjectIds={selectedObjectIds}
              hoveredObjectId={hoveredObjectId}
              showBBoxes={showBBoxes}
              onSelectObject={(id, isMulti = false) => handleToggleSelectObject(id, isMulti)}
              onHoverObject={(id) => setHoveredObjectId(id)}
              onAddCustomObject={handleAddCustomObject}
              onAIEditRegion={handleAIEditRegion}
            />
          </main>

          {/* Right Resizer Handle */}
          <div
            onMouseDown={() => setIsDraggingRight(true)}
            className="w-1.5 h-full cursor-col-resize bg-slate-800/40 hover:bg-cyan-500/50 active:bg-cyan-500 transition-colors shrink-0 z-30 flex items-center justify-center group"
            title="Drag to resize right panel width"
          >
            <div className="w-0.5 h-6 bg-slate-600 group-hover:bg-cyan-300 rounded" />
          </div>

          <Inspector
            selectedObject={selectedObject}
            imageId={imageId}
            onOrchestratorSuccess={handleOrchestratorSuccess}
            onClassUpdated={handleClassUpdated}
            onObjectDeleted={handleObjectDeleted}
            onOrchestrateStart={() => setIsOrchestrating(true)}
            onOrchestrateEnd={() => setIsOrchestrating(false)}
            width={rightWidth}
          />
        </div>
      )}

      {/* Interactive Room Function & Architectural Style Setup Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="w-full max-w-3xl bg-[#0c0e14] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-100">Architectural Scene Context Setup</h2>
                  <p className="text-[11px] text-slate-400">Select room function & design style to tailor zero-shot vision detection.</p>
                </div>
              </div>
              <button
                onClick={() => setShowSetupModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content Grid */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {/* Step 1: Select Room Function */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">1</span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Select Room Function</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {ROOM_OPTIONS.map((room) => {
                    const isSelected = roomType === room.id;
                    return (
                      <button
                        key={room.id}
                        onClick={() => setRoomType(room.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-blue-600/20 border-blue-500/80 text-blue-200 shadow-lg shadow-blue-600/10 font-medium"
                            : "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700"
                        }`}
                      >
                        <div className="text-base mb-1">{room.icon}</div>
                        <div className="text-xs font-semibold">{room.label}</div>
                        <div className="text-[10px] text-slate-500 leading-tight mt-1 truncate">{room.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Select Architectural Style */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <span className="w-5 h-5 rounded-full bg-cyan-600 text-white text-[10px] font-bold flex items-center justify-center">2</span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Select Architectural Style</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {STYLE_OPTIONS.map((style) => {
                    const isSelected = designStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        onClick={() => setDesignStyle(style.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-cyan-600/20 border-cyan-500/80 text-cyan-200 shadow-lg shadow-cyan-600/10 font-medium"
                            : "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700"
                        }`}
                      >
                        <div className="text-xs font-semibold">{style.label}</div>
                        <div className="text-[10px] text-slate-500 leading-tight mt-1 line-clamp-2">{style.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
              <div className="text-xs text-slate-400 font-mono">
                Active: <span className="text-cyan-300 font-semibold">{roomType}</span> • <span className="text-blue-300 font-semibold">{designStyle}</span>
              </div>
              <button
                onClick={() => {
                  setShowSetupModal(false);
                  fileInputRef.current?.click();
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-blue-600/25 active:scale-95 transition-all"
              >
                <span>Upload & Analyze Render</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login & Registration Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(u) => {
          setActiveUser(u);
          fetchUsers();
          showToast(`Welcome back, ${u.name}! Signed into workspace.`, "Auth Manager", "success");
        }}
      />
    </div>
  );
}
