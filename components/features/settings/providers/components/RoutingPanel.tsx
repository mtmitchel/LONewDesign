import React from 'react';
import { Label } from '../../../../ui/label';
import { Input } from '../../../../ui/input';

interface RoutingPanelProps {
  baseUrl: string;
  defaultBase: string;
  onBaseUrlChange: (value: string) => void;
  onBaseUrlBlur?: () => void;
}

export function RoutingPanel({ baseUrl, defaultBase, onBaseUrlChange, onBaseUrlBlur }: RoutingPanelProps): JSX.Element {
  return (
    <div className="space-y-3 text-sm">
      <Label htmlFor="provider-base-url" className="text-sm font-medium text-[var(--text-primary)]">
        Base URL <span className="font-normal text-[var(--text-tertiary)]">(optional)</span>
      </Label>
      <Input
        id="provider-base-url"
        type="url"
        placeholder={defaultBase}
        value={baseUrl}
        onChange={(event) => onBaseUrlChange(event.target.value)}
        onBlur={onBaseUrlBlur}
        autoCapitalize="none"
        autoCorrect="off"
      />
      <p className="text-xs text-[var(--text-tertiary)]">
        Leave blank to use the default endpoint: <span className="font-mono">{defaultBase}</span>
      </p>
    </div>
  );
}

export default RoutingPanel;
