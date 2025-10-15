#!/bin/bash

echo "Checking sync status..."
echo ""
echo "=== Database Status ==="
sqlite3 ~/.local/share/com.therefore.desktop/therefore.db "SELECT COUNT(*) as task_count FROM tasks_metadata;"

echo ""
echo "=== Recent App Logs (last 30 lines) ==="
journalctl --user -n 30 | grep -E "sync_service|OAuth|Google" || echo "No logs found in journalctl"

echo ""
echo "=== Check if app is running ==="
ps aux | grep -E "libreollama|therefore" | grep -v grep

echo ""
echo "To manually test:"
echo "1. Make sure app is running: npm run tauri:dev"
echo "2. Check Settings > Account > Google Workspace is Connected"
echo "3. Wait ~5 seconds for initial sync"
echo "4. Run: sqlite3 ~/.local/share/com.therefore.desktop/therefore.db \"SELECT * FROM tasks_metadata;\""
