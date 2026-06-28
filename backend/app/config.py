"""
Antigravity System Hyperparameters & Environment Configuration Loader
========================================================================
Loads vision pipeline hyperparameters, model checkpoints, confidence thresholds,
and server parameters from environment variables (.env file).
"""

import os
from dotenv import load_dotenv

# Load environment variables from backend/.env
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

class Settings:
    # ─── Stage 1: Grounding DINO Object Detector Hyperparameters ──────────────
    # Minimum confidence probability threshold for detected bounding boxes (e.g., 0.50 = 50%+)
    GDINO_BOX_THRESHOLD: float = float(os.getenv("GDINO_BOX_THRESHOLD", "0.50"))
    
    # Minimum text-matching cross-attention threshold for class phrase alignment
    GDINO_TEXT_THRESHOLD: float = float(os.getenv("GDINO_TEXT_THRESHOLD", "0.50"))
    
    # Class-Aware Non-Maximum Suppression (NMS) IoU overlap threshold to merge duplicate boxes
    GDINO_NMS_THRESHOLD: float = float(os.getenv("GDINO_NMS_THRESHOLD", "0.55"))
    
    # HuggingFace checkpoint repository for Grounding DINO backbone
    GDINO_MODEL_ID: str = os.getenv("GDINO_MODEL_ID", "IDEA-Research/grounding-dino-base")

    # ─── Stage 2: SAM Sub-Pixel Segmentation Hyperparameters ─────────────────
    # Segment Anything Model (SAM) architecture variant
    SAM_MODEL_TYPE: str = os.getenv("SAM_MODEL_TYPE", "vit_b")

    # ─── Stage 3: Depth Anything V2 Monocular Estimator Hyperparameters ─────
    # Monocular metric depth estimation HuggingFace checkpoint model string
    DEPTH_MODEL_ID: str = os.getenv("DEPTH_MODEL_ID", "depth-anything/Depth-Anything-V2-Small-hf")

    # ─── Stage 4: OpenCLIP Zero-Shot Material Classifier Hyperparameters ────
    # OpenCLIP vision-language model identifier for surface material & style prediction
    CLIP_MODEL_ID: str = os.getenv("CLIP_MODEL_ID", "openai/clip-vit-base-patch32")

    # ─── Cloud Generative AI APIs ─────────────────────────────────────────────
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    REPLICATE_API_TOKEN: str = os.getenv("REPLICATE_API_TOKEN", "")

settings = Settings()
