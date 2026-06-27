import os
import uuid
import io
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import Dict, Optional
from PIL import Image

from app.database import engine, Base, get_db
from app import db_models
from app.models import (
    SceneGraph, SceneObject, Point, NormalVector, MaskSegmentation, SegmentationData,
    OrchestratorRequest, OrchestratorResponse,
    DetectionRequest, DetectionResponse, DetectedObjectItem,
    SegmentSceneResponse, SegmentSceneItem,
    InteriorSegmentationResponse, InteriorObjectInstance
)
from app.vision import process_uploaded_image, generate_mock_scene_graph
from app.detector import object_detector
from app.interior_detector import interior_pipeline
from app.orchestrator import execute_orchestration
from app.generative import generative_engine

# Initialize DB tables from models
db_models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Antigravity Vision & Detection API - Architectural & Interior Scene OS",
    description="Backend service with Region Mask Segmentation, Interior Furniture Extraction, DB persistence, and generative orchestration.",
    version="2.5.0"
)

@app.on_event("startup")
def on_startup():
    db_models.Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files directory for uploaded renders
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

def save_scene_graph_to_db(db: Session, sg: SceneGraph) -> db_models.SceneGraphRecord:
    rec = db.query(db_models.SceneGraphRecord).filter(db_models.SceneGraphRecord.id == sg.image_id).first()
    if not rec:
        rec = db_models.SceneGraphRecord(
            id=sg.image_id,
            image_url=sg.image_url,
            width=sg.width,
            height=sg.height,
            version=sg.version
        )
        db.add(rec)
    else:
        rec.version = sg.version
        rec.image_url = sg.image_url
        db.query(db_models.SceneObjectRecord).filter(db_models.SceneObjectRecord.scene_graph_id == sg.image_id).delete()

    for obj in sg.objects:
        obj_rec = db_models.SceneObjectRecord(
            object_id=obj.id,
            scene_graph_id=sg.image_id,
            object_class=obj.object_class,
            polygon=[p.model_dump() for p in obj.polygon],
            segmentation=obj.segmentation.model_dump() if obj.segmentation else None,
            bbox=obj.bbox,
            depth=obj.depth,
            material=obj.material,
            style=obj.style,
            editable=obj.editable,
            confidence=obj.confidence,
            parent=obj.parent,
            surface_orientation=obj.surface_orientation,
            normal_vector=obj.normal_vector.model_dump() if obj.normal_vector else None,
            reflectivity=obj.reflectivity,
            roughness=obj.roughness,
            color_hex=obj.color_hex,
            sub_components=obj.sub_components
        )
        db.add(obj_rec)

    db.commit()
    db.refresh(rec)
    return rec

def load_scene_graph_from_db(db: Session, image_id: str) -> SceneGraph:
    try:
        rec = db.query(db_models.SceneGraphRecord).filter(db_models.SceneGraphRecord.id == image_id).first()
    except Exception:
        db.rollback()
        db_models.Base.metadata.create_all(bind=engine)
        rec = db.query(db_models.SceneGraphRecord).filter(db_models.SceneGraphRecord.id == image_id).first()

    if not rec:
        sg = generate_mock_scene_graph(image_id=image_id)
        try:
            save_scene_graph_to_db(db, sg)
        except Exception:
            db.rollback()
        return sg

    objects = []
    for obj_rec in rec.objects:
        polygon_points = [Point(**p) for p in obj_rec.polygon]
        nv = NormalVector(**obj_rec.normal_vector) if obj_rec.normal_vector else None
        seg = MaskSegmentation(**obj_rec.segmentation) if obj_rec.segmentation else None
        objects.append(SceneObject(
            id=obj_rec.object_id,
            **{"class": obj_rec.object_class},
            polygon=polygon_points,
            segmentation=seg,
            bbox=obj_rec.bbox,
            depth=obj_rec.depth,
            material=obj_rec.material,
            style=obj_rec.style,
            editable=obj_rec.editable,
            confidence=obj_rec.confidence,
            parent=obj_rec.parent,
            surface_orientation=obj_rec.surface_orientation,
            normal_vector=nv,
            reflectivity=obj_rec.reflectivity,
            roughness=obj_rec.roughness,
            color_hex=obj_rec.color_hex,
            sub_components=obj_rec.sub_components or []
        ))

    return SceneGraph(
        image_id=rec.id,
        image_url=rec.image_url,
        width=rec.width,
        height=rec.height,
        version=rec.version,
        objects=objects
    )

@app.post("/segment-interior", response_model=InteriorSegmentationResponse)
async def segment_interior_endpoint(
    file: UploadFile = File(...),
    prompts: Optional[str] = Query(None, description="Custom comma-separated interior prompts"),
    confidence_threshold: float = Query(0.30, ge=0.1, le=1.0),
    output_format: str = Query("polygon", enum=["polygon", "rle"])
):
    """
    Instance Segmentation System for Interior Design & Room Details:
    Receives an indoor space image via POST, extracts pixel-level exact masks and labels (sofa, chair, lamp, window, rug, table, wall, floor),
    and excludes bounding boxes from final response.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    file_bytes = await file.read()
    image_id = f"room_{uuid.uuid4().hex[:6]}"
    
    try:
        img = Image.open(io.BytesIO(file_bytes))
        width, height = img.size
    except Exception:
        width, height = 1920, 1080

    objects, proc_time = interior_pipeline.segment_room(
        file_bytes=file_bytes,
        width=width,
        height=height,
        image_id=image_id,
        prompts=prompts,
        conf_threshold=confidence_threshold,
        output_format=output_format
    )

    return InteriorSegmentationResponse(
        image_id=image_id,
        width=width,
        height=height,
        objects=objects,
        processing_time_ms=proc_time
    )

@app.post("/segment-architectural-scene", response_model=SegmentSceneResponse)
@app.post("/segment-scene", response_model=SegmentSceneResponse)
async def segment_scene_endpoint(file: UploadFile = File(...)):
    """
    Region Mask Segmentation — accepts image file upload, runs real YOLO inference,
    returns polygon masks without bounding boxes.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    file_bytes = await file.read()
    image_id = f"scene_{uuid.uuid4().hex[:6]}"

    try:
        img = Image.open(io.BytesIO(file_bytes))
        width, height = img.size
    except Exception:
        width, height = 1920, 1080

    detected_items, proc_time = object_detector.detect(
        width=width, height=height, image_id=image_id,
        file_bytes=file_bytes, conf_threshold=0.15
    )

    output_objects = []
    for item in detected_items:
        # Use neural polygon if available, otherwise derive from bbox
        neural_poly = item.get("neural_polygon")
        if neural_poly and len(neural_poly) >= 3:
            pts = neural_poly
        else:
            x1, y1, x2, y2 = item["bbox"]
            pts = [[float(x1), float(y1)], [float(x2), float(y1)],
                   [float(x2), float(y2)], [float(x1), float(y2)]]

        seg = MaskSegmentation(type="polygon", points=pts)

        output_objects.append(SegmentSceneItem(
            id=item["id"],
            **{"class": item["class"]},
            segmentation=seg,
            confidence=item["confidence"]
        ))

    return SegmentSceneResponse(
        image_id=image_id,
        objects=output_objects
    )


@app.post("/detect-objects", response_model=DetectionResponse)
async def detect_objects_endpoint(file: UploadFile = File(...)):
    """
    Object Detection — accepts image file upload, runs real YOLO inference,
    returns detections with segmentation masks and bounding boxes.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    file_bytes = await file.read()
    image_id = f"det_{uuid.uuid4().hex[:6]}"

    try:
        img = Image.open(io.BytesIO(file_bytes))
        width, height = img.size
    except Exception:
        width, height = 1920, 1080

    detected_items, proc_time = object_detector.detect(
        width=width, height=height, image_id=image_id,
        file_bytes=file_bytes, conf_threshold=0.15
    )

    output_objects = []
    for item in detected_items:
        # Use neural polygon if available
        neural_poly = item.get("neural_polygon")
        if neural_poly and len(neural_poly) >= 3:
            pts = neural_poly
        else:
            x1, y1, x2, y2 = item["bbox"]
            pts = [[float(x1), float(y1)], [float(x2), float(y1)],
                   [float(x2), float(y2)], [float(x1), float(y2)]]

        seg = MaskSegmentation(type="polygon", points=pts)

        output_objects.append(DetectedObjectItem(
            id=item["id"],
            **{"class": item["class"]},
            segmentation=seg,
            bbox=item["bbox"],
            confidence=item["confidence"],
            parent=item.get("parent")
        ))

    return DetectionResponse(
        image_id=image_id,
        objects=output_objects
    )

@app.post("/api/v1/analyze", response_model=SceneGraph)
async def analyze_render(file: UploadFile = File(None), db: Session = Depends(get_db)):
    image_id = f"render_{uuid.uuid4().hex[:8]}"
    image_url = None
    file_bytes = b""

    if file:
        file_bytes = await file.read()
        filename = f"{image_id}_{file.filename}"
        filepath = os.path.join(UPLOADS_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(file_bytes)
        image_url = f"http://localhost:8000/uploads/{filename}"

    scene_graph = process_uploaded_image(file_bytes=file_bytes, image_id=image_id, image_url=image_url)
    save_scene_graph_to_db(db, scene_graph)
    return scene_graph

@app.get("/api/v1/scene-graph/{image_id}", response_model=SceneGraph)
def get_scene_graph(image_id: str, db: Session = Depends(get_db)):
    return load_scene_graph_from_db(db, image_id)

@app.post("/api/v1/orchestrate", response_model=OrchestratorResponse)
async def orchestrate_prompt(request: OrchestratorRequest, db: Session = Depends(get_db)):
    scene_graph = load_scene_graph_from_db(db, request.image_id)
    target_obj = next((obj for obj in scene_graph.objects if obj.id == request.target_id), None)
    if not target_obj:
        raise HTTPException(status_code=404, detail=f"Target object '{request.target_id}' not found.")

    response = execute_orchestration(request, target_obj)
    
    await generative_engine.generate_inpaint(
        image_path=scene_graph.image_url or "default",
        target_object=target_obj,
        action=response.action
    )

    history_rec = db_models.OrchestrationHistoryRecord(
        scene_graph_id=request.image_id,
        target_id=request.target_id,
        prompt=request.prompt,
        action_type=response.action.action,
        target_material=response.action.material
    )
    db.add(history_rec)

    if response.updated_object:
        for idx, obj in enumerate(scene_graph.objects):
            if obj.id == request.target_id:
                scene_graph.objects[idx] = response.updated_object
                break
        scene_graph.version += 1
        save_scene_graph_to_db(db, scene_graph)

    return response
