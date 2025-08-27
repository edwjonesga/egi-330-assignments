#!/bin/bash

# Build the Docker container
echo "Building Docker container..."
docker build -t firebase-app -f docker/Dockerfile .
