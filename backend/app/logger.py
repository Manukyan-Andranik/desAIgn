"""
Developer-Friendly Action Logger Utility
=========================================
Provides structured, colorized logging capturing Action, Log Message, File Name, and Line/Row Number.
Format: 🚀 [ACTION] message | File: filename.py (Row: 123)
"""

import inspect
import os
import sys
import re
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

# Plain text fallback for systems that don't support emojis
EMOJI_FALLBACKS = {
    "🚀": "[PIPELINE]",
    "🎯": "[TARGET]",
    "🔍": "[SAM]",
    "📐": "[DEPTH]",
    "🎨": "[CLIP]",
    "🔗": "[SGG]",
    "❌": "[ERROR]",
    "⚠️": "[WARN]",
    "✅": "[SUCCESS]",
    "⚙️": "[CONFIG]"
}

# Regex to strip ANSI colors
ANSI_ESCAPE = re.compile(r'\x1b\[[0-9;]*[a-zA-Z]')

def supports_color() -> bool:
    """Checks if standard output supports ANSI colors."""
    if os.getenv("NO_COLOR") or os.getenv("TERM") == "dumb":
        return False
    # If not a TTY (redirected to file/pipe), disable colors
    if not hasattr(sys.stdout, "isatty") or not sys.stdout.isatty():
        return False
    return True

def supports_unicode() -> bool:
    """Checks if standard output supports UTF-8/Unicode emojis."""
    # Check stdout encoding
    encoding = getattr(sys.stdout, "encoding", None) or "ascii"
    try:
        "🚀".encode(encoding)
        return True
    except (UnicodeEncodeError, TypeError):
        return False

# Detect terminal capabilities dynamically
SUPPORTS_COLOR = supports_color()
SUPPORTS_UNICODE = supports_unicode()

# Set up a backup file path in case stdout/stderr are broken (common in daemonized Passenger)
LOG_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "app.log")
try:
    os.makedirs(os.path.dirname(LOG_FILE_PATH), exist_ok=True)
except Exception:
    pass

def safe_print(msg: str):
    """Prints a message safely, handling BrokenPipeError, OSError, and UnicodeEncodeError."""
    # 1. Strip colors if terminal doesn't support them
    if not SUPPORTS_COLOR:
        msg = ANSI_ESCAPE.sub('', msg)
    
    # 2. Handle emojis and encoding
    encoding = getattr(sys.stdout, "encoding", None) or "utf-8"
    if not SUPPORTS_UNICODE:
        # Fall back to text replacements for emojis
        for emoji, text in EMOJI_FALLBACKS.items():
            msg = msg.replace(emoji, text)
        # Strip any remaining non-ASCII characters
        msg = msg.encode("ascii", errors="replace").decode("ascii")
    else:
        # Encode with replacement to prevent crashes
        msg = msg.encode(encoding, errors="replace").decode(encoding)

    # 3. Safe write to stdout with fallback to stderr and static file
    try:
        sys.stdout.write(msg + "\n")
        sys.stdout.flush()
    except (BrokenPipeError, OSError):
        # Stdout is broken, try stderr
        try:
            sys.stderr.write(msg + "\n")
            sys.stderr.flush()
        except (BrokenPipeError, OSError):
            # Stderr is also broken, fallback to logging into a file
            try:
                with open(LOG_FILE_PATH, "a", encoding="utf-8", errors="replace") as f:
                    f.write(msg + "\n")
            except Exception:
                pass

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
    safe_print(formatted_msg)

class ActionLogger:
    """Class wrapper for action logging."""
    @staticmethod
    def log(action: str, message: str):
        log_action(action, message)

logger = ActionLogger()
