import os
import uuid
import io
import urllib.parse
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional
from PIL import Image

from app.database import get_db
from app import db_models
from app.models import (
    SceneGraph, SceneObject, MaskSegmentation, Point,
    OrchestratorRequest, OrchestratorResponse, OrchestratedAction,
    UpdateObjectClassRequest, MergeObjectsRequest, AddCustomObjectRequest,
    DetectionResponse, DetectedObjectItem, SegmentSceneResponse, SegmentSceneItem, InteriorSegmentationResponse,
    PromptGenerationRequest, PromptGenerationResponse,
    FrameGenerationRequest, FrameGenerationResponse, RegionAIEditRequest, HistoryItemSchema, RestoreUrlRequest
)
from app.vision import process_uploaded_image
from app.detector import object_detector
from app.interior_detector import interior_pipeline
from app.orchestrator import execute_orchestration
from app.generative import generative_engine
from app.learning_engine import save_user_correction
from app.services import save_scene_graph_to_db, load_scene_graph_from_db

router = APIRouter(
    prefix="",
    tags=["Public Vision & Generative AI"]
)

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "static", "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)


def _load_image_bytes_from_url(image_url: str) -> bytes:
    if not image_url:
        raise HTTPException(status_code=404, detail="No image URL stored for this project.")

    if "uploads/" in image_url:
        filename = urllib.parse.unquote(image_url.split("uploads/")[-1].split("?")[0])
        filepath = os.path.join(UPLOADS_DIR, filename)
    else:
        filepath = image_url

    if not os.path.isfile(filepath):
        raise HTTPException(status_code=404, detail="Image file not found on server.")

    with open(filepath, "rb") as f:
        return f.read()


@router.post("/api/v1/analyze", response_model=SceneGraph)
async def analyze_render(
    file: UploadFile = File(None),
    room_type: str = Form("Living Room"),
    design_style: str = Form("Japandi Minimalist"),
    user_id: str = Form(""),
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
        backend_base = os.getenv("BACKEND_API", "http://localhost:8000")
        image_url = f"{backend_base}/uploads/{filename}"

    scene_graph = process_uploaded_image(
        file_bytes=file_bytes,
        image_id=image_id,
        image_url=image_url,
        room_type=room_type,
        design_style=design_style
    )
    save_scene_graph_to_db(db, scene_graph)

    # Automatically register project for user
    from datetime import datetime
    p_title = project_title if project_title else f"{room_type} Project ({datetime.utcnow().strftime('%b %d')})"
    proj_record = db_models.ProjectRecord(
        id=f"proj_{uuid.uuid4().hex[:8]}",
        user_id=user_id if user_id else "usr_guest",
        title=p_title,
        image_id=image_id,
        room_type=room_type,
        design_style=design_style
    )
    db.add(proj_record)
    db.commit()

    return scene_graph


@router.get("/api/v1/scene-graph/{image_id}", response_model=SceneGraph)
def get_scene_graph(image_id: str, db: Session = Depends(get_db)):
    return load_scene_graph_from_db(db, image_id)


@router.post("/api/v1/scene-graph/{image_id}/re-detect", response_model=SceneGraph)
def redetect_scene_objects(
    image_id: str,
    room_type: str = Query("Living Room"),
    design_style: str = Query("Japandi Minimalist"),
    db: Session = Depends(get_db),
):
    existing = load_scene_graph_from_db(db, image_id)
    file_bytes = _load_image_bytes_from_url(existing.image_url or "")

    scene_graph = process_uploaded_image(
        file_bytes=file_bytes,
        image_id=image_id,
        image_url=existing.image_url,
        room_type=room_type,
        design_style=design_style,
    )
    save_scene_graph_to_db(db, scene_graph)
    return scene_graph


@router.post("/api/v1/scene-graph/restore")
def restore_scene_graph(sg: SceneGraph, db: Session = Depends(get_db)):
    save_scene_graph_to_db(db, sg)
    return {"status": "success", "message": "Restored scene graph in database."}


@router.post("/api/v1/object/update-class")
def update_object_class(req: UpdateObjectClassRequest, db: Session = Depends(get_db)):
    scene_graph = load_scene_graph_from_db(db, req.image_id)
    target_obj = next((o for o in scene_graph.objects if o.id == req.object_id), None)
    if not target_obj:
        raise HTTPException(status_code=404, detail="Object not found in scene graph")
    
    orig_class = target_obj.object_class
    target_obj.object_class = req.new_class.strip().lower()
    scene_graph.version += 1
    
    save_scene_graph_to_db(db, scene_graph)
    save_user_correction(orig_class, req.new_class)
    
    return {"status": "success", "message": f"Updated class '{orig_class}' to '{req.new_class}'. Model learned new taxonomy.", "updated_object": target_obj}


@router.delete("/api/v1/object/{image_id}/{object_id}")
def delete_object(image_id: str, object_id: str, db: Session = Depends(get_db)):
    scene_graph = load_scene_graph_from_db(db, image_id)
    initial_count = len(scene_graph.objects)
    scene_graph.objects = [o for o in scene_graph.objects if o.id != object_id]
    
    if len(scene_graph.objects) == initial_count:
        raise HTTPException(status_code=404, detail="Object not found in scene graph")
        
    if scene_graph.relationships:
        scene_graph.relationships = [
            r for r in scene_graph.relationships 
            if r.subject_id != object_id and r.object_id != object_id
        ]
        
    scene_graph.version += 1
    save_scene_graph_to_db(db, scene_graph)
    return {"status": "success", "message": f"Deleted object '{object_id}' from scene graph.", "deleted_object_id": object_id}


@router.post("/api/v1/object/merge")
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

    merged_points = []
    for obj in target_objs:
        if obj.segmentation and obj.segmentation.points:
            merged_points.extend(obj.segmentation.points)
        elif obj.polygon:
            merged_points.extend([[p.x, p.y] for p in obj.polygon])

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

    scene_graph.objects = [o for o in scene_graph.objects if o.id not in other_ids]

    if scene_graph.relationships:
        updated_rels = []
        seen_rels = set()
        for r in scene_graph.relationships:
            subj = primary_target.id if r.subject_id in other_ids else r.subject_id
            obj = primary_target.id if r.object_id in other_ids else r.object_id
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


@router.post("/api/v1/object/add-custom")
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
    save_user_correction(clean_class, clean_class)

    return {
        "status": "success",
        "message": f"Added custom object '{clean_class}' to scene graph.",
        "new_object": new_obj
    }


@router.post("/api/v1/object/ai-edit")
async def ai_edit_region(
    req: RegionAIEditRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    scene_graph = load_scene_graph_from_db(db, req.image_id)
    clean_name = req.object_name.strip().lower()
    
    if not clean_name:
        raise HTTPException(status_code=400, detail="Object name cannot be empty.")
    if not req.prompt.strip():
        raise HTTPException(status_code=400, detail="AI edit prompt cannot be empty.")
        
    custom_id = f"{req.image_id}_ai_{uuid.uuid4().hex[:6]}"
    xmin, ymin, xmax, ymax = int(req.bbox[0]), int(req.bbox[1]), int(req.bbox[2]), int(req.bbox[3])
    
    pts_coords = req.points if (req.points and len(req.points) >= 3) else [
        [float(xmin), float(ymin)],
        [float(xmax), float(ymin)],
        [float(xmax), float(ymax)],
        [float(xmin), float(ymax)]
    ]
    polygon_points = [Point(x=p[0], y=p[1]) for p in pts_coords]
    
    new_obj = SceneObject(
        id=custom_id,
        **{"class": clean_name},
        layer="furniture",
        polygon=polygon_points,
        segmentation=MaskSegmentation(type="polygon", points=pts_coords),
        bbox=[xmin, ymin, xmax, ymax],
        depth=2.5,
        material=req.prompt.strip(),
        confidence=1.0,
        editable=True
    )
    scene_graph.objects.append(new_obj)
    scene_graph.version += 1
    
    mock_action = OrchestratedAction(targets=[new_obj.id], action="modify_style", material=req.prompt.strip())
    gen_result = await generative_engine.generate_inpaint(
        image_path=scene_graph.image_url or "default",
        target_object=new_obj,
        action=mock_action,
        user_prompt=req.prompt.strip(),
        image_id=scene_graph.image_id
    )
    
    new_img_url = gen_result.get("generated_image_url")
    if new_img_url:
        scene_graph.image_url = new_img_url
        from app.database import SessionLocal
        background_tasks.add_task(
            detect_objects_in_background,
            scene_graph.image_id,
            new_img_url,
            scene_graph.room_type,
            scene_graph.design_style,
            SessionLocal
        )
        
    history_rec = db_models.OrchestrationHistoryRecord(
        scene_graph_id=req.image_id,
        target_id=new_obj.id,
        prompt=req.prompt.strip(),
        action_type="modify_style",
        target_material=req.prompt.strip(),
        image_url=new_img_url or scene_graph.image_url
    )
    db.add(history_rec)

    save_scene_graph_to_db(db, scene_graph)
    save_user_correction(clean_name, clean_name)
    
    return {
        "status": "success",
        "message": f"Applied AI transformation to '{clean_name}' with prompt: '{req.prompt}'.",
        "new_object": new_obj,
        "updated_image_url": new_img_url
    }


@router.post("/api/v1/orchestrate", response_model=OrchestratorResponse)
async def orchestrate_prompt(
    request: OrchestratorRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    scene_graph = load_scene_graph_from_db(db, request.image_id)
    target_ids = request.target_ids if request.target_ids else ([request.target_id] if request.target_id else [])
    
    no_selection = (len(target_ids) == 0)
    all_selected = (len(target_ids) == len(scene_graph.objects) and len(scene_graph.objects) > 0)
    
    if no_selection or all_selected:
        w = scene_graph.width or 1920
        h = scene_graph.height or 1080
        from app.models import Point
        whole_image_obj = SceneObject(
            id="all_image",
            **{"class": "entire room"},
            bbox=[0, 0, w, h],
            confidence=1.0,
            depth=1.0,
            material="various",
            editable=True,
            polygon=[
                Point(x=0, y=0),
                Point(x=w, y=0),
                Point(x=w, y=h),
                Point(x=0, y=h)
            ]
        )
        primary_target = whole_image_obj
        target_objs = [whole_image_obj]
    else:
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
        user_prompt=request.prompt,
        image_id=scene_graph.image_id
    )

    new_img_url = gen_result.get("generated_image_url")
    response.updated_image_url = new_img_url

    history_rec = db_models.OrchestrationHistoryRecord(
        scene_graph_id=request.image_id,
        target_id=primary_target.id,
        prompt=request.prompt,
        action_type=response.action.action,
        target_material=response.action.material,
        image_url=new_img_url or scene_graph.image_url
    )
    db.add(history_rec)

    if response.updated_object or new_img_url:
        if new_img_url:
            scene_graph.image_url = new_img_url
            from app.database import SessionLocal
            background_tasks.add_task(
                detect_objects_in_background,
                scene_graph.image_id,
                new_img_url,
                scene_graph.room_type,
                scene_graph.design_style,
                SessionLocal
            )
        if response.updated_object and primary_target.id != "all_image":
            for idx, obj in enumerate(scene_graph.objects):
                if obj.id in target_ids or obj.id == primary_target.id:
                    scene_graph.objects[idx] = response.updated_object
        scene_graph.version += 1
        save_scene_graph_to_db(db, scene_graph)

    return response


@router.post("/segment-interior", response_model=InteriorSegmentationResponse)
async def segment_interior_endpoint(
    file: UploadFile = File(...),
    prompts: Optional[str] = Query(None, description="Custom comma-separated interior prompts"),
    confidence_threshold: float = Query(0.30, ge=0.1, le=1.0),
    output_format: str = Query("polygon", enum=["polygon", "rle"])
):
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


@router.post("/segment-architectural-scene", response_model=SegmentSceneResponse)
@router.post("/segment-scene", response_model=SegmentSceneResponse)
async def segment_scene_endpoint(file: UploadFile = File(...)):
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
        neural_poly = item.get("neural_polygon")
        if neural_poly and len(neural_poly) >= 3:
            pts = neural_poly
        else:
            bbox = item["bbox"]
            pts = [
                [bbox[0], bbox[1]],
                [bbox[2], bbox[1]],
                [bbox[2], bbox[3]],
                [bbox[0], bbox[3]]
            ]
        output_objects.append(SegmentSceneItem(
            object_id=item["id"],
            label=item["class"],
            mask=pts,
            confidence=item["confidence"]
        ))

    return SegmentSceneResponse(
        image_id=image_id,
        width=width,
        height=height,
        objects=output_objects,
        processing_time_ms=proc_time
    )


@router.post("/detect-objects", response_model=DetectionResponse)
async def detect_objects_endpoint(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    file_bytes = await file.read()
    image_id = f"img_{uuid.uuid4().hex[:6]}"

    try:
        img = Image.open(io.BytesIO(file_bytes))
        width, height = img.size
    except Exception:
        width, height = 1920, 1080

    detected_items, _ = object_detector.detect(
        width=width, height=height, image_id=image_id,
        file_bytes=file_bytes, conf_threshold=0.25
    )

    output_objects = []
    for item in detected_items:
        seg = None
        if item.get("neural_polygon") and len(item["neural_polygon"]) >= 3:
            seg = MaskSegmentation(type="polygon", points=item["neural_polygon"])
            
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


@router.post("/generate-prompt", response_model=PromptGenerationResponse)
@router.post("/api/v1/generate-prompt", response_model=PromptGenerationResponse)
async def generate_prompt_endpoint(request: PromptGenerationRequest):
    return generative_engine.generate_prompt(request)


@router.post("/generate-frame", response_model=FrameGenerationResponse)
@router.post("/api/v1/generate-frame", response_model=FrameGenerationResponse)
def generate_frame_endpoint(request: FrameGenerationRequest):
    return generative_engine.generate_frames(request)


@router.post("/api/v1/scene-graph/{image_id}/refresh-detection", response_model=SceneGraph)
def refresh_scene_graph_detection(image_id: str, db: Session = Depends(get_db)):
    """
    Manually triggers the 5-stage vision pipeline on the existing image associated with
    the scene graph, overwriting the scene graph objects with newly detected ones.
    """
    scene_graph = load_scene_graph_from_db(db, image_id)
    if not scene_graph:
        raise HTTPException(status_code=404, detail="Scene graph not found.")

    image_url = scene_graph.image_url
    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "static", "uploads")
    if image_url and "uploads/" in image_url:
        fname = urllib.parse.unquote(image_url.split("uploads/")[-1].split("?")[0])
        filepath = os.path.join(uploads_dir, fname)
    else:
        filepath = os.path.join(uploads_dir, "default.jpg")

    if not os.path.exists(filepath):
        filepath = os.path.join(uploads_dir, "default.jpg")
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="Source image file not found on disk.")

    try:
        with open(filepath, "rb") as f:
            file_bytes = f.read()

        new_scene_graph = process_uploaded_image(
            file_bytes=file_bytes,
            image_id=image_id,
            image_url=image_url,
            room_type=scene_graph.room_type or "Living Room",
            design_style=scene_graph.design_style or "Japandi Minimalist"
        )
        save_scene_graph_to_db(db, new_scene_graph)
        return new_scene_graph
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to refresh object detection: {str(e)}")


@router.get("/api/v1/scene-graph/{image_id}/history", response_model=list[HistoryItemSchema])
def get_scene_graph_history(image_id: str, db: Session = Depends(get_db)):
    """
    Retrieves all logged orchestration/prompt history steps for the given image_id,
    sorted chronologically.
    """
    history_items = db.query(db_models.OrchestrationHistoryRecord).filter(
        db_models.OrchestrationHistoryRecord.scene_graph_id == image_id
    ).order_by(db_models.OrchestrationHistoryRecord.created_at.asc()).all()

    output = []
    for item in history_items:
        output.append(HistoryItemSchema(
            id=item.id,
            scene_graph_id=item.scene_graph_id,
            target_id=item.target_id,
            prompt=item.prompt,
            action_type=item.action_type,
            target_material=item.target_material,
            image_url=item.image_url,
            created_at=item.created_at
        ))
    return output


@router.post("/api/v1/scene-graph/{image_id}/restore-url", response_model=SceneGraph)
def restore_scene_graph_url(image_id: str, req: RestoreUrlRequest, db: Session = Depends(get_db)):
    """
    Overwrites the current scene graph image URL to match a historical state image URL.
    """
    scene_graph = load_scene_graph_from_db(db, image_id)
    if not scene_graph:
        raise HTTPException(status_code=404, detail="Scene graph not found.")
    scene_graph.image_url = req.image_url
    scene_graph.version += 1
    save_scene_graph_to_db(db, scene_graph)
    return scene_graph


def detect_objects_in_background(
    image_id: str,
    new_image_url: str,
    room_type: str,
    design_style: str,
    db_session_maker
):
    """
    Background worker that runs the 5-stage vision pipeline on the newly edited image
    to discover new objects and update the scene graph.
    """
    import os
    import urllib.parse
    from app.vision import process_uploaded_image
    from app.services import save_scene_graph_to_db
    from app.logger import log_action

    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "static", "uploads")
    if "uploads/" in new_image_url:
        fname = urllib.parse.unquote(new_image_url.split("uploads/")[-1].split("?")[0])
        filepath = os.path.join(uploads_dir, fname)
    else:
        return

    if not os.path.exists(filepath):
        return

    try:
        with open(filepath, "rb") as f:
            file_bytes = f.read()

        db = db_session_maker()
        try:
            log_action("BACKGROUND_DETECTION_START", f"Starting background object detection on '{image_id}'...")
            new_scene_graph = process_uploaded_image(
                file_bytes=file_bytes,
                image_id=image_id,
                image_url=new_image_url,
                room_type=room_type,
                design_style=design_style
            )
            save_scene_graph_to_db(db, new_scene_graph)
            log_action("BACKGROUND_DETECTION_SUCCESS", f"Successfully re-detected objects for image '{image_id}' in background.")
        finally:
            db.close()
    except Exception as e:
        log_action("BACKGROUND_DETECTION_ERROR", f"Failed background object detection: {e}", level="ERROR")
