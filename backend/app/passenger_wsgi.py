import os
import sys

# 1. Enforce strict CPU thread limit constraints BEFORE importing any heavy libraries.
# This prevents OpenMP, PyTorch, BLAS, and Tokenizers from spawning massive thread pools
# on multi-core shared hosts, which triggers the 'libgomp: Thread creation failed' crash.
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["TORCH_NUM_THREADS"] = "1"
os.environ["OMP_THREAD_LIMIT"] = "1"

# 2. Determine base directory and app directory dynamically
current_dir = os.path.dirname(os.path.abspath(__file__))
if os.path.exists(os.path.join(current_dir, "app")):
    BASE_DIR = current_dir
else:
    BASE_DIR = os.path.dirname(current_dir)

APP_DIR = os.path.join(BASE_DIR, "app")

# 3. Setup Python path for app and backend imports
if APP_DIR not in sys.path:
    sys.path.insert(0, APP_DIR)
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Change current working directory to the app folder
os.chdir(APP_DIR)

# 4. Dynamically locate and activate the virtual environment's site-packages
venv_lib_dir = os.path.join(BASE_DIR, "venv", "lib")
if os.path.exists(venv_lib_dir):
    for entry in os.listdir(venv_lib_dir):
        sp_path = os.path.join(venv_lib_dir, entry, "site-packages")
        if os.path.exists(sp_path) and sp_path not in sys.path:
            sys.path.insert(0, sp_path)

# Apply runtime PyTorch CPU thread constraints
try:
    import torch
    torch.set_num_threads(1)
    torch.set_num_interop_threads(1)
except ImportError:
    pass

# 5. Import FastAPI instance and wrap it into a WSGI application for Passenger compatibility
from app.main import app
from fastapi.middleware.wsgi import WSGIMiddleware

# This is the entrypoint Passenger expects
application = WSGIMiddleware(app)