import { isTauriRuntime } from '../isTauri';

export type GoogleTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
};

type ExchangePayload = {
  code: string;
  codeVerifier: string;
  redirectUri: string;
  clientId: string;
  clientSecret?: string;
};

type RefreshPayload = {
  refreshToken: string;
  clientId: string;
  clientSecret?: string;
};

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

export async function exchangeGoogleAuthorizationCode(payload: ExchangePayload): Promise<GoogleTokenResponse> {
  if (isTauriRuntime()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<GoogleTokenResponse>('google_oauth_exchange', {
      payload: {
        code: payload.code,
        code_verifier: payload.codeVerifier,
        redirect_uri: payload.redirectUri,
        client_id: payload.clientId,
        client_secret: payload.clientSecret,
      },
    });
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: payload.code,
    code_verifier: payload.codeVerifier,
    redirect_uri: payload.redirectUri,
    client_id: payload.clientId,
  });

  if (payload.clientSecret) {
    body.set('client_secret', payload.clientSecret);
  }

  return requestGoogleTokens(body);
}

export async function refreshGoogleAccessToken(payload: RefreshPayload): Promise<GoogleTokenResponse> {
  if (isTauriRuntime()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<GoogleTokenResponse>('google_oauth_refresh', {
      payload: {
        refresh_token: payload.refreshToken,
        client_id: payload.clientId,
        client_secret: payload.clientSecret,
      },
    });
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: payload.refreshToken,
    client_id: payload.clientId,
  });

  if (payload.clientSecret) {
    body.set('client_secret', payload.clientSecret);
  }

  return requestGoogleTokens(body);
}

async function requestGoogleTokens(body: URLSearchParams): Promise<GoogleTokenResponse> {
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Google token endpoint returned ${response.status}: ${errorBody}`);
  }

  return (await response.json()) as GoogleTokenResponse;
}
