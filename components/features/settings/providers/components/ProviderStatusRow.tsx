import React from 'react';
import { Button } from '../../../../ui/button';
import { cn } from '../../../../ui/utils';
import ConnectionBadge from './ConnectionBadge';
import {
  CONNECTION_ICON,
  CONNECTION_HELPER,
  type DisplayConnectionState,
} from '../connectionStatus';
import type { ProviderMeta } from '../config';
import type { ProviderStateView } from '../logic';
import { formatRelativeTime } from '../../shared/relativeTime';

interface ProviderStatusRowProps {
  provider: ProviderMeta;
  state: ProviderStateView;
  displayState: DisplayConnectionState;
  isOffline: boolean;
  onConfigure: () => void;
}

export function ProviderStatusRow({ provider, state, displayState, isOffline, onConfigure }: ProviderStatusRowProps): JSX.Element {
  const iconMeta = CONNECTION_ICON[displayState];
  const StatusIcon = iconMeta.icon;
  const lastChecked = formatRelativeTime(state.lastCheckedAt);

  let metaCopy: string | null = null;
  if (displayState === 'connected' && lastChecked) {
    metaCopy = `Last checked ${lastChecked}`;
  } else if (displayState === 'failed') {
    metaCopy = state.lastError ? state.lastError : 'Couldn’t connect.';
    if (lastChecked) {
      metaCopy = `${metaCopy} Last tried ${lastChecked}.`;
    }
  } else if (displayState === 'offline') {
    metaCopy = 'Offline — reconnect to verify.';
  } else if (displayState === 'testing') {
    metaCopy = 'Testing connection…';
  } else if (state.connectionState === 'not_verified') {
    metaCopy = 'Not verified yet.';
  } else if (state.connectionState === 'not_configured') {
    metaCopy = 'Add an API key to verify.';
  } else {
    metaCopy = CONNECTION_HELPER[state.connectionState];
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-3 transition-all hover:border-[var(--border-default)] hover:shadow-[var(--elevation-sm)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <StatusIcon
            aria-hidden
            className={cn('mt-0.5 size-4', iconMeta.className, iconMeta.spin && 'animate-spin')}
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-[var(--text-primary)]">{provider.label}</span>
              <ConnectionBadge state={displayState} />
            </div>
            {metaCopy && <p className="mt-1 text-xs text-[var(--text-secondary)]">{metaCopy}</p>}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onConfigure} disabled={isOffline && displayState === 'offline'}>
          Configure
        </Button>
      </div>
    </div>
  );
}

export default ProviderStatusRow;
