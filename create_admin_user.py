import subprocess
import sys
import venv
import os
import shutil

# Define the main script and its dependencies
MAIN_SCRIPT = 'users_db_setup.py'  # replace with your main script name
DEPENDENCIES = ['requests','cryptography', 'sqlalchemy','passlib','pymysql']  # add 'cryptography' to the required dependencies

# Create a virtual environment
venv_dir = '.venv_temp'
venv.create(venv_dir, with_pip=True)

# Define the path to the virtual environment's Python interpreter
if sys.platform == 'win32':
    python_executable = os.path.join(venv_dir, 'Scripts', 'python.exe')
else:
    python_executable = os.path.join(venv_dir, 'bin', 'python')

try:
    # Install dependencies
    subprocess.run([python_executable, '-m', 'pip', 'install'] + DEPENDENCIES, check=True)

    # Run the main script and capture the output
    result = subprocess.run([python_executable, MAIN_SCRIPT], check=True, capture_output=True, text=True)
    print(result.stdout)
except subprocess.CalledProcessError as e:
    print(f"Error occurred while running the script: {e}")
    print(f"Return code: {e.returncode}")
    print(f"Output: {e.output}")
    print(f"Error output: {e.stderr}")
finally:
    # Clean up by deleting the virtual environment
    shutil.rmtree(venv_dir)
