from sqlalchemy.orm import Session
from app.database import engine, Base
from app import db_models
from app.models import SceneGraph, SceneObject, SceneRelationship, Point, NormalVector, MaskSegmentation
from app.vision import generate_mock_scene_graph

def calculate_iou(box_a, box_b):
    if not box_a or not box_b:
        return 0.0
    xA = max(box_a[0], box_b[0])
    yA = max(box_a[1], box_b[1])
    xB = min(box_a[2], box_b[2])
    yB = min(box_a[3], box_b[3])
    
    interArea = max(0, xB - xA) * max(0, yB - yA)
    boxAArea = (box_a[2] - box_a[0]) * (box_a[3] - box_a[1])
    boxBArea = (box_b[2] - box_b[0]) * (box_b[3] - box_b[1])
    
    unionArea = float(boxAArea + boxBArea - interArea)
    if unionArea == 0:
        return 0.0
    return interArea / unionArea

def save_scene_graph_to_db(db: Session, sg: SceneGraph) -> db_models.SceneGraphRecord:
    rec = db.query(db_models.SceneGraphRecord).filter(db_models.SceneGraphRecord.id == sg.image_id).first()
    
    # Load old object records to match and persist IDs
    old_objects = db.query(db_models.SceneObjectRecord).filter(db_models.SceneObjectRecord.scene_graph_id == sg.image_id).all()
    
    # Reconcile new objects with old ones to maintain persistent IDs
    if old_objects:
        mapped_old_ids = set()
        for new_obj in sg.objects:
            if not new_obj.bbox:
                continue
            
            best_match = None
            best_iou = 0.0
            
            for old_obj in old_objects:
                if old_obj.object_id in mapped_old_ids:
                    continue
                # Match class
                if new_obj.object_class.lower() == old_obj.object_class.lower():
                    iou = calculate_iou(new_obj.bbox, old_obj.bbox)
                    if iou > 0.4 and iou > best_iou:
                        best_match = old_obj
                        best_iou = iou
            
            if best_match:
                old_id = best_match.object_id
                
                # Re-map relationships from the temporary ID to the persistent ID
                if sg.relationships:
                    for rel in sg.relationships:
                        if rel.subject_id == new_obj.id:
                            rel.subject_id = old_id
                        if rel.object_id == new_obj.id:
                            rel.object_id = old_id
                            
                # Re-map hierarchy and sub-component values
                for o_other in sg.objects:
                    if o_other.parent == new_obj.id:
                        o_other.parent = old_id
                    if o_other.sub_components:
                        o_other.sub_components = [old_id if sub == new_obj.id else sub for sub in o_other.sub_components]
                
                new_obj.id = old_id
                mapped_old_ids.add(old_id)

    if not rec:
        rec = db_models.SceneGraphRecord(
            id=sg.image_id,
            image_url=sg.image_url,
            width=sg.width,
            height=sg.height,
            version=sg.version,
            relationships=[r.model_dump() if hasattr(r, "model_dump") else r for r in sg.relationships] if sg.relationships else None
        )
        db.add(rec)
    else:
        rec.version = sg.version
        rec.image_url = sg.image_url
        rec.relationships = [r.model_dump() if hasattr(r, "model_dump") else r for r in sg.relationships] if sg.relationships else None
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
        polygon_points = [p if isinstance(p, Point) else Point.model_validate(p) for p in obj_rec.polygon] if isinstance(obj_rec.polygon, list) else []
        nv = obj_rec.normal_vector if isinstance(obj_rec.normal_vector, NormalVector) else (NormalVector.model_validate(obj_rec.normal_vector) if isinstance(obj_rec.normal_vector, dict) else None)
        seg = obj_rec.segmentation if isinstance(obj_rec.segmentation, MaskSegmentation) else (MaskSegmentation.model_validate(obj_rec.segmentation) if isinstance(obj_rec.segmentation, dict) else None)
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

    relationships = []
    if isinstance(rec.relationships, list):
        for r in rec.relationships:
            if isinstance(r, SceneRelationship):
                relationships.append(r)
            elif isinstance(r, dict):
                relationships.append(SceneRelationship.model_validate(r))


    return SceneGraph(
        image_id=rec.id,
        image_url=rec.image_url,
        width=rec.width,
        height=rec.height,
        version=rec.version,
        objects=objects,
        relationships=relationships
    )
