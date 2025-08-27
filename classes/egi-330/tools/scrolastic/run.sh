#!/bin/bash

# Login to firebase
firebase login --no-localhost

# Set the firebase project
firebase use --add scrolastic

# Start firebase emulators
firebase emulators:start
