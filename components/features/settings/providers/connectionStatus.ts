import type { ComponentType } from 'react';
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Circle,
  Clock,
  WifiOff,
} from 'lucide-react';

export type ConnectionState =
  | 'not_configured'
  | 'not_verified'
  | 'testing'
  | 'connected'
  | 'failed';

export type DisplayConnectionState = ConnectionState | 'offline';

export const CONNECTION_LABEL: Record<DisplayConnectionState, string> = {
  not_configured: 'Not set',
  not_verified: 'Not verified',
  testing: 'Testing…',
  connected: 'Connected',
  failed: 'Failed',
  offline: 'Offline',
};

export const CONNECTION_BADGE_CLASS: Record<DisplayConnectionState, string> = {
  not_configured: 'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)]',
  not_verified: 'border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)]',
  testing: 'border border-[color-mix(in_oklab,var(--status-warn)_45%,transparent)] bg-[color-mix(in_oklab,var(--status-warn)_16%,transparent)] text-[var(--status-warn)]',
  connected: 'border border-[color-mix(in_oklab,var(--status-ok)_45%,transparent)] bg-[color-mix(in_oklab,var(--status-ok)_16%,transparent)] text-[var(--status-ok)]',
  failed: 'border border-[color-mix(in_oklab,var(--status-danger)_45%,transparent)] bg-[color-mix(in_oklab,var(--status-danger)_16%,transparent)] text-[var(--status-danger)]',
  offline: 'border border-[color-mix(in_oklab,var(--status-warn)_45%,transparent)] bg-[color-mix(in_oklab,var(--status-warn)_16%,transparent)] text-[var(--status-warn)]',
};

type ConnectionIconMeta = {
  icon: ComponentType<{ className?: string }>;
  className: string;
  spin?: boolean;
};

export const CONNECTION_ICON: Record<DisplayConnectionState, ConnectionIconMeta> = {
  not_configured: { icon: Circle, className: 'text-[var(--text-tertiary)]' },
  not_verified: { icon: Clock, className: 'text-[var(--text-tertiary)]' },
  testing: { icon: Loader2, className: 'text-[var(--status-warn)]', spin: true },
  connected: { icon: CheckCircle2, className: 'text-[var(--status-ok)]' },
  failed: { icon: AlertTriangle, className: 'text-[var(--status-danger)]' },
  offline: { icon: WifiOff, className: 'text-[var(--status-warn)]' },
};

export const CONNECTION_HELPER: Record<ConnectionState, string> = {
  not_configured: 'Add an API key to verify.',
  not_verified: 'Verify to confirm connectivity.',
  testing: 'Testing connection…',
  connected: 'Ready to use.',
  failed: 'Check your key or base URL, then try again.',
};
