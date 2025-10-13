import React from 'react';
import { Button } from '../../../../ui/button';
import { Input } from '../../../../ui/input';
import { Label } from '../../../../ui/label';
import { Eye, EyeOff, Copy, Clipboard } from 'lucide-react';

interface AuthenticationPanelProps {
  apiKey: string;
  revealKey: boolean;
  helperText: string;
  onApiKeyChange: (value: string) => void;
  onApiKeyBlur?: () => void;
  onToggleReveal: () => void;
  onPaste: () => void;
  onCopy: () => void;
}

export function AuthenticationPanel({
  apiKey,
  revealKey,
  helperText,
  onApiKeyChange,
  onApiKeyBlur,
  onToggleReveal,
  onPaste,
  onCopy,
}: AuthenticationPanelProps): JSX.Element {
  return (
    <section className="space-y-3">
      <Label htmlFor="provider-api-key" className="text-sm font-medium">
        API key
      </Label>
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            id="provider-api-key"
            type={revealKey ? 'text' : 'password'}
            placeholder="sk-..."
            className="flex-1 font-mono text-sm"
            value={apiKey}
            onChange={(event) => onApiKeyChange(event.target.value)}
            onBlur={onApiKeyBlur}
            autoComplete="off"
            autoCorrect="off"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-pressed={revealKey}
            onClick={onToggleReveal}
            aria-label={revealKey ? 'Hide key' : 'Show key'}
          >
            {revealKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onPaste}
            aria-label="Paste"
          >
            <Clipboard className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onCopy}
            disabled={!apiKey.trim()}
            aria-label="Copy key"
          >
            <Copy className="size-4" />
          </Button>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">{helperText}</p>
      </div>
    </section>
  );
}

export default AuthenticationPanel;
