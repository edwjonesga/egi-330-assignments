#!/bin/bash

# Start the Docker container
echo "Starting Docker container..."
docker run -it -p 4000:4000 -p 5000:5000 -p 5001:5001 -p 8080:8080 -p 8085:8085 -p 9000:9000 -p 9099:9099 -p 9199:9199 -v $(pwd):/app firebase-app
