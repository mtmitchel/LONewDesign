import { invoke } from '@tauri-apps/api/core';

export interface OAuthLoopbackResult {
  port: number;
}

/**
 * Bridge module for Tauri invoke calls related to account management and OAuth
 */
export class AccountBridge {
  /**
   * Start Google OAuth loopback listener
   */
  static async startGoogleOAuthLoopback(stateToken: string, port?: number): Promise<OAuthLoopbackResult> {
    return await invoke('google_oauth_loopback_listen', {
      stateToken,
      port,
    }) as OAuthLoopbackResult;
  }
}

