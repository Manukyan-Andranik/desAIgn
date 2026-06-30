"""
Antigravity Active Learning Engine
=====================================
Persists user object class/name corrections and dynamically updates
zero-shot vision taxonomies across Grounding DINO and OpenCLIP.
"""

import os
import json
from typing import Dict, Any, List
from app.logger import log_action

CORRECTIONS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "user_class_corrections.json")

def load_user_corrections() -> Dict[str, str]:
    """Load persisted user class correction mappings."""
    if not os.path.exists(CORRECTIONS_FILE):
        return {}
    try:
        with open(CORRECTIONS_FILE, "r") as f:
            return json.load(f)
    except Exception as e:
        log_action("LEARNING_LOAD_ERROR", str(e))
        return {}

user_taxonomy_memory: Dict[str, str] = load_user_corrections()

def save_user_correction(original_class: str, new_class: str) -> Dict[str, str]:
    """
    Save a user class correction to persistent storage and update active memory.
    """
    clean_orig = original_class.strip().lower()
    clean_new = new_class.strip().lower()
    
    user_taxonomy_memory[clean_orig] = clean_new
    
    try:
        with open(CORRECTIONS_FILE, "w") as f:
            json.dump(user_taxonomy_memory, f, indent=2)
        log_action("LEARNING_SAVE", f"Learned mapping: '{clean_orig}' -> '{clean_new}'")
    except Exception as e:
        log_action("LEARNING_SAVE_ERROR", str(e))
        
    return user_taxonomy_memory

class ActiveLearningEngine:
    """Class wrapper for dynamic active learning."""
    def get_corrected_class(self, detected_class: str) -> str:
        """Return user-learned class override if exists, else detected_class."""
        clean = detected_class.strip().lower()
        return user_taxonomy_memory.get(clean, detected_class)

learning_engine = ActiveLearningEngine()
