#!/bin/bash

# A script to create or update a container-bound Apps Script project based on the
# contents of the current directory, and associate it with a parent Google Drive file.

set -euo pipefail

# --- CONFIG ---
SCRIPT_MAP_FILE="script_map.json"
SOURCE_DIR=$(pwd)

# --- LOGIC ---

# Check for the --refresh flag
if [ "${1:-}" == "--refresh" ]; then
  echo "Refresh flag detected. Processing all parents in $SCRIPT_MAP_FILE..."

  if [ ! -f "$SCRIPT_MAP_FILE" ]; then
    echo "Error: $SCRIPT_MAP_FILE not found. Nothing to refresh." >&2
    exit 1
  fi

  # Extract parent IDs from the map file
  PARENT_IDS=$(jq -r 'keys_unsorted[]' "$SCRIPT_MAP_FILE")

  if [ -z "$PARENT_IDS" ]; then
    echo "No parent IDs found in $SCRIPT_MAP_FILE. Nothing to do."
    exit 0
  fi

  # Loop through each parent ID and run the script for it
  for PARENT_ID in $PARENT_IDS; do
    echo "-----------------------------------------------------"
    echo "Processing parent: $PARENT_ID"
    echo "-----------------------------------------------------"
    # Call the script itself with the parent ID
    "$0" "$PARENT_ID"
    echo "-----------------------------------------------------"
    echo "Finished parent: $PARENT_ID"
    echo "-----------------------------------------------------"
    echo ""
  done

  echo "Refresh process complete."
  exit 0
fi

# --- INPUTS ---
# Get the Parent ID, prompting the user if not provided as an argument.
PARENT_ID=""
if [ -z "${1:-}" ]; then
  read -p "Please enter the Google Drive parent ID: " PARENT_ID
  if [ -z "$PARENT_ID" ]; then
    echo "Error: No parent ID provided. Aborting." >&2
    exit 1
  fi
else
  PARENT_ID="$1"
fi

# --- PREPARE ---
# Ensure the script map file exists and is valid JSON
if [ ! -f "$SCRIPT_MAP_FILE" ]; then
  echo "{}" > "$SCRIPT_MAP_FILE"
fi

# Check if the parent ID already has a script ID in the map
SCRIPT_ID=$(jq -r ".[\"$PARENT_ID\"] // \"\"" "$SCRIPT_MAP_FILE")

# Use a temporary directory for all remote operations
# The 'target' directory is created in the parent of the current directory
# to avoid issues with rsync.
TARGET_DIR=$(mktemp -d -p "$(dirname "$SOURCE_DIR")")

# Cleanup function to remove the temporary directory on exit
cleanup() {
  echo "Cleaning up temporary directory..."
  rm -rf "$TARGET_DIR"
}
trap cleanup EXIT

# --- LOGIC ---
if [ -n "$SCRIPT_ID" ]; then
  # --- UPDATE PATH ---
  echo "Found existing script ID ($SCRIPT_ID) for parent $PARENT_ID. Updating..."

  # 1) Clone the existing script into the temporary directory
  echo "Cloning existing script..."
  (
    cd "$TARGET_DIR" && \
    clasp clone "$SCRIPT_ID"
  )
else
  # --- CREATE PATH ---
  echo "No existing script found for parent $PARENT_ID. Creating a new one..."

  # 1) Create a new container-bound script in the temporary target directory
  echo "Creating new container-bound script..."
  (
    cd "$TARGET_DIR" && \
    clasp create --title "Chatbot" --parentId "$PARENT_ID"
  )

  # 2) Get the new script ID and save it to the map
  NEW_SCRIPT_ID=$(jq -r '.scriptId' "$TARGET_DIR/.clasp.json")
  if [ -z "$NEW_SCRIPT_ID" ]; then
    echo "Error: Could not parse new script ID from .clasp.json" >&2
    exit 1
  fi

  echo "Saving new script mapping: $PARENT_ID -> $NEW_SCRIPT_ID"
  jq ".[\"$PARENT_ID\"] = \"$NEW_SCRIPT_ID\"" "$SCRIPT_MAP_FILE" > "$SCRIPT_MAP_FILE.tmp" && \
  mv "$SCRIPT_MAP_FILE.tmp" "$SCRIPT_MAP_FILE"
fi

# --- COMMON STEPS for both CREATE and UPDATE ---
# Copy all contents from the source directory into the target directory,
# overwriting the cloned/created files.
echo "Copying source files to the project structure..."
rsync -av \
  --exclude='.clasp.json' \
  --exclude='.git' \
  --exclude="$SCRIPT_MAP_FILE" \
  "$SOURCE_DIR/" "$TARGET_DIR/"

# Push the final contents to the script project
echo "Uploading files to the script project..."
(
  cd "$TARGET_DIR" && \
  clasp push -f
)

echo "Process complete."
# The cleanup function will run automatically on exit.
