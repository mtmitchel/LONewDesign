import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { exchangeGoogleAuthorizationCode, refreshGoogleAccessToken } from '../lib/oauth/google';

vi.mock('../lib/isTauri', () => ({
  isTauriRuntime: vi.fn(() => false),
}));

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  fetchMock.mockReset();
});

describe('google oauth helpers', () => {
  it('exchanges authorization code via fetch outside Tauri runtime', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ access_token: 'token', expires_in: 3600 }),
    });

    const result = await exchangeGoogleAuthorizationCode({
      code: 'auth-code',
      codeVerifier: 'verifier',
      redirectUri: 'https://app.example.com/oauth',
      clientId: 'client-id',
    });

    expect(result.access_token).toBe('token');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://oauth2.googleapis.com/token');
    const { method, headers, body } = options as RequestInit & { body: string };
    expect(method).toBe('POST');
    expect((headers as Record<string, string>)['Content-Type']).toBe('application/x-www-form-urlencoded');
    expect(body).toContain('code=auth-code');
    expect(body).toContain('code_verifier=verifier');
    expect(body).toContain('redirect_uri=https%3A%2F%2Fapp.example.com%2Foauth');
  });

  it('refreshes access token via fetch outside Tauri runtime', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ access_token: 'fresh-token', expires_in: 1800 }),
    });

    const response = await refreshGoogleAccessToken({
      refreshToken: 'refresh-token',
      clientId: 'client-id',
    });

    expect(response.access_token).toBe('fresh-token');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, options] = fetchMock.mock.calls[0];
    const { body } = options as RequestInit & { body: string };
    expect(body).toContain('refresh_token=refresh-token');
    expect(body).toContain('grant_type=refresh_token');
  });

  it('throws when the token endpoint responds with an error', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve('invalid_grant'),
    });

    await expect(
      refreshGoogleAccessToken({ refreshToken: 'bad', clientId: 'client-id' }),
    ).rejects.toThrow('Google token endpoint returned 400: invalid_grant');
  });
});
