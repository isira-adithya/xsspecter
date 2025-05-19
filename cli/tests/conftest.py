import sys
import os

# Ensure project modules are importable by pytest
base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if base_dir not in sys.path:
    sys.path.insert(0, base_dir)

# Include Windows virtualenv site-packages if present
win_venv = os.path.join(base_dir, 'venv', 'Lib', 'site-packages')
if os.path.isdir(win_venv) and win_venv not in sys.path:
    sys.path.insert(0, win_venv)

# Include Linux .testenv virtualenv site-packages if present
py_ver = f"python{sys.version_info.major}.{sys.version_info.minor}"
testenv_venv = os.path.join(base_dir, '.testenv', 'lib', py_ver, 'site-packages')
if os.path.isdir(testenv_venv) and testenv_venv not in sys.path:
    sys.path.insert(0, testenv_venv)