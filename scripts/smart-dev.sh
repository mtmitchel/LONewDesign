#!/bin/bash

set -euo pipefail

# Delegate to the Node helper that handles dynamic port selection + tauri config updates
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec node "$SCRIPT_DIR/dev-with-port.js"