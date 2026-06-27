import re
from typing import Tuple
from app.models import OrchestratorRequest, OrchestratorResponse, OrchestratedAction, SceneObject

def parse_prompt_to_action(prompt: str, target_id: str) -> OrchestratedAction:
    """
    Mock AI Orchestrator NLP parser that converts natural language prompts
    into actionable structured JSON payloads for generative image models.
    """
    lower_prompt = prompt.lower()
    
    # Simple rule-based mock NLP extraction for MVP demo
    extracted_material = None
    if "black metal" in lower_prompt or "standing seam" in lower_prompt:
        extracted_material = "black standing seam metal"
    elif "wood" in lower_prompt or "timber" in lower_prompt or "cedar" in lower_prompt:
        extracted_material = "charred cedar shou sugi ban"
    elif "glass" in lower_prompt or "frosted" in lower_prompt:
        extracted_material = "frosted privacy glass"
    elif "concrete" in lower_prompt or "board-formed" in lower_prompt:
        extracted_material = "board-formed architectural concrete"
    elif "marble" in lower_prompt or "carrara" in lower_prompt:
        extracted_material = "white carrara marble"
    else:
        # Fallback dynamic extraction
        words = prompt.split()
        extracted_material = " ".join(words[-3:]) if len(words) >= 3 else prompt

    return OrchestratedAction(
        targets=[target_id],
        action="replace_material",
        material=extracted_material,
        color="dark" if "black" in lower_prompt or "dark" in lower_prompt else "natural",
        style="modern"
    )

def execute_orchestration(request: OrchestratorRequest, current_object: SceneObject) -> OrchestratorResponse:
    action = parse_prompt_to_action(request.prompt, request.target_id)
    
    # Update object material
    updated_obj = current_object.model_copy()
    if action.material:
        updated_obj.material = action.material
        
    return OrchestratorResponse(
        status="success",
        action=action,
        updated_object=updated_obj,
        message=f"Successfully orchestrated action '{action.action}' for object target '{request.target_id}'."
    )
