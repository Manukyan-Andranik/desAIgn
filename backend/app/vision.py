from app.analyzer import pipeline
from app.models import SceneGraph

def process_uploaded_image(
    file_bytes: bytes,
    image_id: str,
    image_url: str = None,
    room_type: str = "Living Room",
    design_style: str = "Japandi Minimalist"
) -> SceneGraph:
    """
    Executes the full 5-stage production architectural vision pipeline tailored to room type and design style.
    """
    return pipeline.analyze(
        file_bytes=file_bytes,
        image_id=image_id,
        image_url=image_url,
        room_type=room_type,
        design_style=design_style
    )

def generate_mock_scene_graph(image_id: str = "demo_render_01") -> SceneGraph:
    return process_uploaded_image(b"", image_id)
