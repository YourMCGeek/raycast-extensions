#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Bytecode Viewer
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 🤖

# Documentation:
# @raycast.description Open Bytecode Viewer
# @raycast.author YourMCGeek
# @raycast.authorURL https://raycast.com/YourMCGeek

if [ -f "/Applications/Bytecode Viewer.jar" ]; then
    java -jar "/Applications/Bytecode Viewer.jar" &
    echo "✅ Opening Bytecode Viewer"
else
    echo "❌ Bytecode Viewer not found"
fi