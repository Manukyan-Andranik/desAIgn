from app.analyzer import pipeline
from app.models import SceneGraph

def process_uploaded_image(file_bytes: bytes, image_id: str, image_url: str = None) -> SceneGraph:
    """
    Executes the full 7-stage architectural vision pipeline:
    Render -> Object Detection -> Semantic Segmentation -> Depth Estimation -> 
    Surface Detection -> Material Recognition -> Style Recognition -> Scene Graph
    """
    return pipeline.analyze(file_bytes=file_bytes, image_id=image_id, image_url=image_url)

def generate_mock_scene_graph(image_id: str = "demo_render_01") -> SceneGraph:
    return process_uploaded_image(b"", image_id)
