#!/usr/bin/env node

/**
 * Smart dev bootstrapper for Vite + Tauri.
 *
 * - Finds an available port (starting at 5173)
 * - Updates `src-tauri/tauri.conf.json` with the chosen port so Tauri loads the correct dev URL
 * - Starts Vite on that port and keeps the process alive
 * - Restores the original Tauri config when the dev server stops
 */

import fs from 'fs';
import net from 'net';
import path from 'path';
import { spawn } from 'child_process';

const DEFAULT_PORT = Number.parseInt(process.env.VITE_BASE_PORT ?? '5173', 10);
const MAX_PORT_SEARCH = 20;
const PROJECT_ROOT = process.cwd();
const CONFIG_PATH = path.join(PROJECT_ROOT, 'src-tauri', 'tauri.conf.json');

let originalConfigRaw;

try {
  originalConfigRaw = fs.readFileSync(CONFIG_PATH, 'utf8');
} catch (error) {
  console.error('❌ Unable to read src-tauri/tauri.conf.json:', error);
  process.exit(1);
}

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
let viteProcess;
let restored = false;

function restoreTauriConfig() {
  if (restored) return;
  try {
    fs.writeFileSync(CONFIG_PATH, originalConfigRaw, 'utf8');
    restored = true;
    console.log('♻️  Restored Tauri config to its original state.');
  } catch (error) {
    console.warn('⚠️  Failed to restore Tauri config:', error);
  }
}

async function findAvailablePort(startPort) {
  let port = startPort;

  for (let attempt = 0; attempt < MAX_PORT_SEARCH; attempt += 1, port += 1) {
    // eslint-disable-next-line no-await-in-loop
    const isFree = await isPortAvailable(port);
    if (isFree) {
      return port;
    }
  }

  throw new Error(`No available port found after checking ${MAX_PORT_SEARCH} consecutive ports starting at ${startPort}.`);
}

function isPortAvailable(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once('error', (error) => {
      if (error.code === 'EADDRINUSE' || error.code === 'EACCES') {
        resolve(false);
      } else {
        reject(error);
      }
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port, '127.0.0.1');
  });
}

function updateTauriConfig(port) {
  try {
    const config = JSON.parse(originalConfigRaw);
    const devUrl = `http://localhost:${port}`;
    config.build = config.build ?? {};
    config.build.devUrl = devUrl;

    if (config.app?.security?.csp) {
      config.app.security.csp = config.app.security.csp
        .replace(/http:\/\/localhost:\d+/g, devUrl)
        .replace(/ws:\/\/localhost:\d+/g, `ws://localhost:${port}`);
    }

    fs.writeFileSync(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
    console.log(`🔧 Updated Tauri config to point at ${devUrl}`);
  } catch (error) {
    console.warn('⚠️  Failed to update Tauri config:', error);
  }
}

async function main() {
  console.log('🚀 Smart dev bootstrap starting…');

  const port = await findAvailablePort(DEFAULT_PORT);
  const devUrl = `http://localhost:${port}`;

  if (port !== DEFAULT_PORT) {
    console.log(`ℹ️  Port ${DEFAULT_PORT} in use. Using fallback port ${port}.`);
  } else {
    console.log(`ℹ️  Using default port ${port}.`);
  }

  updateTauriConfig(port);

  const viteArgs = ['exec', '--', 'vite', '--port', String(port), '--host', 'localhost'];
  const env = { ...process.env, PORT: String(port), VITE_PORT: String(port), DEV_SERVER_URL: devUrl };

  console.log('🌐 Starting Vite dev server…');
  viteProcess = spawn(npmCmd, viteArgs, {
    stdio: 'inherit',
    env,
  });

  viteProcess.on('close', (code, signal) => {
    restoreTauriConfig();
    if (signal) {
      process.exit(0);
    } else {
      process.exit(code ?? 0);
    }
  });

  viteProcess.on('error', (error) => {
    console.error('❌ Failed to start Vite dev server:', error);
    restoreTauriConfig();
    process.exit(1);
  });
}

function handleShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Shutting down dev server…`);
  if (viteProcess && !viteProcess.killed) {
    viteProcess.kill('SIGINT');
  }
  restoreTauriConfig();
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('exit', restoreTauriConfig);

main().catch((error) => {
  console.error('❌ Smart dev bootstrap failed:', error);
  restoreTauriConfig();
  process.exit(1);
});