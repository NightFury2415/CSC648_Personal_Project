# syntax=docker/dockerfile:1

# We start by specifying the Python version as a build argument
# This makes it easy to change versions without modifying multiple places in the file
ARG PYTHON_VERSION=3.12.4

# Use the official Python slim image as our base
# The 'as base' tag allows us to reference this build stage later if needed
FROM python:${PYTHON_VERSION}-slim as base

# These environment variables optimize Python's behavior in a container:
# - PYTHONDONTWRITEBYTECODE prevents Python from writing .pyc files
# - PYTHONUNBUFFERED ensures we get real-time output in our logs
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory for all subsequent commands
# This is where our application code will live in the container
WORKDIR /app

# Install system dependencies including libmagic
RUN apt-get update && apt-get install -y \
    libmagic-dev \
    && rm -rf /var/lib/apt/lists/*

# Create a non-privileged user for security best practices
# Running as non-root is important for container security
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

# Install dependencies with optimization features:
# - Uses cache mount to speed up subsequent builds
# - Bind mount for requirements.txt prevents unnecessary image layers
COPY requirements.txt .
RUN python -m pip install -r requirements.txt


# Copy all source code into the container
# This happens after installing dependencies to leverage Docker's layer caching
COPY . .

# Switch to our non-privileged user for security
USER appuser

# Document that the container will listen on port 8000
EXPOSE 8000
EXPOSE 8001

# Start the application using gunicorn
# Gunicorn is a production-grade WSGI server for Python web applications
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]