"""
Production Action Logger Utility
=================================
Provides structured logging capturing Action, Log Message, File Name, and Line/Row Number.
Format: ___ [ACTION] message | File: filename.py (Row: 123) ___
"""

import inspect
import os

def log_action(action: str, message: str, level: str = "INFO"):
    """
    Prints a structured log entry containing:
    - Action tag
    - Log message details
    - Originating Source File Name
    - Exact Source Code Row/Line Number
    Enclosed with triple underscores '___' before and after each log.
    """
    frame = inspect.currentframe().f_back
    filename = os.path.basename(frame.f_code.co_filename) if frame else "unknown"
    lineno = frame.f_lineno if frame else 0

    print(f"___ [{action.upper()}] {message} | File: {filename} (Row: {lineno}) ___")

class ActionLogger:
    """Class wrapper for action logging."""
    @staticmethod
    def log(action: str, message: str):
        log_action(action, message)

logger = ActionLogger()
