#!/usr/bin/env node

/**
 * Script to start Vite dev server and detect the actual port used
 * Updates Tauri config with the detected port automatically
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Default port to try
const DEFAULT_PORT = 5173;

// Start Vite dev server
console.log('🚀 Starting Vite dev server...');

const viteProcess = spawn('npm', ['run', 'dev'], {
  stdio: ['inherit', 'pipe', 'inherit'],
  shell: true
});

let detectedPort = DEFAULT_PORT;

// Listen for port information from Vite output
viteProcess.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);
  
  // Look for the port in Vite's output
  const portMatch = output.match(/Local:\s+http:\/\/localhost:(\d+)/);
  if (portMatch) {
    detectedPort = parseInt(portMatch[1]);
    console.log(`✅ Detected Vite running on port: ${detectedPort}`);
    
    // Update Tauri config if needed
    if (detectedPort !== DEFAULT_PORT) {
      updateTauriConfig(detectedPort);
    }
  }
});

// Update Tauri configuration with detected port
function updateTauriConfig(port) {
  const configPath = path.join(process.cwd(), 'src-tauri', 'tauri.conf.json');
  
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const newDevUrl = `http://localhost:${port}`;
    
    if (config.build.devUrl !== newDevUrl) {
      config.build.devUrl = newDevUrl;
      
      // Also update CSP to allow the new port
      if (config.app.security.csp) {
        config.app.security.csp = config.app.security.csp.replace(
          /http:\/\/localhost:\d+/g,
          `http://localhost:${port}`
        ).replace(
          /ws:\/\/localhost:\d+/g,
          `ws://localhost:${port}`
        );
      }
      
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log(`🔧 Updated Tauri config to use port ${port}`);
    }
  } catch (error) {
    console.warn(`⚠️  Could not update Tauri config: ${error.message}`);
  }
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down dev server...');
  viteProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  viteProcess.kill();
  process.exit(0);
});