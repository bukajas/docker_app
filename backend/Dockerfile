# Use the official Python image based on Alpine Linux
FROM python:3.9-alpine

# Set the working directory inside the container
WORKDIR /fastapi

# Copy the requirements file into the container
COPY ./requirements.txt /fastapi/requirements.txt

# Install dependencies
RUN pip install --no-cache-dir --upgrade -r /fastapi/requirements.txt

# Copy the rest of your application's code into the container
COPY . /fastapi

# Command to run your application
CMD ["uvicorn", "index:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

