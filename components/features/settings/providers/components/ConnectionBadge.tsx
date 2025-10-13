import React from 'react';
import { Badge } from '../../../../ui/badge';
import { cn } from '../../../../ui/utils';
import {
  CONNECTION_BADGE_CLASS,
  CONNECTION_ICON,
  CONNECTION_LABEL,
  type DisplayConnectionState,
} from '../connectionStatus';

interface ConnectionBadgeProps {
  state: DisplayConnectionState;
  className?: string;
}

export function ConnectionBadge({ state, className }: ConnectionBadgeProps): JSX.Element {
  const meta = CONNECTION_ICON[state];
  const Icon = meta.icon;

  return (
    <Badge
      variant="soft"
      size="sm"
      className={cn(CONNECTION_BADGE_CLASS[state], className)}
    >
      <Icon className={cn('size-3', meta.className, meta.spin && 'animate-spin')} />
      {CONNECTION_LABEL[state]}
    </Badge>
  );
}

export default ConnectionBadge;
