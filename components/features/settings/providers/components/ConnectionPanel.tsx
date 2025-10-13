import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '../../../../ui/button';
import ConnectionBadge from './ConnectionBadge';
import { CONNECTION_HELPER, type DisplayConnectionState } from '../connectionStatus';
import type { ProviderStateView } from '../logic';
import { formatRelativeTime } from '../../shared/relativeTime';

interface ConnectionPanelProps {
  state: ProviderStateView;
  displayState: DisplayConnectionState;
  isOffline: boolean;
  isTesting: boolean;
  canRunTest: boolean;
  onRunTest: () => void;
  onViewDetails?: () => void;
}

const BUTTON_LABEL: Record<DisplayConnectionState, string> = {
  not_configured: 'Verify',
  not_verified: 'Verify',
  testing: 'Testing…',
  connected: 'Verify again',
  failed: 'Try again',
  offline: 'Verify',
};

export function ConnectionPanel({
  state,
  displayState,
  isOffline,
  isTesting,
  canRunTest,
  onRunTest,
  onViewDetails,
}: ConnectionPanelProps): JSX.Element {
  const lastChecked = formatRelativeTime(state.lastCheckedAt);
  const helperText =
    displayState === 'offline'
      ? 'Offline right now. Verify once you’re back online.'
      : CONNECTION_HELPER[state.connectionState];

  const metaLine = (() => {
    if (displayState === 'connected' && lastChecked) return `Last checked ${lastChecked}`;
    if (displayState === 'failed' && lastChecked) return `Last tried ${lastChecked}`;
    if (displayState === 'not_verified') return 'Not verified yet.';
    return null;
  })();

  const buttonLabel = displayState === 'testing' ? 'Testing…' : BUTTON_LABEL[displayState];
  const disableButton = isTesting || !canRunTest;

  const errorCopy =
    state.lastError && state.lastError.trim().length > 0
      ? state.lastError
      : 'Couldn’t connect. Check your key or base URL.';

  return (
    <section className="space-y-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--text-primary)]">Connection</p>
          <div className="flex flex-wrap items-center gap-2">
            <ConnectionBadge state={displayState} />
            {metaLine && <span className="text-xs text-[var(--text-tertiary)]">{metaLine}</span>}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full shrink-0 md:w-auto"
          onClick={onRunTest}
          disabled={disableButton}
        >
          {isTesting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Testing…
            </>
          ) : (
            buttonLabel
          )}
        </Button>
      </div>

      <p className="text-sm text-[var(--text-secondary)]">{helperText}</p>

      {displayState === 'failed' && (
        <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-[color-mix(in_oklab,var(--status-danger)_45%,transparent)] bg-[color-mix(in_oklab,var(--status-danger)_12%,transparent)] px-3 py-2 text-sm text-[var(--status-danger)]">
          <span className="flex-1">{errorCopy}</span>
          {onViewDetails && (
            <button
              type="button"
              onClick={onViewDetails}
              className="text-xs font-medium underline"
            >
              Details
            </button>
          )}
        </div>
      )}

      {displayState === 'offline' && (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[color-mix(in_oklab,var(--status-warn)_45%,transparent)] bg-[color-mix(in_oklab,var(--status-warn)_12%,transparent)] px-3 py-2 text-sm text-[var(--status-warn)]">
          Verify will be available once the connection returns.
        </div>
      )}
    </section>
  );
}

export default ConnectionPanel;
