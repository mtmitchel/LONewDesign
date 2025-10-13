import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SectionCard } from './SectionCard';
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

type OAuthCallbackPayload = {
  code: string;
  state: string;
  redirectUri: string;
};

type GoogleTokenExchangeResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
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

interface SettingsAccountProps {
  id: string;
  filter: (text: string) => boolean;
  registerSection: (node: HTMLElement | null) => void;
}

export function SettingsAccount({ id, filter, registerSection }: SettingsAccountProps) {
  const sectionMatches = useMemo(() => filter('account google connections calendar tasks mail'), [filter]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

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

  useEffect(() => {
    if (!isHydrated) {
      void hydrate();
    }
  }, [hydrate, isHydrated]);

  if (!sectionMatches) return null;

  const handleAddAccount = () => {
    setShowAddDialog(true);
  };

  const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID ?? 'YOUR_GOOGLE_CLIENT_ID';
  const redirectUri = import.meta.env.VITE_GOOGLE_OAUTH_REDIRECT_URI ?? 'http://127.0.0.1:52315/oauth2callback';

  const exchangeTokens = useCallback(
    async (payload: OAuthCallbackPayload, verifier: string) => {
      if (!isTauriRuntime()) {
        throw new Error('Google OAuth token exchange requires the desktop app runtime.');
      }
      const { invoke } = await import('@tauri-apps/api/core');
      return invoke<GoogleTokenExchangeResponse>('google_oauth_exchange', {
        payload: {
          code: payload.code,
          code_verifier: verifier,
          redirect_uri: payload.redirectUri,
          client_id: clientId,
        },
      });
    },
    [clientId],
  );

  const handleOAuthCallback = useCallback(
    async (payload: OAuthCallbackPayload) => {
      const session = loadPkceSession(payload.state);
      if (!session) {
        toast.error('Google sign-in session expired or is invalid. Please try again.');
        setPending(null);
        setIsAuthenticating(false);
        setError('Session expired before Google sign-in could complete.');
        return;
      }

      try {
        const tokens = await exchangeTokens(payload, session.verifier);
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
        setPending(null);
        setIsAuthenticating(false);
        toast.success('Connected to Google account.');
      } catch (error) {
        console.error('[Google OAuth] Token exchange failed', error);
        clearPkceSession(payload.state);
        setPending(null);
        setIsAuthenticating(false);
        setError('Failed to exchange Google authorization code for tokens.');
        toast.error('Failed to complete Google sign-in.');
      }
    },
    [account, exchangeTokens, setAccount, setError, setPending],
  );

  const buildGoogleOAuthRequest = async () => {
    const { verifier, challenge } = await generatePkcePair();
    const stateToken = crypto.randomUUID();

    savePkceSession(stateToken, {
      verifier,
      state: stateToken,
      redirectUri,
    });

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

    // TODO: listen for OAuth redirect to capture authorization code and exchange for tokens.
    // The loading state will be cleared once the redirect handler runs.
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let unsubscribe: (() => void) | undefined;

    const subscribe = async () => {
      if ((window as unknown as { __TAURI__?: unknown }).__TAURI__) {
        try {
          const { listen } = await import('@tauri-apps/api/event');
          unsubscribe = await listen<OAuthCallbackPayload>('google:oauth:callback', (event) => {
            if (event.payload) {
              void handleOAuthCallback({
                code: event.payload.code,
                state: event.payload.state,
                redirectUri: event.payload.redirectUri,
              });
            }
          });
        } catch (error) {
          console.warn('[SettingsAccount] Failed to subscribe to OAuth callback events', error);
        }
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
    const code = params.get('google_oauth_code');
    const state = params.get('state');
    if (code && state) {
      void handleOAuthCallback({ code, state, redirectUri: window.location.href });
    }
  }, [handleOAuthCallback]);

  const handleRemoveAccount = () => {
    setShowRemoveDialog(true);
  };

  const handleConfirmRemove = () => {
    clearAccount();
    toast.success('Google account disconnected');
    setShowRemoveDialog(false);
  };

  const handleToggleModule = (module: GoogleWorkspaceModule) => (checked: boolean) => {
    setModules({ [module]: checked });
  };

  const connectionLabel = (() => {
    if (!isHydrated) {
      return 'Loading…';
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
    <section
      id={id}
      ref={registerSection}
      aria-labelledby={`${id}-title`}
      role="region"
      className="scroll-mt-28 space-y-[var(--settings-card-gap)]"
    >
      <header className="mb-6">
        <h2 id={`${id}-title`} className="text-xl font-semibold text-[var(--text-primary)]">
          Accounts
        </h2>
      </header>

      <SectionCard title="Google accounts" help="Manage Gmail, Calendar, and Tasks connections." defaultOpen>
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
            </div>
            <div className="flex gap-2">
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
        </div>
      </SectionCard>

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
    </section>
  );
}
