#!/bin/bash

# Smart dev script that handles dynamic port selection for Tauri + Vite

echo "🚀 Starting LibreOllama Desktop development..."

# Function to find available port starting from 5173
find_available_port() {
    local port=5173
    while lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; do
        echo "⚠️  Port $port is busy, trying $((port + 1))..."
        ((port++))
    done
    echo $port
}

# Find available port
AVAILABLE_PORT=$(find_available_port)

if [ "$AVAILABLE_PORT" -ne 5173 ]; then
    echo "🔧 Using port $AVAILABLE_PORT instead of default 5173"
    
    # Update Tauri config with new port
    sed -i.bak "s|http://localhost:[0-9]*|http://localhost:$AVAILABLE_PORT|g" src-tauri/tauri.conf.json
    sed -i.bak "s|ws://localhost:[0-9]*|ws://localhost:$AVAILABLE_PORT|g" src-tauri/tauri.conf.json
    echo "✅ Updated Tauri config for port $AVAILABLE_PORT"
fi

# Start Vite with the available port
echo "🌐 Starting Vite dev server on port $AVAILABLE_PORT..."
exec vite --port $AVAILABLE_PORT --host localhost