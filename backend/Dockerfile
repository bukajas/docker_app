# Use the official Python image based on Alpine Linux
FROM python:3.10

# Set the working directory inside the container
WORKDIR /fastapi

RUN sleep 10

# Copy the requirements file into the container
COPY ./requirements.txt /fastapi/requirements.txt

# Install dependencies
RUN pip install --no-cache-dir --upgrade -r /fastapi/requirements.txt

# Copy the SSL certificates
COPY ./cert.pem /fastapi/cert.pem
COPY ./key.pem /fastapi/key.pem

# Copy the rest of your application's code into the container
COPY . /fastapi

# Command to run your application
#CMD ["uvicorn", "index:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
CMD ["uvicorn", "index:app", "--host", "0.0.0.0", "--port", "8000", "--ssl-keyfile", "/fastapi/key.pem", "--ssl-certfile", "/fastapi/cert.pem", "--reload"]

