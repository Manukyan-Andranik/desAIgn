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
    layer: str = Field("furniture", description="Scene Layer classification (structural, furniture, decor, background)")
    polygon: List[Point] = Field(..., description="High-precision segmentation polygon vertices")
    segmentation: Optional[MaskSegmentation] = Field(None, description="Precise region mask or polygon shape points [[x1,y1], [x2,y2], ...]")
    mask: Optional[MaskSegmentation] = Field(None, description="Exact mask object matching required schema")
    bbox: Optional[List[int]] = Field(None, description="Optional bounding box for reference only [x1, y1, x2, y2]")
    depth: float = Field(..., description="Estimated depth distance in meters")
    material: str = Field(..., description="Detailed surface material classification")
    style: Optional[str] = Field("modern", description="Architectural style motif")
    editable: bool = Field(True, description="Generative edit permission flag")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence score")
    parent: Optional[str] = Field(None, description="Hierarchy parent tagging (e.g. building, room_structure)")
    
    # Detailed Physical & Architectural Attributes
    surface_orientation: Optional[str] = Field("Vertical Facade", description="Geometric surface orientation")
    normal_vector: Optional[NormalVector] = Field(None, description="3D Surface normal vector")
    reflectivity: Optional[float] = Field(0.1, ge=0.0, le=1.0, description="Surface specular reflectivity")
    roughness: Optional[float] = Field(0.5, ge=0.0, le=1.0, description="Surface roughness coefficient")
    color_hex: Optional[str] = Field("#888888", description="Dominant surface color HEX code")
    sub_components: Optional[List[str]] = Field(default_factory=list, description="Granular architectural sub-assemblies")

    class Config:
        populate_by_name = True

class UpdateObjectClassRequest(BaseModel):
    image_id: str = Field(..., description="Scene graph image ID")
    object_id: str = Field(..., description="Target object ID to update")
    new_class: str = Field(..., description="New object class/name specified by user")

class MergeObjectsRequest(BaseModel):
    image_id: str = Field(..., description="Scene graph image ID")
    object_ids: List[str] = Field(..., description="List of object IDs to merge together")
    new_class: Optional[str] = Field(None, description="Optional override class name for merged object")

class AddCustomObjectRequest(BaseModel):
    image_id: str = Field(..., description="Scene graph image ID")
    object_class: str = Field(..., alias="class", description="Name of the object entered by user")
    brush_points: List[List[float]] = Field(..., description="List of [x, y] coordinates drawn by brush")

    class Config:
        populate_by_name = True

class UserSchema(BaseModel):
    id: str
    name: str
    email: str
    avatar: Optional[str] = None
    credits: int = 1000
    edit_count: int = 0
    plan: str = "Standard"


class UpgradePlanRequest(BaseModel):
    plan: str = Field(..., description="Target plan name: Standard, Pro Studio, or Enterprise")

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = Field(None, description="Display name")
    email: Optional[str] = Field(None, description="Account email")
    avatar: Optional[str] = Field(None, description="Avatar URL or base64 data URL")

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    avatar: Optional[str] = None

class ProjectSchema(BaseModel):
    id: str
    user_id: str
    title: str
    image_id: str
    room_type: str = "Living Room"
    design_style: str = "Japandi Minimalist"
    image_url: Optional[str] = None
    object_count: Optional[int] = 0

class CreateProjectRequest(BaseModel):
    user_id: str
    title: str
    image_id: str
    room_type: str = "Living Room"
    design_style: str = "Japandi Minimalist"

class SceneRelationship(BaseModel):
    subject_id: str = Field(..., description="Subject object ID")
    predicate: str = Field(..., description="Spatial or structural relation (on, next_to, mounted_on, beside, under, above)")
    object_id: str = Field(..., description="Target object ID")

class SceneGraph(BaseModel):
    image_id: str
    image_url: Optional[str] = None
    width: int
    height: int
    version: int = 1
    room_type: Optional[str] = Field("Living Room", description="Target room function")
    design_style: Optional[str] = Field("Japandi Minimalist", description="Architectural design style")
    objects: List[SceneObject] = Field(default_factory=list)
    relationships: List[SceneRelationship] = Field(default_factory=list)

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
    object_class: str = Field(..., alias="class", description="Identified interior category (sofa, chair, lamp, rug, table, etc.)")
    layer: str = Field("furniture", description="Layer categorization (structural, furniture, decor, background)")
    mask: MaskSegmentation = Field(..., description="Pixel-level exact visual mask")
    segmentation: Optional[MaskSegmentation] = Field(None, description="Backward compatibility segmentation field")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Inference confidence score")
    editable: bool = Field(True, description="Generative edit permission flag")

    class Config:
        populate_by_name = True

class InteriorSegmentationResponse(BaseModel):
    image_id: str
    width: int
    height: int
    objects: List[InteriorObjectInstance]
    processing_time_ms: float

class StructuredActionItem(BaseModel):
    target: str = Field(..., description="Target object instance ID")
    action: str = Field(..., description="Action type (replace_material, remove, recolor, modify_style)")
    value: Optional[str] = Field(None, description="Target value or material instruction")

class StructuredPromptInstruction(BaseModel):
    actions: List[StructuredActionItem] = Field(default_factory=list)

class OrchestratorRequest(BaseModel):
    image_id: str
    target_id: Optional[str] = Field(None, description="Single target object ID")
    target_ids: Optional[List[str]] = Field(default_factory=list, description="Multi-selection target object IDs")
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
    updated_image_url: Optional[str] = None
    message: str

# ─── Prompt & Frame Generation Models ─────────────────────────────────────────

class PromptGenerationRequest(BaseModel):
    concept: str = Field(..., description="User design concept or style direction (e.g., 'Modern Japandi living room')")
    target_objects: Optional[List[str]] = Field(default_factory=list, description="Target object categories to highlight (e.g., ['sofa', 'lamp', 'table'])")
    style_preset: Optional[str] = Field("minimalist_luxury", description="Style preset (japandi, scandinavian, industrial, biophilic, brutalist)")
    lighting_mood: Optional[str] = Field("warm_golden_hour", description="Lighting mood (warm_golden_hour, cinematic_dramatic, soft_diffused_daylight)")

class GeneratedPromptData(BaseModel):
    positive_prompt: str = Field(..., description="Optimized high-detail diffusion/render prompt")
    negative_prompt: str = Field(..., description="Standard negative prompt for artifact suppression")
    architectural_style: str
    material_palette: List[str]
    lighting_setup: str

class PromptGenerationResponse(BaseModel):
    prompt_id: str
    concept: str
    generated_prompt: GeneratedPromptData
    processing_time_ms: float

class FrameGenerationRequest(BaseModel):
    image_id: Optional[str] = Field("default", description="Base scene image identifier")
    prompt: str = Field(..., description="Generative render prompt or concept instruction")
    num_frames: int = Field(4, ge=1, le=8, description="Number of variation keyframes to generate")
    aspect_ratio: str = Field("16:9", description="Target frame aspect ratio")
    overlay_masks: bool = Field(True, description="Whether to bake object segmentation mask outlines into frame previews")

class FrameItem(BaseModel):
    frame_id: str
    frame_number: int
    frame_url: str
    style_variant: str
    prompt_used: str

class FrameGenerationResponse(BaseModel):
    job_id: str
    base_image_id: str
    frames: List[FrameItem]
    processing_time_ms: float

class RegionAIEditRequest(BaseModel):
    image_id: str = Field(..., description="Scene graph image ID")
    bbox: List[float] = Field(..., description="Bounding box [xmin, ymin, xmax, ymax]")
    object_name: str = Field(..., description="Selected object name")
    prompt: str = Field(..., description="Generative user edit prompt for Gemini model")
    points: Optional[List[List[float]]] = Field(default_factory=list, description="Polygon stroke or rectangle points")

