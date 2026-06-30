"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { SceneGraph, SceneObject, OrchestratorResponse, User, Project } from "@/types/scene";
import LayersSidebar from "@/components/LayersSidebar";
import Inspector from "@/components/Inspector";
import HomePage from "@/components/HomePage";
import ProjectsPage from "@/components/ProjectsPage";
import AboutPage from "@/components/AboutPage";
import PricingPage from "@/components/PricingPage";
import AccountPage from "@/components/AccountPage";
import AuthModal from "@/components/AuthModal";
import ProgressLoader from "@/components/ProgressLoader";
import UserAccountMenu from "@/components/UserAccountMenu";
import ThemeToggle from "@/components/ThemeToggle";
import { API_BASE, parseApiError, fetchUserById } from "@/lib/api";
import { Sparkles, Upload, RefreshCw, Cpu, CheckCircle2, Scan, Loader2, Home, Palette, Sliders, Layers, ArrowRight, X, LayoutDashboard, Plus, Trash2, Folder, Undo2, Redo2, ShieldAlert, LogIn, Lock, Info, Tag, Download, Wand2, User as UserIcon, Sofa, ChefHat, Bed, Bath, Briefcase, Coffee, Trees } from "lucide-react";


const InteractiveCanvas = dynamic(() => import("@/components/InteractiveCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-background text-muted-foreground font-mono text-xs space-y-3 select-none">
      <Cpu className="w-5 h-5 text-cyan-400 animate-spin" />
      <span>Loading your design...</span>
    </div>
  )
});

const ROOM_OPTIONS = [
  { id: "Living Room", label: "Living Room", icon: Sofa, desc: "Sofas, coffee tables, TV consoles, lounge armchairs" },
  { id: "Kitchen", label: "Kitchen", icon: ChefHat, desc: "Kitchen islands, stoves, refrigerators, cabinets, sinks" },
  { id: "Bedroom", label: "Bedroom", icon: Bed, desc: "Beds, nightstands, headboards, wardrobes, dressers" },
  { id: "Bathroom", label: "Bathroom", icon: Bath, desc: "Bathtubs, shower enclosures, vanities, mirrors, sinks" },
  { id: "Office & Study", label: "Office & Study", icon: Briefcase, desc: "Executive desks, task chairs, bookcases, monitors" },
  { id: "Cafe & Restaurant", label: "Cafe & Restaurant", icon: Coffee, desc: "Espresso machines, cafe tables, bar counters, displays" },
  { id: "Outdoor Patio", label: "Outdoor Patio", icon: Trees, desc: "Patio loungers, outdoor dining, pergolas, planters" }
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
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<"home" | "about" | "pricing" | "projects" | "account" | "studio">("home");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sceneGraph, setSceneGraph] = useState<SceneGraph | null>(null);

  const navigateToPage = (mode: "home" | "about" | "pricing" | "projects" | "account" | "studio", pushHistory: boolean = true) => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      if (mode !== "studio") {
        localStorage.setItem("antigravity_viewMode", mode);
      }
      if (pushHistory && window.location.hash !== `#${mode}`) {
        window.history.pushState({ viewMode: mode }, "", `#${mode}`);
      }
    }
  };

  const clearStudioWorkspace = () => {
    setImageId("");
    setSceneGraph(null);
    setSelectedObjectId(null);
    setSelectedObjectIds([]);
    setHoveredObjectId(null);
    setHistoryStack([]);
    setRedoStack([]);
  };

  const loadStudioProject = (id: string, nextRoomType?: string, nextDesignStyle?: string) => {
    setImageId(id);
    if (nextRoomType) setRoomType(nextRoomType);
    if (nextDesignStyle) setDesignStyle(nextDesignStyle);
    fetchSceneGraph(id);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("image", id);
      if (nextRoomType) url.searchParams.set("room", nextRoomType);
      if (nextDesignStyle) url.searchParams.set("style", nextDesignStyle);
      window.history.replaceState({ viewMode: "studio" }, "", `${url.pathname}${url.search}#studio`);
    }
  };

  const openStudioWorkspace = (options?: {
    imageId?: string;
    roomType?: string;
    designStyle?: string;
  }) => {
    if (typeof window === "undefined") return;

    const nextRoomType = options?.roomType ?? roomType;
    const nextDesignStyle = options?.designStyle ?? designStyle;

    const params = new URLSearchParams();
    if (options?.imageId) params.set("image", options.imageId);
    params.set("room", nextRoomType);
    params.set("style", nextDesignStyle);

    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}#studio`;
    const opened = window.open(url, "_blank", "noopener,noreferrer");

    if (!opened) {
      showToast("Allow pop-ups to open the studio in a new tab.", "Navigation", "info");
    } else {
      showToast(
        options?.imageId ? "Project opened in studio." : "Empty studio opened in a new tab.",
        "Navigation",
        "info"
      );
    }
  };

  const isStudio = viewMode === "studio";

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "") as any;
      if (["home", "about", "pricing", "projects", "account", "studio"].includes(hash)) {
        setViewMode(hash);
      }
      const handlePopState = (e: PopStateEvent) => {
        if (e.state && e.state.viewMode) {
          setViewMode(e.state.viewMode);
        } else {
          const currentHash = window.location.hash.replace("#", "") as any;
          if (["home", "about", "pricing", "projects", "account", "studio"].includes(currentHash)) {
            setViewMode(currentHash);
          }
        }
      };
      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, []);

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
    showToast("Undid last change.", "History", "info");
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
    showToast("Redid last change.", "History", "info");
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
  const [imageId, setImageId] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Restore State from localStorage on Mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      const params = new URLSearchParams(window.location.search);
      const launchImageId = params.get("image");
      const launchRoom = params.get("room");
      const launchStyle = params.get("style");

      const savedViewMode = localStorage.getItem("antigravity_viewMode") as "home" | "studio";
      const savedRoomType = localStorage.getItem("antigravity_roomType");
      const savedDesignStyle = localStorage.getItem("antigravity_designStyle");
      const savedLeftWidth = localStorage.getItem("antigravity_leftWidth");
      const savedRightWidth = localStorage.getItem("antigravity_rightWidth");

      if (hash === "studio" || launchImageId) {
        setViewMode("studio");
        if (launchImageId) {
          setImageId(launchImageId);
          fetchSceneGraph(launchImageId);
        } else {
          clearStudioWorkspace();
          localStorage.removeItem("antigravity_imageId");
        }
      } else if (["home", "about", "pricing", "projects", "account"].includes(hash)) {
        setViewMode(hash as typeof viewMode);
      } else if (savedViewMode && savedViewMode !== "studio") {
        setViewMode(savedViewMode);
      }

      if (launchRoom) setRoomType(launchRoom);
      else if (savedRoomType) setRoomType(savedRoomType);

      if (launchStyle) setDesignStyle(launchStyle);
      else if (savedDesignStyle) setDesignStyle(savedDesignStyle);

      if (savedLeftWidth) setLeftWidth(parseInt(savedLeftWidth, 10));
      if (savedRightWidth) setRightWidth(parseInt(savedRightWidth, 10));

      setIsInitialized(true);
    }
  }, []);


  // Synchronize State Updates to localStorage
  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      if (viewMode === "studio" && imageId) {
        localStorage.setItem("antigravity_imageId", imageId);
      }
      if (viewMode !== "studio") {
        localStorage.setItem("antigravity_viewMode", viewMode);
      }
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
      if (!res.ok) {
        if (res.status === 404) {
          setImageId("");
          setSceneGraph(null);
        }
        return;
      }
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
  const activeProject = imageId ? projects.find(p => p.image_id === imageId) : undefined;
  const activeProjectTitle = activeProject?.title ?? (imageId ? "Untitled project" : "No project open");
  const hasOpenProject = Boolean(sceneGraph);
  const isLoadingProject = Boolean(imageId && !sceneGraph && !uploading);

  const applyUserUpdate = (user: User) => {
    setActiveUser(user);
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === user.id);
      return exists ? prev.map((u) => (u.id === user.id ? user : u)) : [...prev, user];
    });
    if (typeof window !== "undefined") {
      localStorage.setItem("antigravity_userId", user.id);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/users`);
      if (res.ok) {
        const data: User[] = await res.json();
        setUsers(data);
      }
      const savedUserId = typeof window !== "undefined" ? localStorage.getItem("antigravity_userId") : null;
      if (savedUserId) {
        const fresh = await fetchUserById(savedUserId);
        if (fresh) {
          applyUserUpdate(fresh);
        } else if (typeof window !== "undefined") {
          localStorage.removeItem("antigravity_userId");
          setActiveUser(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const handleUpgradePlan = async (planName: string): Promise<boolean> => {
    if (!activeUser) return false;
    try {
      const res = await fetch(`${API_BASE}/api/v1/users/${activeUser.id}/upgrade-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planName }),
      });
      if (res.ok) {
        const updated: User = await res.json();
        applyUserUpdate(updated);
        showToast(`You're now on ${planName}. Credits updated.`, "Billing", "success");
        return true;
      }
      const data = await res.json().catch(() => ({}));
      showToast(parseApiError(data, "Could not change plan."), "Billing", "info");
      return false;
    } catch (err) {
      console.error("Upgrade error:", err);
      showToast("Can't reach billing server.", "Billing", "info");
      return false;
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
      fetchUserProjects(activeUser.id);
    }
  }, [activeUser?.id]);

  const handleSelectProject = (proj: Project) => {
    openStudioWorkspace({
      imageId: proj.image_id,
      roomType: proj.room_type,
      designStyle: proj.design_style,
    });
    showToast(`Opened "${proj.title}" in studio`, "Projects", "info");
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const url = activeUser ? `http://localhost:8000/api/v1/projects/${projectId}?user_id=${activeUser.id}` : `http://localhost:8000/api/v1/projects/${projectId}`;
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok && activeUser) {
        fetchUserProjects(activeUser.id);
        showToast("Project deleted.", "Projects", "info");
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  const handleDuplicateProject = async (projectId: string) => {
    try {
      const url = activeUser ? `http://localhost:8000/api/v1/projects/${projectId}/duplicate?user_id=${activeUser.id}` : `http://localhost:8000/api/v1/projects/${projectId}/duplicate`;
      const res = await fetch(url, { method: "POST" });
      if (res.ok && activeUser) {
        fetchUserProjects(activeUser.id);
        showToast("Project duplicated.", "Projects", "success");
      }
    } catch (err) {
      console.error("Failed to duplicate project:", err);
    }
  };


  const handleLogOut = async () => {
    try {
      await fetch(`${API_BASE}/api/v1/auth/logout`, { method: "POST" });
    } catch {
      // ignore logout network errors
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("antigravity_userId");
    }
    setActiveUser(null);
    setProjects([]);
    setSceneGraph(null);
    setImageId("");
    setSelectedObjectIds([]);
    navigateToPage("home");
    showToast("Signed out.", "Account", "info");
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
        if (activeUser) {
          fetchUserProjects(activeUser.id);
        }
        if (viewMode === "studio") {
          loadStudioProject(data.image_id, roomType, designStyle);
          setSceneGraph(data);
          if (data.objects.length > 0) {
            setSelectedObjectId(data.objects[0].id);
            setSelectedObjectIds([data.objects[0].id]);
          }
        } else {
          openStudioWorkspace({
            imageId: data.image_id,
            roomType,
            designStyle,
          });
        }
        showToast(`Found ${data.objects.length} items in your ${roomType} photo.`, `${designStyle}`, "success");
      }
    } catch (err) {
      console.error("File upload error:", err);
      showToast("Couldn't analyze your photo. Try again.", "Upload", "info");
    } finally {
      setUploading(false);
    }
  };

  const recordEditTrial = async () => {
    if (!activeUser) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/users/${activeUser.id}/record-edit`, { method: "POST" });
      if (res.ok) {
        const updatedUser: User = await res.json();
        const prevCredits = activeUser.credits ?? 1000;
        applyUserUpdate(updatedUser);
        if (updatedUser.credits !== prevCredits) {
          showToast(`Used 25 credits (10 AI edits). ${updatedUser.credits} credits left.`, "Credits", "info");
        }
      } else if (res.status === 402) {
        const data = await res.json().catch(() => ({}));
        showToast(parseApiError(data, "Not enough credits."), "Credits", "info");
        navigateToPage("pricing");
      }
    } catch (err) {
      console.error("Failed to record edit trial credits:", err);
    }
  };

  const handleOrchestratorSuccess = (res: OrchestratorResponse) => {
    showToast(res.message, "AI Edit", "ai");
    recordEditTrial();


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
    showToast(`Renamed to "${updatedObj.class}". We'll remember this next time.`, "Saved", "success");
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
        showToast("Item removed.", "Design", "info");
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
        showToast(data.message, "Design", "success");
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
        showToast(`Added "${className}" to your design.`, "Design", "success");
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
        showToast(data.message || `AI edit applied to "${objectName}".`, "AI Edit", "success");
        recordEditTrial();
      }
    } catch (err) {
      console.error("Failed to execute AI region edit:", err);
    } finally {
      setIsOrchestrating(false);
    }
  };



  const handleDownloadRender = async () => {
    if (!activeUser) {
      setShowAuthModal(true);
      return;
    }
    try {
      const res = await fetch(`http://localhost:8000/api/v1/users/${activeUser.id}/deduct-download`, { method: "POST" });
      if (res.ok) {
        const updatedUser: User = await res.json();
        setActiveUser(updatedUser);
        showToast(`Download used 50 credits. ${updatedUser.credits} left.`, "Download", "success");

        // Trigger robust cross-origin browser blob download
        const targetUrl = sceneGraph?.image_url || "http://localhost:8000/uploads/demo_render_01.jpg";
        const imgRes = await fetch(targetUrl);
        const blob = await imgRes.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `antigravity_render_${imageId || "design"}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } else {
        const errData = await res.json();
        showToast(errData.detail || "Not enough credits (50 needed).", "Credits", "info");
        setViewMode("pricing");
      }
    } catch (err) {
      console.error("Download failed:", err);
    }
  };



  const selectedObject = sceneGraph?.objects.find((obj) => obj.id === selectedObjectId) || null;

  const navLinkClass = (active: boolean) =>
    `px-2 md:px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 lg:gap-2 active:scale-[0.97] shrink-0 ${
      active
        ? "bg-[#4F46E5] text-white border border-[#E2E8F0] font-bold shadow-sm"
        : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100"
    }`;

  return (
    <div className="w-screen h-screen flex flex-col bg-background text-foreground overflow-hidden select-none font-sans">
      <ProgressLoader
        isLoading={uploading || isOrchestrating}
        title={uploading ? `Analyzing your ${roomType} photo...` : "Applying your AI edit..."}
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Navigation & Context Selector Bar */}
      <header
        className={`bg-white border-b border-[#E2E8F0] z-20 shrink-0 w-full min-w-0 transition-all duration-200 ${
          isStudio
            ? "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 sm:gap-2 h-10 px-2 sm:px-3"
            : "flex items-center gap-2 sm:gap-3 md:gap-4 h-14 sm:h-16 md:h-[4.75rem] lg:h-20 px-3 sm:px-4 md:px-6 lg:px-8"
        }`}
      >
        <div className={`flex items-center min-w-0 ${
          isStudio
            ? "justify-self-start gap-2"
            : "flex-1 gap-2 sm:gap-3 md:gap-4 lg:gap-6"
        }`}>
          <button
            onClick={() => {
              navigateToPage("home");
              showToast("Opened home", "Navigation", "info");
            }}
            className="flex items-center gap-2 sm:gap-2.5 group focus:outline-none shrink-0"
            title="Back to home"
          >
            <img
              src="/logo.png"
              alt="DesAIgn"
              className={`rounded-lg shrink-0 ${isStudio ? "w-7 h-7" : "w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 lg:w-12 lg:h-12"}`}
            />
            <span
              className={`font-bold tracking-tight text-[#0F172A] group-hover:text-[#4F46E5] transition-colors font-display truncate ${
                isStudio ? "text-xs hidden sm:inline max-w-[7rem]" : "text-sm sm:text-base md:text-lg hidden sm:inline max-w-[6rem] sm:max-w-none"
              }`}
            >
              DesAIgn
            </span>
          </button>

          {/* Full navigation — hidden in compact studio workspace */}
          {!isStudio && (
          <nav className="flex-1 min-w-0 overflow-x-auto scrollbar-none -mx-1 px-1">
            <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-50 p-1 sm:p-1.5 rounded-2xl border border-[#E2E8F0] font-mono text-sm shadow-sm w-max max-w-full">
            <button
              onClick={() => {
                navigateToPage("home");
                showToast("Opened home", "Navigation", "info");
              }}
              className={navLinkClass(viewMode === "home")}
              title="Home"
            >
              <Home className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Home</span>
            </button>

            <button
              onClick={() => {
                navigateToPage("about");
                showToast("Opened about page", "Navigation", "info");
              }}
              className={navLinkClass(viewMode === "about")}
              title="About"
            >
              <Info className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">About</span>
            </button>

            <button
              onClick={() => {
                navigateToPage("pricing");
                showToast("Opened pricing", "Navigation", "info");
              }}
              className={navLinkClass(viewMode === "pricing")}
              title="Pricing"
            >
              <Tag className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Pricing</span>
            </button>

            {mounted && activeUser && (
              <>
                <button
                  onClick={() => {
                    navigateToPage("projects");
                    showToast("Opened projects", "Navigation", "info");
                  }}
                  className={navLinkClass(viewMode === "projects")}
                  title="Projects"
                >
                  <Folder className="w-4 h-4 shrink-0" />
                  <span className="hidden md:inline">Projects</span>
                </button>

                <button
                  onClick={() => {
                    openStudioWorkspace();
                    showToast(`Opening studio (${roomType})`, "Navigation", "info");
                  }}
                  className={navLinkClass(false)}
                  title="Open studio in a new tab"
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <span className="hidden lg:inline">Studio</span>
                </button>
              </>
            )}
            </div>
          </nav>
          )}

          {isStudio && (
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#4F46E5] hidden sm:inline truncate">
              Workspace
            </span>
          )}
        </div>

        {/* Center - Project details if in studio mode */}
        {isStudio && (
          <div className="hidden sm:flex items-center min-w-0 max-w-[min(42vw,16rem)] md:max-w-[min(40vw,20rem)] justify-self-center bg-white px-2 md:px-3 py-1 rounded-lg border border-[#E2E8F0] shadow-sm z-10">
            <span className="text-[10px] font-bold text-[#0F172A] font-display truncate">{activeProjectTitle}</span>
            <span className="h-3 w-[1px] bg-[#E2E8F0] shrink-0 mx-1.5 md:mx-2" />
            <button
              onClick={() => setShowSetupModal(true)}
              className="text-[9px] text-[#64748B] hover:text-[#4F46E5] font-mono uppercase font-bold truncate min-w-0"
              title={`${roomType} • ${designStyle}`}
            >
              <span className="truncate">{roomType} • {designStyle}</span>
            </button>
          </div>
        )}

        {/* Right side actions */}
        <div className={`flex items-center min-w-0 ${isStudio ? "justify-self-end gap-1 sm:gap-1.5" : "shrink-0 ml-auto gap-1.5 sm:gap-2 md:gap-3"}`}>
          
          {isStudio && (
            <>
              <button
                onClick={() => setShowBBoxes(!showBBoxes)}
                className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] font-mono transition-all border shrink-0 ${showBBoxes
                    ? "bg-[#4F46E5]/10 text-[#4F46E5] border-[#4F46E5] font-medium"
                    : "bg-white text-[#64748B] border border-[#E2E8F0] hover:text-[#0F172A]"
                  }`}
                title={`Object outlines: ${showBBoxes ? "On" : "Off"}`}
              >
                <Scan className="w-3 h-3 sm:hidden" />
                <span className="hidden sm:inline">Outlines: {showBBoxes ? "On" : "Off"}</span>
              </button>

              <button
                onClick={handleUndo}
                disabled={!hasOpenProject || historyStack.length === 0}
                className="p-1 text-[#64748B] hover:text-[#4F46E5] hover:bg-slate-50 border border-transparent hover:border-[#E2E8F0] rounded-md transition-all disabled:opacity-30 shrink-0"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-3 h-3" />
              </button>

              <button
                onClick={handleRedo}
                disabled={!hasOpenProject || redoStack.length === 0}
                className="p-1 text-[#64748B] hover:text-[#4F46E5] hover:bg-slate-50 border border-transparent hover:border-[#E2E8F0] rounded-md transition-all disabled:opacity-30 shrink-0"
                title="Redo (Ctrl+Shift+Z)"
              >
                <Redo2 className="w-3 h-3" />
              </button>

              <button
                onClick={() => fetchSceneGraph(imageId)}
                disabled={!hasOpenProject}
                className="p-1 text-[#64748B] hover:text-[#4F46E5] hover:bg-slate-50 border border-transparent hover:border-[#E2E8F0] rounded-md transition-all disabled:opacity-30 shrink-0"
                title="Refresh design"
              >
                <RefreshCw className="w-3 h-3" />
              </button>

              <button
                onClick={handleDownloadRender}
                disabled={!hasOpenProject}
                className="px-1.5 sm:px-2 py-1 bg-[#4F46E5] hover:bg-[#6366F1] text-white border-0 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all shadow-sm active:scale-95 disabled:opacity-40 shrink-0"
                title="Download image (50 credits)"
              >
                <Download className="w-3 h-3 shrink-0" />
                <span className="hidden xl:inline whitespace-nowrap">Download (50 credits)</span>
                <span className="hidden md:inline xl:hidden">Save</span>
              </button>

              {activeUser && (
                <div className="hidden xl:flex items-center space-x-1 px-2 py-1 bg-white border border-[#E2E8F0] rounded-lg text-[10px] font-mono text-[#64748B] shrink-0 whitespace-nowrap" title="AI edit counter">
                  <Wand2 className="w-3 h-3 text-[#4F46E5]" />
                  <span>Edits: <strong className="text-[#0F172A]">{activeUser.edit_count || 0}</strong></span>
                </div>
              )}
            </>
          )}

          {/* Active User Account Menu & Auth Manager */}
          <ThemeToggle />

          <UserAccountMenu
            users={users}
            activeUser={activeUser}
            onSelectUser={(u) => {
              applyUserUpdate(u);
              showToast(`Switched to ${u.name}`, "Account", "info");
            }}
            onLogOut={handleLogOut}
            onOpenAuthModal={() => setShowAuthModal(true)}
            onOpenAccountPage={() => navigateToPage("account")}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || isOrchestrating}
            className={`bg-[#4F46E5] hover:bg-[#6366F1] text-white rounded-xl font-bold flex items-center border-0 transition-all shadow-md active:scale-95 disabled:opacity-50 shrink-0 ${
              isStudio
                ? "px-2 sm:px-2.5 py-1 text-[10px] gap-1"
                : "px-2.5 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm gap-1.5 sm:gap-2"
            }`}
            title={uploading ? "Analyzing..." : "Upload photo"}
          >
            <Upload className={`shrink-0 ${isStudio ? "w-3 h-3" : "w-3.5 h-3.5 sm:w-4 sm:h-4"}`} />
            <span className={isStudio ? "inline" : "hidden sm:inline"}>
              {uploading ? "Analyzing..." : isStudio ? "Upload" : "Upload photo"}
            </span>
          </button>
        </div>
      </header>

      {/* View Mode Router: Home vs About vs Pricing vs Projects vs Interactive Studio Workspace */}
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
      ) : viewMode === "about" ? (
        <AboutPage
          onOpenStudio={() => {
            if (activeUser) openStudioWorkspace();
            else setShowAuthModal(true);
          }}
          onOpenPricing={() => navigateToPage("pricing")}
        />
      ) : viewMode === "pricing" ? (
        <PricingPage
          activeUser={activeUser}
          onOpenAuthModal={() => setShowAuthModal(true)}
          onUpgradePlan={handleUpgradePlan}
        />
      ) : (mounted && !activeUser) ? (


        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#FAFAF9] text-center relative select-none font-sans overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#4F46E5]/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="w-16 h-16 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center mb-5 z-10 shadow-sm">
            <Lock className="w-8 h-8 text-[#4F46E5]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] uppercase tracking-tight z-10">
            Sign in to continue
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-md mt-2.5 leading-relaxed font-sans z-10">
            Sign in to open the studio, save projects, and edit your designs.
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="mt-6 px-6 py-3 bg-[#4F46E5] hover:bg-[#6366F1] text-white border-0 font-extrabold rounded-xl text-xs flex items-center space-x-2 transition-all active:scale-95 z-10 shadow-lg shadow-[#4F46E5]/15"
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
      ) : viewMode === "account" ? (
        <AccountPage
          activeUser={activeUser}
          projects={projects}
          onUpdateUser={applyUserUpdate}
          onOpenAuthModal={() => setShowAuthModal(true)}
          onLogOut={handleLogOut}
          onNavigateToPricing={() => navigateToPage("pricing")}
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
            className="w-1.5 h-full cursor-col-resize bg-transparent hover:bg-accent-cyan/10 transition-colors shrink-0 z-30 flex items-center justify-center group"
            title="Drag to resize left panel width"
          >
            <div className="w-0.5 h-6 bg-transparent group-hover:bg-accent-cyan rounded" />
          </div>

          <main className="flex-1 h-full relative overflow-hidden bg-background">
            {hasOpenProject ? (
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
            ) : isLoadingProject ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#FAFAF9] text-muted-foreground font-mono text-xs space-y-3 select-none">
                <Cpu className="w-5 h-5 text-cyan-400 animate-spin" />
                <span>Loading your design...</span>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#FAFAF9] text-center px-6 select-none">
                <div className="w-16 h-16 rounded-2xl bg-white border border-[#E2E8F0] flex items-center justify-center mb-5 shadow-sm">
                  <Upload className="w-7 h-7 text-[#4F46E5]" />
                </div>
                <h2 className="text-lg font-bold text-[#0F172A]">Start a new design</h2>
                <p className="text-sm text-[#64748B] max-w-sm mt-2 leading-relaxed">
                  Upload a room photo to begin, or open an existing project from your projects list.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="mt-6 px-5 py-2.5 bg-[#4F46E5] hover:bg-[#6366F1] text-white rounded-xl text-sm font-bold flex items-center space-x-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploading ? "Analyzing..." : "Upload photo"}</span>
                </button>
              </div>
            )}

            {/* AI Scan line simulation on generation or upload */}
            {(uploading || isOrchestrating) && (
              <div className="absolute inset-0 pointer-events-none z-30">
                <div className="w-full h-1/6 scan-line animate-scan absolute top-0" />
              </div>
            )}
          </main>

          {/* Right Resizer Handle */}
          <div
            onMouseDown={() => setIsDraggingRight(true)}
            className="w-1.5 h-full cursor-col-resize bg-transparent hover:bg-accent-cyan/10 transition-colors shrink-0 z-30 flex items-center justify-center group"
            title="Drag to resize right panel width"
          >
            <div className="w-0.5 h-6 bg-transparent group-hover:bg-accent-cyan rounded" />
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
        <div className="fixed inset-0 z-50 bg-[#0F172A]/30 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="w-full max-w-3xl bg-white border border-[#E2E8F0] rounded-xl shadow-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#4F46E5] shadow-sm">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#0F172A]">Project setup</h2>
                  <p className="text-[11px] text-[#64748B]">Choose the room type and style so we detect the right items.</p>
                </div>
              </div>
              <button
                onClick={() => setShowSetupModal(false)}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 border border-transparent hover:border-[#E2E8F0] rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content Grid */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar font-sans">
              {/* Step 1: Select Room Function */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <span className="w-5 h-5 rounded-full bg-[#4F46E5]/10 border border-[#E2E8F0] text-[#4F46E5] text-[10px] font-bold flex items-center justify-center">1</span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">Choose room type</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {ROOM_OPTIONS.map((room) => {
                    const isSelected = roomType === room.id;
                    const IconComp = room.icon;
                    return (
                      <button
                        key={room.id}
                        onClick={() => setRoomType(room.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all duration-200 active:scale-[0.97] ${isSelected
                            ? "bg-slate-50 border-[#4F46E5] text-[#0F172A] font-semibold"
                            : "bg-white border-[#E2E8F0] text-[#64748B] hover:bg-slate-50 hover:border-[#4F46E5]"
                          }`}
                      >
                        <div className="p-2 rounded-lg bg-white border border-[#E2E8F0] w-fit mb-2 text-[#64748B]">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div className="text-xs font-semibold">{room.label}</div>
                        <div className="text-[10px] text-[#64748B]/75 leading-tight mt-1 truncate">{room.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Select Architectural Style */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <span className="w-5 h-5 rounded-full bg-[#4F46E5]/10 border border-[#E2E8F0] text-[#4F46E5] text-[10px] font-bold flex items-center justify-center">2</span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">Choose design style</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {STYLE_OPTIONS.map((style) => {
                    const isSelected = designStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        onClick={() => setDesignStyle(style.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${isSelected
                            ? "bg-slate-50 border-[#4F46E5] text-[#0F172A] font-semibold"
                            : "bg-white border-[#E2E8F0] text-[#64748B] hover:bg-slate-50 hover:border-[#4F46E5]"
                          }`}
                      >
                        <div className="text-xs font-semibold">{style.label}</div>
                        <div className="text-[10px] text-[#64748B]/75 leading-tight mt-1 line-clamp-2">{style.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 border-t border-[#E2E8F0] bg-slate-50 flex items-center justify-between">
              <div className="text-xs text-[#64748B] font-mono">
                Active: <span className="text-[#0F172A] font-semibold">{roomType}</span> • <span className="text-[#0F172A] font-semibold">{designStyle}</span>
              </div>
              <button
                onClick={() => {
                  setShowSetupModal(false);
                  fileInputRef.current?.click();
                }}
                className="px-4 py-2 bg-[#4F46E5] hover:bg-[#6366F1] text-white border-0 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all active:scale-95 shadow-md shadow-[#4F46E5]/15"
              >
                <span>Upload & analyze photo</span>
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
          applyUserUpdate(u);
          fetchUsers();
          showToast(`Welcome, ${u.name}!`, "Account", "success");
        }}

      />
    </div>
  );
}
