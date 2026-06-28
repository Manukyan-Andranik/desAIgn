import os
import uuid
import io
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import Dict, Optional
from PIL import Image

from app.database import engine, Base, get_db
from app import db_models
from app.models import (
    SceneGraph, SceneObject, SceneRelationship, Point, NormalVector, MaskSegmentation, SegmentationData,
    OrchestratorRequest, OrchestratorResponse, UpdateObjectClassRequest, MergeObjectsRequest, AddCustomObjectRequest,
    UserSchema, ProjectSchema, CreateProjectRequest,
    DetectionRequest, DetectionResponse, DetectedObjectItem,
    SegmentSceneResponse, SegmentSceneItem,
    InteriorSegmentationResponse, InteriorObjectInstance,
    PromptGenerationRequest, PromptGenerationResponse,
    FrameGenerationRequest, FrameGenerationResponse
)
from app.vision import process_uploaded_image, generate_mock_scene_graph
from app.detector import object_detector
from app.interior_detector import interior_pipeline
from app.orchestrator import execute_orchestration
from app.generative import generative_engine
from app.learning_engine import save_user_correction

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
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(engine)
        if "scene_graphs" in inspector.get_table_names():
            columns = [c["name"] for c in inspector.get_columns("scene_graphs")]
            if "relationships" not in columns:
                with engine.connect() as conn:
                    conn.execute(text("ALTER TABLE scene_graphs ADD COLUMN relationships JSON"))
                    conn.commit()
    except Exception as e:
        print(f"[DB Migration Warning] {e}")

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
            version=sg.version,
            relationships=[r.model_dump() for r in sg.relationships] if sg.relationships else None
        )
        db.add(rec)
    else:
        rec.version = sg.version
        rec.image_url = sg.image_url
        rec.relationships = [r.model_dump() for r in sg.relationships] if sg.relationships else None
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

    relationships = [SceneRelationship(**r) for r in rec.relationships] if rec.relationships else []

    return SceneGraph(
        image_id=rec.id,
        image_url=rec.image_url,
        width=rec.width,
        height=rec.height,
        version=rec.version,
        objects=objects,
        relationships=relationships
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

@app.get("/api/v1/users", response_model=list[UserSchema])
def get_users(db: Session = Depends(get_db)):
    users = db.query(db_models.UserRecord).all()
    if not users:
        demo_users = [
            db_models.UserRecord(id="usr_alex", name="Alex Rivera", email="alex@architects.io", avatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"),
            db_models.UserRecord(id="usr_sarah", name="Sarah Lin", email="sarah@designstudio.com", avatar="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"),
            db_models.UserRecord(id="usr_studio", name="Studio Pro", email="pro@antigravity.os", avatar="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80")
        ]
        for u in demo_users:
            db.add(u)
        db.commit()
        users = db.query(db_models.UserRecord).all()
    return [UserSchema(id=u.id, name=u.name, email=u.email, avatar=u.avatar) for u in users]

@app.get("/api/v1/users/{user_id}/projects", response_model=list[ProjectSchema])
def get_user_projects(user_id: str, db: Session = Depends(get_db)):
    projects = db.query(db_models.ProjectRecord).filter(db_models.ProjectRecord.user_id == user_id).all()
    if not projects and user_id in ["usr_alex", "usr_sarah", "usr_studio"]:
        if user_id == "usr_alex":
            p1 = db_models.ProjectRecord(id="proj_japandi_01", user_id="usr_alex", title="Japandi Villa Sanctuary", image_id="demo_render_01", room_type="Living Room", design_style="Japandi Minimalist")
            db.add(p1)
        elif user_id == "usr_sarah":
            p2 = db_models.ProjectRecord(id="proj_nordic_02", user_id="usr_sarah", title="Nordic Artisan Bakery", image_id="demo_render_02", room_type="Cafe & Restaurant", design_style="Scandinavian Modern")
            db.add(p2)
        else:
            p3 = db_models.ProjectRecord(id="proj_biophilic_03", user_id="usr_studio", title="Biophilic Executive Suite", image_id="demo_render_03", room_type="Office & Study", design_style="Biophilic Luxury")
            db.add(p3)
        db.commit()
        projects = db.query(db_models.ProjectRecord).filter(db_models.ProjectRecord.user_id == user_id).all()
    
    result = []
    for p in projects:
        sg = db.query(db_models.SceneGraphRecord).filter(db_models.SceneGraphRecord.id == p.image_id).first()
        img_url = sg.image_url if sg else None
        obj_count = len(sg.objects) if sg and sg.objects else 0
        result.append(ProjectSchema(
            id=p.id,
            user_id=p.user_id,
            title=p.title,
            image_id=p.image_id,
            room_type=p.room_type,
            design_style=p.design_style,
            image_url=img_url,
            object_count=obj_count
        ))
    return result

@app.post("/api/v1/projects", response_model=ProjectSchema)
def create_project(req: CreateProjectRequest, db: Session = Depends(get_db)):
    proj_id = f"proj_{uuid.uuid4().hex[:8]}"
    p = db_models.ProjectRecord(
        id=proj_id,
        user_id=req.user_id,
        title=req.title,
        image_id=req.image_id,
        room_type=req.room_type,
        design_style=req.design_style
    )
    db.add(p)
    db.commit()
    
    sg = db.query(db_models.SceneGraphRecord).filter(db_models.SceneGraphRecord.id == req.image_id).first()
    img_url = sg.image_url if sg else None
    obj_count = len(sg.objects) if sg and sg.objects else 0
    
    return ProjectSchema(
        id=p.id,
        user_id=p.user_id,
        title=p.title,
        image_id=p.image_id,
        room_type=p.room_type,
        design_style=p.design_style,
        image_url=img_url,
        object_count=obj_count
    )

@app.delete("/api/v1/projects/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    p = db.query(db_models.ProjectRecord).filter(db_models.ProjectRecord.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(p)
    db.commit()
    return {"status": "success", "message": f"Deleted project '{project_id}'"}

@app.post("/api/v1/analyze", response_model=SceneGraph)
async def analyze_render(
    file: UploadFile = File(None),
    room_type: str = Form("Living Room"),
    design_style: str = Form("Japandi Minimalist"),
    user_id: str = Form("usr_alex"),
    project_title: str = Form(None),
    db: Session = Depends(get_db)
):
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

    scene_graph = process_uploaded_image(
        file_bytes=file_bytes,
        image_id=image_id,
        image_url=image_url,
        room_type=room_type,
        design_style=design_style
    )
    save_scene_graph_to_db(db, scene_graph)

    # Automatically register project for user
    p_title = project_title if project_title else f"{room_type} Project ({datetime.utcnow().strftime('%b %d')})"
    proj_record = db_models.ProjectRecord(
        id=f"proj_{uuid.uuid4().hex[:8]}",
        user_id=user_id,
        title=p_title,
        image_id=image_id,
        room_type=room_type,
        design_style=design_style
    )
    db.add(proj_record)
    db.commit()

    return scene_graph

@app.get("/api/v1/scene-graph/{image_id}", response_model=SceneGraph)
def get_scene_graph(image_id: str, db: Session = Depends(get_db)):
    return load_scene_graph_from_db(db, image_id)

@app.post("/api/v1/object/update-class")
def update_object_class(req: UpdateObjectClassRequest, db: Session = Depends(get_db)):
    scene_graph = load_scene_graph_from_db(db, req.image_id)
    target_obj = next((o for o in scene_graph.objects if o.id == req.object_id), None)
    if not target_obj:
        raise HTTPException(status_code=404, detail="Object not found in scene graph")
    
    orig_class = target_obj.object_class
    target_obj.object_class = req.new_class.strip().lower()
    scene_graph.version += 1
    
    # Persist updated scene graph in database
    save_scene_graph_to_db(db, scene_graph)
    
    # Save user correction to active learning engine memory
    save_user_correction(orig_class, req.new_class)
    
    return {"status": "success", "message": f"Updated class '{orig_class}' to '{req.new_class}'. Model learned new taxonomy.", "updated_object": target_obj}

@app.delete("/api/v1/object/{image_id}/{object_id}")
def delete_object(image_id: str, object_id: str, db: Session = Depends(get_db)):
    scene_graph = load_scene_graph_from_db(db, image_id)
    initial_count = len(scene_graph.objects)
    scene_graph.objects = [o for o in scene_graph.objects if o.id != object_id]
    
    if len(scene_graph.objects) == initial_count:
        raise HTTPException(status_code=404, detail="Object not found in scene graph")
        
    # Clean up connected spatial relationships
    if scene_graph.relationships:
        scene_graph.relationships = [
            r for r in scene_graph.relationships 
            if r.subject_id != object_id and r.object_id != object_id
        ]
        
    scene_graph.version += 1
    save_scene_graph_to_db(db, scene_graph)
    return {"status": "success", "message": f"Deleted object '{object_id}' from scene graph.", "deleted_object_id": object_id}

@app.post("/api/v1/object/merge")
def merge_objects(req: MergeObjectsRequest, db: Session = Depends(get_db)):
    scene_graph = load_scene_graph_from_db(db, req.image_id)
    valid_ids = set(o.id for o in scene_graph.objects)
    target_objs = [o for o in scene_graph.objects if o.id in req.object_ids]
    
    if len(target_objs) < 2:
        found_ids = [o.id for o in target_objs]
        missing_ids = [oid for oid in req.object_ids if oid not in valid_ids]
        raise HTTPException(
            status_code=400, 
            detail=f"At least 2 valid objects matching image '{req.image_id}' must be selected. Found {len(target_objs)} valid ({found_ids}), missing ({missing_ids})."
        )

    primary_target = target_objs[0]
    other_targets = target_objs[1:]
    other_ids = set(o.id for o in other_targets)

    # 1. Unified Polygon Mask Points Concatenation
    merged_points = []
    for obj in target_objs:
        if obj.segmentation and obj.segmentation.points:
            merged_points.extend(obj.segmentation.points)
        elif obj.polygon:
            merged_points.extend([[p.x, p.y] for p in obj.polygon])

    # 2. Unified Class, Confidence & Depth Calculation
    if req.new_class and req.new_class.strip():
        primary_target.object_class = req.new_class.strip().lower()
    
    primary_target.confidence = round(max(o.confidence for o in target_objs), 4)
    primary_target.depth = round(sum(o.depth for o in target_objs) / len(target_objs), 2)
    
    if merged_points:
        if not primary_target.segmentation:
            primary_target.segmentation = MaskSegmentation(type="polygon", points=merged_points)
        else:
            primary_target.segmentation.points = merged_points
        primary_target.polygon = [Point(x=float(pt[0]), y=float(pt[1])) for pt in merged_points]

    # 3. Remove merged sub-objects from scene graph
    scene_graph.objects = [o for o in scene_graph.objects if o.id not in other_ids]

    # 4. Re-point spatial relationships & clean up self-loops
    if scene_graph.relationships:
        updated_rels = []
        seen_rels = set()
        for r in scene_graph.relationships:
            subj = primary_target.id if r.subject_id in other_ids else r.subject_id
            obj = primary_target.id if r.object_id in other_ids else r.object_id
            
            # Skip self-referential relationships resulting from merge
            if subj == obj:
                continue
                
            rel_key = (subj, r.predicate, obj)
            if rel_key not in seen_rels:
                seen_rels.add(rel_key)
                r.subject_id = subj
                r.object_id = obj
                updated_rels.append(r)
                
        scene_graph.relationships = updated_rels

    scene_graph.version += 1
    save_scene_graph_to_db(db, scene_graph)
    return {
        "status": "success", 
        "message": f"Successfully combined {len(target_objs)} objects into unified '{primary_target.object_class}'.",
        "merged_object": primary_target
    }

@app.post("/api/v1/object/add-custom")
def add_custom_object(req: AddCustomObjectRequest, db: Session = Depends(get_db)):
    scene_graph = load_scene_graph_from_db(db, req.image_id)
    clean_class = req.object_class.strip().lower()
    
    if not clean_class:
        raise HTTPException(status_code=400, detail="Object name/class cannot be empty.")
    if not req.brush_points or len(req.brush_points) < 3:
        raise HTTPException(status_code=400, detail="At least 3 brush points are required to define an area.")

    xs = [pt[0] for pt in req.brush_points]
    ys = [pt[1] for pt in req.brush_points]
    xmin, xmax = int(min(xs)), int(max(xs))
    ymin, ymax = int(min(ys)), int(max(ys))

    custom_id = f"{req.image_id}_brush_{uuid.uuid4().hex[:6]}"
    polygon_points = [Point(x=float(pt[0]), y=float(pt[1])) for pt in req.brush_points]
    seg_points = [[float(pt[0]), float(pt[1])] for pt in req.brush_points]

    new_obj = SceneObject(
        id=custom_id,
        **{"class": clean_class},
        layer="furniture",
        polygon=polygon_points,
        segmentation=MaskSegmentation(type="polygon", points=seg_points),
        bbox=[xmin, ymin, xmax, ymax],
        depth=2.5,
        material="custom painted surface",
        confidence=1.0,
        editable=True
    )

    scene_graph.objects.append(new_obj)
    scene_graph.version += 1
    save_scene_graph_to_db(db, scene_graph)
    
    # Register in active learning memory
    save_user_correction(clean_class, clean_class)

    return {
        "status": "success",
        "message": f"Added custom object '{clean_class}' to scene graph.",
        "new_object": new_obj
    }

@app.post("/api/v1/orchestrate", response_model=OrchestratorResponse)
async def orchestrate_prompt(request: OrchestratorRequest, db: Session = Depends(get_db)):
    scene_graph = load_scene_graph_from_db(db, request.image_id)
    target_ids = request.target_ids if request.target_ids else ([request.target_id] if request.target_id else [])
    
    target_objs = [obj for obj in scene_graph.objects if obj.id in target_ids]
    if not target_objs and scene_graph.objects:
        target_objs = [scene_graph.objects[0]]

    primary_target = target_objs[0] if target_objs else None
    if not primary_target:
        raise HTTPException(status_code=404, detail="No valid target objects found for orchestration.")

    response = execute_orchestration(request, target_objs)
    
    gen_result = await generative_engine.generate_inpaint(
        image_path=scene_graph.image_url or "default",
        target_object=primary_target,
        action=response.action,
        user_prompt=request.prompt
    )

    new_img_url = gen_result.get("generated_image_url")
    response.updated_image_url = new_img_url

    history_rec = db_models.OrchestrationHistoryRecord(
        scene_graph_id=request.image_id,
        target_id=primary_target.id,
        prompt=request.prompt,
        action_type=response.action.action,
        target_material=response.action.material
    )
    db.add(history_rec)

    if response.updated_object or new_img_url:
        if new_img_url:
            scene_graph.image_url = new_img_url
        if response.updated_object:
            for idx, obj in enumerate(scene_graph.objects):
                if obj.id in target_ids or obj.id == primary_target.id:
                    scene_graph.objects[idx] = response.updated_object
        scene_graph.version += 1
        save_scene_graph_to_db(db, scene_graph)

    return response


# ─── Prompt Generation & Frame Generation Endpoints ───────────────────────────

@app.post("/generate-prompt", response_model=PromptGenerationResponse)
@app.post("/api/v1/generate-prompt", response_model=PromptGenerationResponse)
async def generate_prompt_endpoint(request: PromptGenerationRequest):
    """
    Prompt Generation Engine:
    Synthesizes production-grade 8K diffusion prompts from user design concepts,
    incorporating architectural styles, materials, and lighting setups.
    """
    return generative_engine.generate_prompt(request)


@app.post("/generate-frame", response_model=FrameGenerationResponse)
@app.post("/api/v1/generate-frame", response_model=FrameGenerationResponse)
def generate_frame_endpoint(request: FrameGenerationRequest):
    """
    Frame Generation Engine:
    Synthesizes multi-keyframe visual concept variations for interior spaces based on prompts.
    """
    return generative_engine.generate_frames(request)

