import subprocess
import sys
import venv
import os
import shutil

# Define the main script and its dependencies
MAIN_SCRIPT = 'users_db_setup.py'  # replace with your main script name
DEPENDENCIES = ['requests','cryptography', 'sqlalchemy', 'pymysql', 'passlib']  # include all required dependencies


mysql_root_password = input("Enter MySQL root password: ")
user_name = input("Enter user name: ")
plain_password = input("Enter plain password: ")
user_email = input("Enter user email: ")
user_full_name = input("Enter user full name: ")



# Command-line arguments for the main script
args = {
    'mysql_root_password': mysql_root_password,
    'user_name': user_name,
    'plain_password': plain_password,
    'user_email': user_email,
    'user_full_name': user_full_name
}

# Create a virtual environment
venv_dir = '.venv_temp'
venv.create(venv_dir, with_pip=True)

# Define the path to the virtual environment's Python interpreter

python_executable = os.path.join(venv_dir, 'bin', 'python')

try:
    # Install dependencies
    subprocess.run([python_executable, '-m', 'pip', 'install'] + DEPENDENCIES, check=True)

    # Prepare the command to run the main script with arguments
    command = [python_executable, MAIN_SCRIPT] + [f'--{key}={value}' for key, value in args.items()]
    
    # Run the main script and capture the output
    result = subprocess.run(command, check=True, capture_output=True, text=True)
    print(result.stdout)
except subprocess.CalledProcessError as e:
    print(f"Error occurred while running the script: {e}")
    print(f"Return code: {e.returncode}")
    print(f"Output: {e.output}")
    print(f"Error output: {e.stderr}")
finally:
    # Clean up by deleting the virtual environment
    shutil.rmtree(venv_dir)
