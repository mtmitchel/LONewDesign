import * as React from "react";
import { AssistantCommand, AssistantSubmitPayload } from "../types";
import { predictIntentLocally, deriveCommand, shouldShowCommandRail } from "../utils/commandUtils";
import { useProviderSettings } from "../../../modules/settings/state/providerSettings";
import { createProviderFromSettings } from "../../services/openaiProvider";

export interface UseCaptureStateProps {
  open: boolean;
  initialValue?: string;
  selectedText?: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: AssistantSubmitPayload) => Promise<void>;
  onCommandSelect?: (command: AssistantCommand) => void;
  onError?: (message: string) => void;
}

export interface CaptureState {
  text: string;
  command: AssistantCommand;
  showCommands: boolean;
  highlightIndex: number;
  busy: boolean;
  error: string | null;
  predictedIntent: "task" | "note" | "event" | null;
  predicting: boolean;
  storedSelectedText: string | undefined;
}

export interface CaptureActions {
  setText: (text: string) => void;
  setCommand: (command: AssistantCommand) => void;
  setShowCommands: (show: boolean) => void;
  setHighlightIndex: (index: number) => void;
  setBusy: (busy: boolean) => void;
  setError: (error: string | null) => void;
  setPredictedIntent: (intent: "task" | "note" | "event" | null) => void;
  setPredicting: (predicting: boolean) => void;
  setStoredSelectedText: (text: string | undefined) => void;
  handleTextChange: (value: string) => void;
  applyCommand: (definition: any) => void;
  submit: () => Promise<void>;
}

export function useCaptureState({
  open,
  initialValue,
  selectedText,
  onOpenChange,
  onSubmit,
  onCommandSelect,
  onError,
}: UseCaptureStateProps): [CaptureState, CaptureActions] {
  const [text, setText] = React.useState(initialValue ?? "");
  const [command, setCommand] = React.useState<AssistantCommand>("capture");
  const [showCommands, setShowCommands] = React.useState(false);
  const [highlightIndex, setHighlightIndex] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [predictedIntent, setPredictedIntent] = React.useState<"task" | "note" | "event" | null>(null);
  const [predicting, setPredicting] = React.useState(false);
  
  const [storedSelectedText, setStoredSelectedText] = React.useState<string | undefined>(() => {
    console.log('[useCaptureState] Initial selectedText:', selectedText?.substring(0, 100) || 'undefined');
    return selectedText;
  });

  const prevCommandRef = React.useRef<AssistantCommand | null>(null);
  const predictionTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const providerSettings = useProviderSettings();

  // Update stored selected text when prop changes
  React.useEffect(() => {
    console.log('[useCaptureState] useEffect - selectedText prop:', selectedText?.substring(0, 100) || 'undefined');
    console.log('[useCaptureState] useEffect - current storedSelectedText:', storedSelectedText?.substring(0, 100) || 'undefined');
    if (selectedText !== storedSelectedText) {
      console.log('[useCaptureState] Updating storedSelectedText');
      setStoredSelectedText(selectedText);
    }
  }, [selectedText, storedSelectedText]);

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      prevCommandRef.current = null;
      setText("");
      setCommand("capture");
      setShowCommands(false);
      setHighlightIndex(0);
      setBusy(false);
      setError(null);
      setPredictedIntent(null);
      setPredicting(false);
      return;
    }

    const initial = initialValue ?? "";
    setText(initial);
    const derived = deriveCommand(initial);
    setCommand(derived);
    setShowCommands(shouldShowCommandRail(initial));
    setHighlightIndex(0);
    setBusy(false);
    setError(null);
  }, [open, initialValue]);

  // Handle command changes
  React.useEffect(() => {
    if (!open) return;
    if (command === prevCommandRef.current) return;
    prevCommandRef.current = command;
    if (command !== "capture") {
      onCommandSelect?.(command);
    }
  }, [command, onCommandSelect, open]);

  // Hybrid intent prediction: instant local + refined AI classification
  React.useEffect(() => {
    // Clear previous timeout
    if (predictionTimeoutRef.current) {
      clearTimeout(predictionTimeoutRef.current);
    }
    
    // Reset predicted intent when empty or has slash command
    const trimmed = text.trim();
    if (!trimmed || trimmed.startsWith("/") || command !== "capture") {
      setPredictedIntent(null);
      return;
    }
    
    // Only predict if we have at least 5 characters
    if (trimmed.length < 5) {
      setPredictedIntent(null);
      return;
    }
    
    // INSTANT: Use local pattern matching for immediate feedback
    const localIntent = predictIntentLocally(trimmed);
    setPredictedIntent(localIntent);
    
    // REFINED: Debounce AI classification by 300ms to refine the prediction
    predictionTimeoutRef.current = setTimeout(async () => {
      try {
        setPredicting(true);
        
        // Check if assistant provider is configured
        const assistantProviderId = providerSettings.assistantProvider;
        if (!assistantProviderId) {
          console.log('[useCaptureState] No assistant provider configured');
          // Keep local prediction if no AI provider
          return;
        }
        
        // Check if the selected provider is configured with API key
        const providerConfig = providerSettings.providers[assistantProviderId as keyof typeof providerSettings.providers];
        if (!providerConfig?.apiKey) {
          console.log('[useCaptureState] Provider not configured:', assistantProviderId);
          // Keep local prediction if provider not configured
          return;
        }
        
        // Create provider and classify (refines local prediction)
        const provider = createProviderFromSettings();
        const intent = await provider.classifyIntent(trimmed);
        
        // Update prediction if AI classification is confident
        // AI result overrides local prediction for accuracy
        if (intent.type === "task" || intent.type === "note" || intent.type === "event") {
          setPredictedIntent(intent.type);
        } else {
          // If AI says unknown, keep local prediction if it exists
          // (local pattern matching might be right)
        }
      } catch (err) {
        console.warn("[useCaptureState] Intent prediction failed:", err);
        // Keep local prediction on API error
      } finally {
        setPredicting(false);
      }
    }, 300);
    
    // Cleanup on unmount or text change
    return () => {
      if (predictionTimeoutRef.current) {
        clearTimeout(predictionTimeoutRef.current);
      }
    };
  }, [text, command, open, providerSettings]);

  const applyCommand = React.useCallback(
    (definition: any) => {
      const leadingWhitespace = text.match(/^\s*/)?.[0] ?? "";
      const trimmed = text.trimStart();
      const hasRest = trimmed.includes(" ");
      const rest = hasRest ? trimmed.slice(trimmed.indexOf(" ") + 1) : "";
      const suffix = hasRest ? ` ${rest}` : " ";
      const nextValue = `${leadingWhitespace}${definition.label}${suffix}`;

      setText(nextValue);
      setCommand(definition.id);
      setShowCommands(false);
      setHighlightIndex(0);
    },
    [text],
  );

  const handleTextChange = (value: string) => {
    setText(value);
    setError(null);
    const derived = deriveCommand(value);
    setCommand(derived);
    setShowCommands(shouldShowCommandRail(value));
  };

  const submit = React.useCallback(async () => {
    const trimmed = text.trim();
    const resolvedCommand = deriveCommand(text);

    try {
      setBusy(true);
      setError(null);
      await onSubmit({ text: trimmed, command: resolvedCommand });
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      onError?.(message);
    } finally {
      setBusy(false);
    }
  }, [onError, onSubmit, text, onOpenChange]);

  const state: CaptureState = {
    text,
    command,
    showCommands,
    highlightIndex,
    busy,
    error,
    predictedIntent,
    predicting,
    storedSelectedText,
  };

  const actions: CaptureActions = {
    setText,
    setCommand,
    setShowCommands,
    setHighlightIndex,
    setBusy,
    setError,
    setPredictedIntent,
    setPredicting,
    setStoredSelectedText,
    handleTextChange,
    applyCommand,
    submit,
  };

  return [state, actions];
}