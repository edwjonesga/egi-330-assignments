#!/bin/bash

# Login to firebase
firebase login --no-localhost

# Set the firebase project
firebase use --add scrolastic

# Start firebase emulators
firebase emulators:start --non-interactive &

# Start the preact app with vite
(cd preact-app && npm run dev)
