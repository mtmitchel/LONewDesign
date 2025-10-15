#!/bin/bash

# Smart dev script that handles dynamic port selection for Tauri + Vite

echo "🚀 Starting LibreOllama Desktop development..."

# Start Vite with port 5173
echo "🌐 Starting Vite dev server on port 5173..."
exec npx vite --port 5173 --host localhost