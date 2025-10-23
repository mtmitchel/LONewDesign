import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccountBridge } from '../../../../lib/bridge';
import { Button } from '../../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../ui/alert-dialog';
import { ExternalLink, Loader2 } from 'lucide-react';
import { Switch } from '../../../ui/switch';
import { Label } from '../../../ui/label';
import { useGoogleWorkspaceSettings, GoogleWorkspaceModule } from '../state/googleWorkspace';
import { toast } from 'sonner';
import { generatePkcePair, savePkceSession, loadPkceSession, clearPkceSession } from '../../../../lib/oauth/pkce';
import { isTauriRuntime } from '../../../../lib/isTauri';
import { open as openShellUrl } from '@tauri-apps/plugin-shell';
import { formatDistanceToNow } from 'date-fns';
import { exchangeGoogleAuthorizationCode, refreshGoogleAccessToken } from '../../../../lib/oauth/google';

type OAuthCallbackPayload = {
  code: string;
  state: string;
  redirectUri: string;
};

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/tasks',
  'openid',
  'email',
  'profile',
];

function decodeIdToken(token?: string | null) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '==='.slice((base64.length + 3) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch (error) {
    console.warn('[decodeIdToken] Failed to parse id_token payload', error);
    return null;
  }
}

interface AccountProviderProps {
  onConnectionChange?: (connected: boolean) => void;
}

export function AccountProvider({ onConnectionChange }: AccountProviderProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  if (process.env.NODE_ENV !== 'production') {
    console.log('[AccountProvider] isTauriRuntime?', isTauriRuntime());
  }

  const account = useGoogleWorkspaceSettings((state) => state.account);
  const status = useGoogleWorkspaceSettings((state) => state.status);
  const lastError = useGoogleWorkspaceSettings((state) => state.lastError);
  const isHydrated = useGoogleWorkspaceSettings((state) => state.isHydrated);
  const hydrate = useGoogleWorkspaceSettings((state) => state.hydrate);
  const setConnecting = useGoogleWorkspaceSettings((state) => state.setConnecting);
  const setAccount = useGoogleWorkspaceSettings((state) => state.setAccount);
  const clearAccount = useGoogleWorkspaceSettings((state) => state.clearAccount);
  const setModules = useGoogleWorkspaceSettings((state) => state.setModules);
  const setPending = useGoogleWorkspaceSettings((state) => state.setPending);
  const setError = useGoogleWorkspaceSettings((state) => state.setError);
  const setStatus = useGoogleWorkspaceSettings((state) => state.setStatus);
  const updateToken = useGoogleWorkspaceSettings((state) => state.updateToken);
  const pendingOperation = useGoogleWorkspaceSettings((state) => state.pending);

  useEffect(() => {
    if (!isHydrated) {
      void hydrate();
    }
  }, [hydrate, isHydrated]);

  const refreshTimerRef = useRef<number | null>(null);
  const refreshInFlightRef = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleAddAccount = () => {
    setShowAddDialog(true);
  };

  const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID ?? 'YOUR_GOOGLE_CLIENT_ID';
  const redirectUri = import.meta.env.VITE_GOOGLE_OAUTH_REDIRECT_URI ?? 'http://127.0.0.1:52315/oauth2callback';
  const clientSecret = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_SECRET ?? null;

  const handleOAuthCallback = useCallback(
    async (payload: OAuthCallbackPayload) => {
      console.log('[AccountProvider] Received OAuth callback payload', payload);
      const session = loadPkceSession(payload.state);
      if (!session) {
        toast.error('Google sign-in session expired or is invalid. Please try again.');
        setPending(null);
        setIsAuthenticating(false);
        setError('Session expired before Google sign-in could complete.');
        return;
      }

      try {
        console.log('[AccountProvider] Loaded PKCE session', session);
        const tokens = await exchangeGoogleAuthorizationCode({
          code: payload.code,
          codeVerifier: session.verifier,
          redirectUri: session.redirectUri ?? payload.redirectUri,
          clientId,
          clientSecret: clientSecret ?? undefined,
        });
        console.log('[AccountProvider] Received token response', tokens);
        clearPkceSession(payload.state);

        const now = Date.now();
        const decoded = decodeIdToken(tokens.id_token);
        const scopes = tokens.scope ? tokens.scope.split(/\s+/).filter(Boolean) : [...GOOGLE_SCOPES];

        const modules = account?.modules ?? { mail: true, calendar: true, tasks: true };
        const syncStatus = account?.syncStatus ?? {
          mail: { lastSuccessAt: null, lastErrorAt: null, lastError: null },
          calendar: { lastSuccessAt: null, lastErrorAt: null, lastError: null },
          tasks: { lastSuccessAt: null, lastErrorAt: null, lastError: null },
        };

        setAccount({
          email: (decoded as any)?.email ?? account?.email ?? 'google-account',
          displayName: (decoded as any)?.name ?? null,
          photoUrl: (decoded as any)?.picture ?? null,
          scopes,
          connectedAt: now,
          modules,
          token: {
            refreshToken: tokens.refresh_token ?? account?.token.refreshToken ?? null,
            accessToken: tokens.access_token,
            accessTokenExpiresAt: tokens.expires_in ? now + tokens.expires_in * 1000 : null,
            lastRefreshAt: now,
          },
          syncStatus,
        });
        setStatus('connected');
        setPending(null);
        setIsAuthenticating(false);
        toast.success('Connected to Google account.');
        
        // Trigger immediate sync after OAuth completes
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('google:oauth:connected'));
        }

        // Notify parent component about connection change
        onConnectionChange?.(true);
      } catch (error) {
        console.error('[Google OAuth] Token exchange failed', error);
        clearPkceSession(payload.state);
        setPending(null);
        setIsAuthenticating(false);
        setError('Failed to exchange Google authorization code for tokens.');
        toast.error('Failed to complete Google sign-in.');
      }
    },
    [account, clientId, setAccount, setError, setPending, setStatus, onConnectionChange],
  );

  const buildGoogleOAuthRequest = async () => {
    const { verifier, challenge } = await generatePkcePair();
    const stateToken = crypto.randomUUID();

    savePkceSession(stateToken, {
      verifier,
      state: stateToken,
      redirectUri,
    });

    if (isTauriRuntime()) {
      try {
        let port: number | null = null;
        try {
          const parsed = new URL(redirectUri);
          port = parsed.port ? Number(parsed.port) : null;
        } catch (error) {
          console.warn('[AccountProvider] Failed to parse redirect URI for loopback listener', error);
        }
        const result = await AccountBridge.startGoogleOAuthLoopback(stateToken, port ?? undefined);
        const actualPort = result.port;
        console.log('[AccountProvider] Loopback listener ready', { requestedPort: port, actualPort });
      } catch (error) {
        console.warn('[AccountProvider] Failed to start OAuth loopback listener', error);
      }
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: GOOGLE_SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state: stateToken,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });

    return {
      authorizationUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      stateToken,
      redirectUri,
    };
  };

  const openSystemBrowser = (url: string) => {
    if (isTauriRuntime()) {
      void openShellUrl(url).catch((error) => {
        console.error('[AccountProvider] Failed to open system browser via Tauri shell plugin', error);
        window.open(url, '_blank', 'noopener');
      });
      return;
    }
    window.open(url, '_blank', 'noopener');
  };

  const handleAuthenticateGoogle = async () => {
    setIsAuthenticating(true);
    const { authorizationUrl, stateToken, redirectUri } = await buildGoogleOAuthRequest();
    setConnecting({ stateToken, redirectUri });
    try {
      openSystemBrowser(authorizationUrl);
      setShowAddDialog(false);
    } catch (error) {
      console.error('Failed to launch Google OAuth window', error);
      toast.error('Unable to open the Google sign-in window.');
      setError('Unable to open the Google sign-in window.');
      setIsAuthenticating(false);
      return;
    }

    // Redirect handler will finalize the flow (deep link listener on desktop, postMessage on web).
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !isTauriRuntime()) {
      return undefined;
    }

    let unsubscribe: (() => void) | undefined;

    const subscribe = async () => {
      try {
        console.log('[AccountProvider] Subscribing to google:oauth:callback');
        const { listen } = await import('@tauri-apps/api/event');
        unsubscribe = await listen<OAuthCallbackPayload>('google:oauth:callback', (event) => {
          console.log('[AccountProvider] Received google:oauth:callback event', event);
          if (event.payload) {
            void handleOAuthCallback({
              code: event.payload.code,
              state: event.payload.state,
              redirectUri: event.payload.redirectUri,
            });
          }
        });
        console.log('[AccountProvider] Subscription established');
      } catch (error) {
        console.warn('[AccountProvider] Failed to subscribe to OAuth callback events', error);
      }
    };

    void subscribe();

    return () => {
      unsubscribe?.();
    };
  }, [handleOAuthCallback]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (code && state) {
      const payload = { code, state, redirectUri: window.location.href };
      if (window.opener && window.opener !== window) {
        try {
          window.opener.postMessage({ kind: 'google-oauth-callback', ...payload }, window.location.origin);
        } catch (error) {
          console.warn('[AccountProvider] Failed to postMessage OAuth payload to opener', error);
        }
        window.close();
        return;
      }
      void handleOAuthCallback(payload);
      const url = new URL(window.location.href);
      url.searchParams.delete('code');
      url.searchParams.delete('state');
      window.history.replaceState(null, document.title, url.toString());
    }
  }, [handleOAuthCallback]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.kind !== 'google-oauth-callback') return;
      const { code, state, redirectUri: messageRedirectUri } = event.data as {
        code?: string;
        state?: string;
        redirectUri?: string;
      };
      if (!code || !state) return;
      void handleOAuthCallback({
        code,
        state,
        redirectUri: messageRedirectUri ?? window.location.href,
      });
    };
    window.addEventListener('message', handler);
    return () => {
      window.removeEventListener('message', handler);
    };
  }, [handleOAuthCallback]);

  const performTokenRefresh = useCallback(
    async (reason: 'manual' | 'scheduled') => {
      if (!account?.token.refreshToken || refreshInFlightRef.current) {
        return;
      }
      refreshInFlightRef.current = true;
      setIsRefreshing(true);
      setPending({ kind: 'refresh-token', startedAt: Date.now(), context: { reason } });
      try {
        const tokens = await refreshGoogleAccessToken({
          refreshToken: account.token.refreshToken,
          clientId,
          clientSecret: clientSecret ?? undefined,
        });
        const now = Date.now();
        updateToken({
          accessToken: tokens.access_token,
          accessTokenExpiresAt: tokens.expires_in ? now + tokens.expires_in * 1000 : null,
          lastRefreshAt: now,
          refreshToken: tokens.refresh_token ?? account.token.refreshToken,
        });
        setPending(null);
        setError(null);
        if (reason === 'manual') {
          toast.success('Google access token refreshed.');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to refresh Google access token.';
        console.error('[Google OAuth] Token refresh failed', error);
        setError(message);
        if (reason === 'manual') {
          toast.error('Failed to refresh Google access token.');
        }
        if (typeof window !== 'undefined') {
          if (refreshTimerRef.current) {
            window.clearTimeout(refreshTimerRef.current);
          }
          refreshTimerRef.current = window.setTimeout(() => {
            refreshTimerRef.current = null;
            void performTokenRefresh('scheduled');
          }, 120_000);
        }
      } finally {
        setIsRefreshing(false);
        refreshInFlightRef.current = false;
      }
    },
    [account, clientId, setError, setPending, updateToken],
  );

  const scheduleTokenRefresh = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    if (!account?.token.refreshToken || !account.token.accessTokenExpiresAt) {
      return;
    }
    const now = Date.now();
    const refreshLeadMs = 60_000; // refresh one minute before expiry
    const refreshAt = account.token.accessTokenExpiresAt - refreshLeadMs;
    const delay = refreshAt - now;
    if (delay <= 0) {
      void performTokenRefresh('scheduled');
      return;
    }
    refreshTimerRef.current = window.setTimeout(() => {
      void performTokenRefresh('scheduled');
    }, Math.max(delay, 5_000));
  }, [account?.token.accessTokenExpiresAt, account?.token.refreshToken, performTokenRefresh]);

  useEffect(() => {
    scheduleTokenRefresh();
    return () => {
      if (typeof window === 'undefined') return;
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [scheduleTokenRefresh]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current && typeof window !== 'undefined') {
        window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, []);

  const tokenExpiryLabel = useMemo(() => {
    if (!account?.token.accessToken || !account.token.accessTokenExpiresAt) return null;
    const label = formatDistanceToNow(account.token.accessTokenExpiresAt, { addSuffix: true });
    if (account.token.accessTokenExpiresAt <= Date.now()) {
      return `Access token expired ${label}`;
    }
    return `Access token refreshes ${label}`;
  }, [account?.token.accessToken, account?.token.accessTokenExpiresAt]);

  const lastRefreshLabel = useMemo(() => {
    if (!account?.token.lastRefreshAt) return null;
    return `Last refreshed ${formatDistanceToNow(account.token.lastRefreshAt, { addSuffix: true })}`;
  }, [account?.token.lastRefreshAt]);

  const handleRemoveAccount = () => {
    setShowRemoveDialog(true);
  };

  const handleConfirmRemove = () => {
    clearAccount();
    toast.success('Google account disconnected');
    setShowRemoveDialog(false);
    
    // Notify parent component about connection change
    onConnectionChange?.(false);
  };

  const handleToggleModule = (module: GoogleWorkspaceModule) => (checked: boolean) => {
    setModules({ [module]: checked });
  };

  const connectionLabel = (() => {
    if (!isHydrated) {
      return 'Loading…';
    }
    if (pendingOperation?.kind === 'refresh-token') {
      return 'Refreshing token…';
    }
    switch (status) {
      case 'connecting':
        return 'Connecting…';
      case 'connected':
        return 'Connected';
      case 'error':
        return 'Connection error';
      default:
        return 'Not connected';
    }
  })();

  const moduleItems: Array<{ id: GoogleWorkspaceModule; label: string; description: string }> = [
    { id: 'mail', label: 'Mail', description: 'Sync Gmail for triage, assistant context, and automations.' },
    { id: 'calendar', label: 'Calendar', description: 'Keep events in sync for dashboard and scheduling flows.' },
    { id: 'tasks', label: 'Tasks', description: 'Enable Google Tasks sync for boards and the calendar rail.' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3">
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {account ? account.email : 'No Google account connected'}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">{connectionLabel}</p>
          {lastError ? (
            <p className="mt-1 text-xs text-[color:var(--danger)]">{lastError}</p>
          ) : null}
          {tokenExpiryLabel ? (
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{tokenExpiryLabel}</p>
          ) : null}
          {lastRefreshLabel ? (
            <p className="text-xs text-[var(--text-secondary)]">{lastRefreshLabel}</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void performTokenRefresh('manual')}
            disabled={!account?.token.refreshToken || isRefreshing || isAuthenticating}
          >
            {isRefreshing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Refreshing
              </>
            ) : (
              'Refresh token'
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleAddAccount}>
            {account ? 'Change account' : 'Connect account'}
          </Button>
          <Button variant="destructive" size="sm" onClick={handleRemoveAccount} disabled={!account}>
            Disconnect
          </Button>
        </div>
      </div>

      <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <h4 className="text-sm font-semibold text-[var(--text-primary)]">Enabled surfaces</h4>
        <p className="text-xs text-[var(--text-secondary)] mb-3">
          Toggle where this Google connection powers LibreOllama features. You can disable a surface to keep data local while remaining signed in.
        </p>
        <div className="space-y-3">
          {moduleItems.map((item) => {
            const enabled = account ? account.modules[item.id] : false;
            const disabled = !account || !isHydrated;
            return (
              <div key={item.id} className="flex items-start justify-between gap-4 rounded-[var(--radius-sm)] px-3 py-2 hover:bg-[var(--bg-surface-elevated)]">
                <div>
                  <Label className="text-sm font-medium text-[var(--text-primary)]" htmlFor={`google-module-${item.id}`}>
                    {item.label}
                  </Label>
                  <p className="text-xs text-[var(--text-secondary)]">{item.description}</p>
                </div>
                <Switch
                  id={`google-module-${item.id}`}
                  checked={enabled}
                  onCheckedChange={handleToggleModule(item.id)}
                  disabled={disabled}
                />
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Google account</DialogTitle>
            <DialogDescription>
              You'll be redirected to Google to sign in and grant access to your Mail, Calendar, and Tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
              <h4 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">What we'll access</h4>
              <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                <li>• Read, send, and manage your email</li>
                <li>• View and edit your calendar events</li>
                <li>• Manage your tasks</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={isAuthenticating}>
              Cancel
            </Button>
            <Button onClick={handleAuthenticateGoogle} disabled={isAuthenticating}>
              {isAuthenticating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Authenticating
                </>
              ) : (
                <>
                  <ExternalLink className="size-4" />
                  Continue with Google
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Google account?</AlertDialogTitle>
            <AlertDialogDescription>
              Disconnecting removes access to Gmail, Calendar, and Tasks sync until you reconnect.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleConfirmRemove}>
                Remove account
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}