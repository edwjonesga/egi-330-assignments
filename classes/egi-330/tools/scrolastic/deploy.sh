#!/bin/bash

# Path to the .env file
ENV_FILE="functions-js/.env"
CONFIG_FILE=".deploy_config"

# Check if the .env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "The .env file does not exist. Please copy .env.example to .env and fill in your GEMINI_API_KEY."
  exit 1
fi

# Source the .env file to check for the key
source "$ENV_FILE"

# Check if GEMINI_API_KEY is set
if [ -z "$GEMINI_API_KEY" ]; then
  echo "GEMINI_API_KEY is not set in the .env file."
  exit 1
fi

# Get the default project from the config file, or from .firebaserc if the config file doesn't exist
if [ -f "$CONFIG_FILE" ]; then
  DEFAULT_PROJECT=$(cat "$CONFIG_FILE")
else
  DEFAULT_PROJECT=$(grep -o '"default": "[^"]*"' .firebaserc | cut -d '"' -f 4)
fi

# Prompt the user for the project to deploy to
read -p "Enter the project to deploy to (default: $DEFAULT_PROJECT): " project
project=${project:-$DEFAULT_PROJECT}

# Save the selected project as the new default
echo "$project" > "$CONFIG_FILE"

# Run the build script
./build.sh

# Login to firebase
firebase login --no-localhost

# Set the firebase project
firebase use $project

# Deploy to Firebase. The .env file in the functions-js directory will be automatically used.
firebase deploy --only functions,hosting --project $project
