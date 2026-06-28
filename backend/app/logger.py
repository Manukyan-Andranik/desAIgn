"""
Developer-Friendly Action Logger Utility
=========================================
Provides structured, colorized logging capturing Action, Log Message, File Name, and Line/Row Number.
Format: 🚀 [ACTION] message | File: filename.py (Row: 123)
"""

import inspect
import os
import sys
from datetime import datetime

# ANSI Color Codes for Developer Terminal Readability
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
MAGENTA = "\033[95m"
RED = "\033[91m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"

# Action Icons for Instant Developer Recognition
ACTION_ICONS = {
    "PIPELINE": "🚀",
    "STAGE_1": "🎯",
    "STAGE_2": "🔍",
    "STAGE_3": "📐",
    "STAGE_4": "🎨",
    "STAGE_5": "🔗",
    "GDINO": "🎯",
    "SAM": "🔍",
    "DEPTH": "📐",
    "CLIP": "🎨",
    "SGG": "🔗",
    "ERROR": "❌",
    "WARN": "⚠️",
    "SUCCESS": "✅"
}

def log_action(action: str, message: str, level: str = "INFO"):
    """
    Prints a beautifully formatted, developer-friendly log entry with ANSI colors and source locations.
    """
    frame = inspect.currentframe().f_back
    filename = os.path.basename(frame.f_code.co_filename) if frame else "unknown"
    lineno = frame.f_lineno if frame else 0
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]

    # Resolve icon and color based on action tag
    icon = "⚙️"
    color = CYAN
    act_upper = action.upper()

    for key, ic in ACTION_ICONS.items():
        if key in act_upper:
            icon = ic
            break

    if "ERROR" in act_upper:
        color = RED
    elif "SUCCESS" in act_upper or "COMPLETE" in act_upper:
        color = GREEN
    elif "START" in act_upper or "INIT" in act_upper:
        color = CYAN
    elif "DETECT" in act_upper or "GDINO" in act_upper:
        color = BLUE
    elif "CLIP" in act_upper or "MATERIAL" in act_upper:
        color = YELLOW

    # Formatted output with color highlighting
    formatted_msg = (
        f"{DIM}{timestamp}{RESET} {icon} {color}{BOLD}[{act_upper}]{RESET} "
        f"{message} {DIM}| {filename}:{lineno}{RESET}"
    )
    print(formatted_msg, flush=True)

class ActionLogger:
    """Class wrapper for action logging."""
    @staticmethod
    def log(action: str, message: str):
        log_action(action, message)

logger = ActionLogger()
