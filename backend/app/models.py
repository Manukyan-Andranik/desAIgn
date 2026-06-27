from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class Point(BaseModel):
    x: float = Field(..., description="X coordinate in pixels")
    y: float = Field(..., description="Y coordinate in pixels")

class NormalVector(BaseModel):
    nx: float = Field(..., description="Normal X vector component")
    ny: float = Field(..., description="Normal Y vector component")
    nz: float = Field(..., description="Normal Z vector component")

class MaskSegmentation(BaseModel):
    type: str = Field("polygon", description="Representation type (polygon or rle)")
    points: Optional[List[List[float]]] = Field(None, description="Precise region mask or polygon shape points [[x1,y1], [x2,y2], ...]")
    rle: Optional[str] = Field(None, description="Compressed Run-Length Encoded mask string")

# Backward compatibility alias
SegmentationData = MaskSegmentation

class SceneObject(BaseModel):
    id: str = Field(..., description="Unique object ID")
    object_class: str = Field(..., alias="class", description="Architectural class following normalized taxonomy")
    polygon: List[Point] = Field(..., description="High-precision segmentation polygon vertices")
    segmentation: Optional[MaskSegmentation] = Field(None, description="Precise region mask or polygon shape points [[x1,y1], [x2,y2], ...]")
    bbox: Optional[List[int]] = Field(None, description="Optional bounding box for fallback [x1, y1, x2, y2]")
    depth: float = Field(..., description="Estimated depth distance in meters")
    material: str = Field(..., description="Detailed surface material classification")
    style: Optional[str] = Field("modern", description="Architectural style motif")
    editable: bool = Field(True, description="Generative edit permission flag")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence score")
    parent: Optional[str] = Field(None, description="Hierarchy parent tagging (e.g. building, facade)")
    
    # Detailed Physical & Architectural Attributes
    surface_orientation: Optional[str] = Field("Vertical Facade", description="Geometric surface orientation")
    normal_vector: Optional[NormalVector] = Field(None, description="3D Surface normal vector")
    reflectivity: Optional[float] = Field(0.1, ge=0.0, le=1.0, description="Surface specular reflectivity")
    roughness: Optional[float] = Field(0.5, ge=0.0, le=1.0, description="Surface roughness coefficient")
    color_hex: Optional[str] = Field("#888888", description="Dominant surface color HEX code")
    sub_components: Optional[List[str]] = Field(default_factory=list, description="Granular architectural sub-assemblies")

    class Config:
        populate_by_name = True

class SceneGraph(BaseModel):
    image_id: str
    image_url: Optional[str] = None
    width: int
    height: int
    version: int = 1
    objects: List[SceneObject] = Field(default_factory=list)

class DetectionRequest(BaseModel):
    image_url: Optional[str] = Field(None, description="URL of image to detect")
    project_id: Optional[str] = Field("proj_01", description="Project tracking identifier")

class DetectedObjectItem(BaseModel):
    id: str
    object_class: str = Field(..., alias="class")
    segmentation: MaskSegmentation
    bbox: List[int] = Field(..., description="[x1, y1, x2, y2]")
    confidence: float
    parent: Optional[str] = None

    class Config:
        populate_by_name = True

class DetectionResponse(BaseModel):
    image_id: str = "auto_generated"
    objects: List[DetectedObjectItem]

class SegmentSceneItem(BaseModel):
    id: str
    object_class: str = Field(..., alias="class")
    segmentation: MaskSegmentation
    confidence: float

    class Config:
        populate_by_name = True

class SegmentSceneResponse(BaseModel):
    image_id: str = "auto_generated"
    objects: List[SegmentSceneItem]

class InteriorObjectInstance(BaseModel):
    id: str = Field(..., description="Unique instance identifier")
    label: str = Field(..., alias="class", description="Identified interior category (sofa, chair, lamp, rug, table, etc.)")
    segmentation: MaskSegmentation = Field(..., description="Pixel-level exact visual mask")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Inference confidence score")

    class Config:
        populate_by_name = True

class InteriorSegmentationResponse(BaseModel):
    image_id: str
    width: int
    height: int
    objects: List[InteriorObjectInstance]
    processing_time_ms: float

class OrchestratorRequest(BaseModel):
    image_id: str
    target_id: str
    prompt: str

class OrchestratedAction(BaseModel):
    targets: List[str]
    action: str = "replace_material"
    material: Optional[str] = None
    color: Optional[str] = None
    style: Optional[str] = None

class OrchestratorResponse(BaseModel):
    status: str = "success"
    action: OrchestratedAction
    updated_object: Optional[SceneObject] = None
    message: str
