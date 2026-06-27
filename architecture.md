# Antigravity Architecture & Competitive Advantage Specification

## Competitive Advantage: Editable World Model

Most generative AI image systems follow a direct, non-interactive generation pattern:
$$\text{Image} \longrightarrow \text{Generative AI} \longrightarrow \text{Static Render}$$

**Antigravity** introduces an AI System Layer that converts architectural renders into an interactive spatial environment before image generation occurs:
$$\text{Render} \longrightarrow \text{Scene Understanding} \longrightarrow \text{Digital Scene Graph} \longrightarrow \text{AI Editing Orchestrator} \longrightarrow \text{Versioned Design System}$$

---

## Multi-Model Vision Pipeline Architecture

```
                       [ Input Architectural Render ]
                                      │
                                      ▼
                           [ DINOv2 Feature Backbone ]
                                      │
                  ┌───────────────────┴───────────────────┐
                  ▼                                       ▼
    [ Grounding DINO Object Detector ]       [ OpenCLIP Feature Embeddings ]
                  │                                       │
                  ▼                                       ▼
  [ SAM 2 Segment Anything Model v2 ]          [ Material & Style Classifier ]
                  │                                       │
                  ▼                                       │
    [ Editable Pixel-Perfect Masks ]                      │
                  │                                       │
                  └───────────────────┬───────────────────┘
                                      ▼
                        [ Depth Anything V2 Engine ]
                                      │
                                      ▼
                        [ Scene Graph Builder (Core IP) ]
```

---

## The 3-Model MVP Core Stack

1. **Grounding DINO** (Object Detection): Detects architectural elements (*Roof, Wall, Window, Door, Garage, Pool, Fence, Landscape*) via text prompts.
2. **SAM 2** (Semantic Segmentation): Generates pixel-perfect masks and editable polygon regions.
3. **Depth Anything V2** (Depth Estimation): Calculates monocular metric depth map ($z$-depth) for accurate shadow computation, reflections, object placement, and video camera consistency.

---

## Production Stack Infrastructure

- **API Microservice**: FastAPI (Python 3.11+) with async request routing.
- **AI System Layer**: Custom Scene Graph Builder & Object-Material linking orchestrator.
- **Task Queue**: Celery with Redis for background model execution.
- **Persistence**: PostgreSQL (SQLAlchemy ORM) for Scene Graph state and version history.
- **Object Storage**: AWS S3 / MinIO for image rendering artifacts and mask caches.
