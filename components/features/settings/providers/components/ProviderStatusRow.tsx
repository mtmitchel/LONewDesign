import React from 'react';
import { Button } from '../../../../ui/button';
import { cn } from '../../../../ui/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../../ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../../ui/dropdown-menu';
import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { CONNECTION_HELPER, type DisplayConnectionState } from '../connectionStatus';
import type { ProviderMeta } from '../config';
import type { ProviderStateView } from '../logic';
import { formatRelativeTime } from '../../shared/relativeTime';

interface ProviderStatusRowProps {
  provider: ProviderMeta;
  state: ProviderStateView;
  displayState: DisplayConnectionState;
  isOffline: boolean;
  onConfigure: () => void;
  onRunTest: () => void;
}

export function ProviderStatusRow({ provider, state, displayState, isOffline, onConfigure, onRunTest }: ProviderStatusRowProps): JSX.Element {
  const lastChecked = formatRelativeTime(state.lastCheckedAt);

  const statusIcon = (() => {
    const common = 'size-4';
    switch (displayState) {
      case 'connected':
        return <CheckCircle2 className={cn(common, 'text-green-500')} aria-hidden />;
      case 'failed':
        return <AlertTriangle className={cn(common, 'text-[var(--status-danger)]')} aria-hidden />;
      case 'testing':
        return <Clock className={cn(common, 'text-[var(--status-warn)] animate-pulse')} aria-hidden />;
      case 'offline':
        return <CheckCircle2 className={cn(common, 'text-gray-400')} aria-hidden />;
      case 'not_configured':
      case 'not_verified':
      default:
        return <CheckCircle2 className={cn(common, 'text-gray-400')} aria-hidden />;
    }
  })();

  const tooltipLabel = (() => {
    if (displayState === 'connected') return `Connected${lastChecked ? `. Last checked ${lastChecked}.` : ''}`;
    if (displayState === 'failed') return state.lastError ? `Connection failed: ${state.lastError}` : 'Connection failed.';
    if (displayState === 'offline') return 'Offline. Reconnect to verify.';
    if (displayState === 'testing') return 'Testing connection…';
    if (state.connectionState === 'not_verified') return 'Not verified.';
    if (state.connectionState === 'not_configured') return 'Not connected.';
    return 'Status unknown';
  })();

  const rightActions = (() => {
    if (displayState === 'connected') {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Manage
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onRunTest}>
              Verify again
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onConfigure}>
              Rotate key
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onConfigure} variant="destructive">
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    return (
      <Button variant="outline" size="sm" onClick={onConfigure} disabled={isOffline && displayState === 'offline'}>
        Connect
      </Button>
    );
  })();

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-white px-3 py-3 h-14 transition-all hover:border-[var(--border-default)] hover:shadow-[var(--elevation-sm)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <span aria-label={tooltipLabel} role="img" className="inline-flex items-center justify-center">
                {statusIcon}
              </span>
            </TooltipTrigger>
            <TooltipContent>{tooltipLabel}</TooltipContent>
          </Tooltip>
          {/* Placeholder for future provider logo slot */}
          <span className="inline-block w-5 h-5" aria-hidden />
          <span className="text-sm font-medium text-[var(--text-primary)]">{provider.label}</span>
        </div>
        {rightActions}
      </div>
    </div>
  );
}

export default ProviderStatusRow;
