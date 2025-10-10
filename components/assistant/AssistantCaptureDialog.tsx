import * as React from "react";
import { Calendar, CheckSquare, Loader2, Sparkles, StickyNote, X } from "lucide-react";

import { Dialog, DialogClose, DialogContent } from "../ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { cn } from "../ui/utils";
import { useProviderSettings } from "../modules/settings/state/providerSettings";
import { createProviderFromSettings } from "./services/openaiProvider";
import { WritingToolsGrid, type WritingTool } from "./WritingToolsGrid";
import { ResultsPane } from "./ResultsPane";

export type AssistantCommand = "capture" | "task" | "note" | "event" | "summarize";

// Language definitions with T-V distinction support
type LanguageOption = {
  code: string; // ISO 639-1 code for LLMs
  deeplCode: string; // DeepL API code
  label: string;
  hasTVDistinction: boolean;
  deeplFormality: boolean; // Whether DeepL supports formality for this language
  formalExample?: string;
  informalExample?: string;
};

const LANGUAGES: LanguageOption[] = [
  { code: "es", deeplCode: "ES", label: "Spanish", hasTVDistinction: true, deeplFormality: true, formalExample: "usted", informalExample: "tú" },
  { code: "fr", deeplCode: "FR", label: "French", hasTVDistinction: true, deeplFormality: true, formalExample: "vous", informalExample: "tu" },
  { code: "de", deeplCode: "DE", label: "German", hasTVDistinction: true, deeplFormality: true, formalExample: "Sie", informalExample: "du" },
  { code: "it", deeplCode: "IT", label: "Italian", hasTVDistinction: true, deeplFormality: true, formalExample: "Lei", informalExample: "tu" },
  { code: "pt", deeplCode: "PT-PT", label: "Portuguese (Portugal)", hasTVDistinction: true, deeplFormality: true, formalExample: "você", informalExample: "tu" },
  { code: "pt-br", deeplCode: "PT-BR", label: "Portuguese (Brazil)", hasTVDistinction: true, deeplFormality: true, formalExample: "você", informalExample: "tu" },
  { code: "ru", deeplCode: "RU", label: "Russian", hasTVDistinction: true, deeplFormality: true, formalExample: "вы", informalExample: "ты" },
  { code: "pl", deeplCode: "PL", label: "Polish", hasTVDistinction: true, deeplFormality: true, formalExample: "pan/pani", informalExample: "ty" },
  { code: "nl", deeplCode: "NL", label: "Dutch", hasTVDistinction: true, deeplFormality: true, formalExample: "u", informalExample: "je" },
  { code: "ja", deeplCode: "JA", label: "Japanese", hasTVDistinction: true, deeplFormality: true, formalExample: "keigo", informalExample: "casual" },
  { code: "ko", deeplCode: "KO", label: "Korean", hasTVDistinction: true, deeplFormality: false, formalExample: "formal", informalExample: "informal" },
  { code: "en", deeplCode: "EN-US", label: "English", hasTVDistinction: false, deeplFormality: false },
  { code: "zh", deeplCode: "ZH", label: "Chinese (Simplified)", hasTVDistinction: false, deeplFormality: false },
  { code: "ar", deeplCode: "AR", label: "Arabic", hasTVDistinction: true, deeplFormality: false, formalExample: "formal", informalExample: "informal" },
];

export type AssistantSubmitPayload = {
  text: string;
  command: AssistantCommand;
};

type CommandDefinition = {
  id: Exclude<AssistantCommand, "capture">;
  label: string;
  desc: string;
  icon: React.ReactNode;
};

const COMMANDS: CommandDefinition[] = [
  { id: "task", label: "/task", desc: "Create a task", icon: <CheckSquare className="size-4" aria-hidden /> },
  { id: "note", label: "/note", desc: "Save as note", icon: <StickyNote className="size-4" aria-hidden /> },
  { id: "event", label: "/event", desc: "Create an event", icon: <Calendar className="size-4" aria-hidden /> },
  { id: "summarize", label: "/summarize", desc: "Summarize selection", icon: <Sparkles className="size-4" aria-hidden /> },
];

function deriveCommand(value: string): AssistantCommand {
  const trimmed = value.trimStart();
  if (!trimmed.startsWith("/")) return "capture";
  const commandToken = trimmed.slice(1).split(/\s+/)[0]?.toLowerCase() ?? "";
  const match = COMMANDS.find((cmd) => cmd.label.slice(1) === commandToken);
  return match?.id ?? "capture";
}

function shouldShowCommandRail(value: string) {
  const trimmed = value.trimStart();
  if (!trimmed.startsWith("/")) return false;
  return !trimmed.includes(" ");
}

function filterCommands(value: string): CommandDefinition[] {
  const trimmed = value.trimStart();
  if (!trimmed.startsWith("/")) return COMMANDS;
  const search = trimmed.slice(1).split(/\s+/)[0]?.toLowerCase() ?? "";
  if (!search) return COMMANDS;
  return COMMANDS.filter((cmd) => cmd.label.slice(1).startsWith(search));
}

// Fast local intent detection using keywords (for instant feedback)
function predictIntentLocally(text: string): "task" | "note" | "event" | null {
  const lower = text.toLowerCase().trim();
  
  if (lower.length < 5) return null;
  
  // Event patterns (highest priority - most specific)
  const eventKeywords = [
    'appointment', 'meeting', 'lunch with', 'dinner with', 'coffee with',
    'call with', 'session', 'conference', 'interview', 'visit', 'class'
  ];
  const hasEventKeyword = eventKeywords.some(kw => lower.includes(kw));
  const hasTime = /\d{1,2}(:\d{2})?\s*(am|pm|AM|PM)/.test(text) || /at \d/.test(lower);
  
  if (hasEventKeyword || hasTime) {
    return "event";
  }
  
  // Task patterns (action-oriented)
  const taskKeywords = [
    'remind me', 'need to', 'have to', 'should', 'todo', 'must',
    'don\'t forget', 'remember to'
  ];
  const taskVerbs = [
    'buy', 'call', 'email', 'write', 'create', 'submit', 'review',
    'draft', 'edit', 'follow up', 'complete', 'deliver', 'finish',
    'clean', 'fix', 'update', 'prepare', 'schedule', 'book', 'order', 'send'
  ];
  
  const hasTaskKeyword = taskKeywords.some(kw => lower.includes(kw));
  const startsWithTaskVerb = taskVerbs.some(verb => {
    const pattern = new RegExp(`^${verb}\\s`, 'i');
    return pattern.test(lower);
  });
  
  if (hasTaskKeyword || startsWithTaskVerb) {
    return "task";
  }
  
  // Note patterns (informational)
  const noteKeywords = [
    'note that', 'note to self', 'remember that', 'keep in mind',
    'fyi', 'noted', 'mentioned', 'said that'
  ];
  const hasNoteKeyword = noteKeywords.some(kw => lower.includes(kw));
  
  if (hasNoteKeyword) {
    return "note";
  }
  
  // Default: unknown
  return null;
}

export interface AssistantCaptureDialogProps {
  open: boolean;
  initialValue?: string;
  selectedText?: string; // Text selected before opening assistant
  canEditSelection?: boolean; // Whether selected text is editable (shows Replace/Insert)
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: AssistantSubmitPayload) => Promise<void>;
  onCommandSelect?: (command: AssistantCommand) => void;
  onError?: (message: string) => void;
  onReplace?: (text: string) => void; // Replace selected text with result
  onInsert?: (text: string) => void; // Insert result at cursor
}

export function AssistantCaptureDialog({
  open,
  initialValue,
  selectedText,
  canEditSelection = true,
  onOpenChange,
  onSubmit,
  onCommandSelect,
  onError,
  onReplace,
  onInsert,
}: AssistantCaptureDialogProps) {
  const [text, setText] = React.useState(initialValue ?? "");
  const [command, setCommand] = React.useState<AssistantCommand>("capture");
  const [showCommands, setShowCommands] = React.useState(false);
  const [highlightIndex, setHighlightIndex] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [predictedIntent, setPredictedIntent] = React.useState<"task" | "note" | "event" | null>(null);
  const [predicting, setPredicting] = React.useState(false);
  
  // Store selected text in state so it persists when dialog opens
  const [storedSelectedText, setStoredSelectedText] = React.useState<string | undefined>(() => {
    console.log('[AssistantCaptureDialog] Initial selectedText:', selectedText?.substring(0, 100) || 'undefined');
    return selectedText;
  });
  
  // Update stored selected text when prop changes
  React.useEffect(() => {
    console.log('[AssistantCaptureDialog] useEffect - selectedText prop:', selectedText?.substring(0, 100) || 'undefined');
    console.log('[AssistantCaptureDialog] useEffect - current storedSelectedText:', storedSelectedText?.substring(0, 100) || 'undefined');
    if (selectedText !== storedSelectedText) {
      console.log('[AssistantCaptureDialog] Updating storedSelectedText');
      setStoredSelectedText(selectedText);
    }
  }, [selectedText, storedSelectedText]);
  
  // Writing tools state
  const [showWritingTools, setShowWritingTools] = React.useState(false);
  const [activeTool, setActiveTool] = React.useState<WritingTool | null>(null);
  const [toolResult, setToolResult] = React.useState("");
  const [isToolRunning, setIsToolRunning] = React.useState(false);
  
  // Translation configuration
  const [showTranslateConfig, setShowTranslateConfig] = React.useState(false);
  const [targetLanguage, setTargetLanguage] = React.useState("es"); // Default: Spanish
  const [formality, setFormality] = React.useState<"formal" | "informal" | "neutral">("neutral");
  const [translationProvider, setTranslationProvider] = React.useState<"deepl" | "assistant">("deepl");
  
  // Get current assistant provider info for display
  const assistantProviderInfo = React.useMemo(() => {
    const settings = useProviderSettings.getState();
    const providerId = settings.assistantProvider;
    const modelId = settings.assistantModel;
    
    // Get provider display name
    const providerName = providerId === 'mistral' ? 'Mistral' :
                        providerId === 'openrouter' ? 'OpenRouter' :
                        providerId === 'glm' ? 'GLM' :
                        providerId === 'openai' ? 'OpenAI' :
                        providerId === 'deepseek' ? 'DeepSeek' :
                        'Assistant';
    
    // Get model display name (if set)
    const modelName = modelId ? modelId.split('/').pop() : null;
    
    return {
      providerId,
      providerName,
      modelName,
      displayName: modelName ? `${providerName} (${modelName})` : providerName
    };
  }, []);

  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const prevCommandRef = React.useRef<AssistantCommand | null>(null);
  const predictionTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const filteredCommands = React.useMemo(() => {
    if (!showCommands) return COMMANDS;
    const results = filterCommands(text);
    return results.length > 0 ? results : COMMANDS;
  }, [showCommands, text]);

  const primaryLabel = React.useMemo(() => {
    // If user typed a slash command, use that
    if (command !== "capture") {
      switch (command) {
        case "task":
          return "Create task";
        case "note":
          return "Save note";
        case "event":
          return "Create event";
        case "summarize":
          return "Summarize";
      }
    }
    
    // Otherwise use predicted intent from natural language
    if (predictedIntent) {
      switch (predictedIntent) {
        case "task":
          return "Create task";
        case "note":
          return "Save note";
        case "event":
          return "Create event";
      }
    }
    
    // Default fallback
    return "Submit";
  }, [command, predictedIntent]);

  const contentIsEmpty = text.trim().length === 0;

  const autoResize = React.useCallback(() => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = "auto";
    const rootStyles = getComputedStyle(document.documentElement);
    const rawVar = rootStyles.getPropertyValue("--assistant-field-max-h").trim();
    const maxHeight = Number.isNaN(Number.parseFloat(rawVar))
      ? 240
      : Number.parseFloat(rawVar);
    const nextHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${nextHeight}px`;
  }, []);

  React.useEffect(() => {
    if (!open) {
      prevCommandRef.current = null;
      setText("");
      setCommand("capture");
      setShowCommands(false);
      setShowTranslateConfig(false);
      setActiveTool(null);
      setToolResult("");
      setHighlightIndex(0);
      setBusy(false);
      setError(null);
      setShowWritingTools(false);
      setActiveTool(null);
      setToolResult("");
      setIsToolRunning(false);
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
    
    // Show writing tools if text is selected
    if (storedSelectedText && storedSelectedText.trim().length > 0) {
      setShowWritingTools(true);
      setToolResult("");
      setActiveTool(null);
    } else {
      setShowWritingTools(false);
    }

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      autoResize();
    });
  }, [open, initialValue, storedSelectedText, autoResize]);

  React.useEffect(() => {
    if (!open) return;
    autoResize();
  }, [text, autoResize, open]);

  React.useEffect(() => {
    if (showCommands) {
      setHighlightIndex(0);
    }
  }, [showCommands, text]);

  React.useEffect(() => {
    if (!open) return;
    if (command === prevCommandRef.current) return;
    prevCommandRef.current = command;
    if (command !== "capture") {
      onCommandSelect?.(command);
    }
  }, [command, onCommandSelect, open]);

  // Hybrid intent prediction: instant local + refined AI classification
  const providerSettings = useProviderSettings();
  
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
          console.log('[AssistantDialog] No assistant provider configured');
          // Keep local prediction if no AI provider
          return;
        }
        
        // Check if the selected provider is configured with API key
        const providerConfig = providerSettings.providers[assistantProviderId as keyof typeof providerSettings.providers];
        if (!providerConfig?.apiKey) {
          console.log('[AssistantDialog] Provider not configured:', assistantProviderId);
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
        console.warn("[AssistantDialog] Intent prediction failed:", err);
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
    (definition: CommandDefinition) => {
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

      requestAnimationFrame(() => {
        textareaRef.current?.focus();
        autoResize();
      });
    },
    [autoResize, onCommandSelect, text],
  );

  const handleTextChange = (value: string) => {
    setText(value);
    setError(null);
    const derived = deriveCommand(value);
    setCommand(derived);
    setShowCommands(shouldShowCommandRail(value));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape" && showCommands) {
      event.preventDefault();
      event.stopPropagation();
      setShowCommands(false);
      return;
    }

    if (showCommands && filteredCommands.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightIndex((prev) => (prev + 1) % filteredCommands.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if ((event.key === "Enter" || event.key === "Tab") && !event.shiftKey) {
        event.preventDefault();
        applyCommand(filteredCommands[highlightIndex] ?? COMMANDS[0]);
        return;
      }
    }

    if (event.key === "/" && !showCommands) {
      setShowCommands(true);
      return;
    }

    if (event.key === "Enter" && !event.shiftKey && !showCommands) {
      event.preventDefault();
      void submit();
    }
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
  }, [onError, onSubmit, text]);

  // Define executeWritingTool first since other callbacks depend on it
  const executeWritingTool = React.useCallback(async (tool: WritingTool) => {
    console.log('[WritingTool] executeWritingTool called:', {
      tool,
      hasSelectedText: !!storedSelectedText,
      selectedTextLength: storedSelectedText?.length || 0,
      translationProvider,
      targetLanguage,
      formality,
    });

    if (!storedSelectedText) {
      console.warn('[WritingTool] No selected text, aborting');
      return;
    }
    
    setActiveTool(tool);
    setIsToolRunning(true);
    setToolResult("");
    
    console.log('[WritingTool] Starting execution via provider...');
    
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const providerSettings = useProviderSettings.getState();

      // Special handling for translate tool with DeepL
      if (tool === 'translate' && translationProvider === 'deepl') {
        const deeplConfig = providerSettings.providers.deepl;
        
        if (!deeplConfig.apiKey) {
          setToolResult(`DeepL API key not configured. Please add it in Settings or use ${assistantProviderInfo.displayName}.`);
          return;
        }

        const selectedLang = LANGUAGES.find(l => l.code === targetLanguage);
        if (!selectedLang) {
          setToolResult("Invalid target language selected.");
          return;
        }

        // Call DeepL API
        const result = await invoke<string>('deepl_translate', {
          apiKey: deeplConfig.apiKey.trim(),
          baseUrl: deeplConfig.baseUrl?.trim() || 'https://api-free.deepl.com',
          text: storedSelectedText,
          targetLang: selectedLang.deeplCode,
          sourceLang: null, // Auto-detect
          formality: selectedLang.deeplFormality && formality !== 'neutral' ? formality : null,
        });

        setToolResult(result);
        return;
      }

      // Build translation prompt with selected language and formality
      const buildTranslatePrompt = () => {
        const selectedLang = LANGUAGES.find(l => l.code === targetLanguage);
        const langName = selectedLang?.label || "Spanish";
        
        let formalityInstruction = "";
        if (selectedLang?.hasTVDistinction) {
          if (formality === "formal") {
            formalityInstruction = `Use FORMAL register${selectedLang.formalExample ? ` (e.g., ${selectedLang.formalExample})` : ''}.`;
          } else if (formality === "informal") {
            formalityInstruction = `Use INFORMAL register${selectedLang.informalExample ? ` (e.g., ${selectedLang.informalExample})` : ''}.`;
          } else {
            formalityInstruction = `Use neutral/standard register (not overly formal or informal).`;
          }
        }
        
        return `Translate the following text to ${langName}. ${formalityInstruction} Return ONLY the translation, no explanations:\n\n${storedSelectedText}`;
      };

      // Build prompt based on tool
      const prompts: Record<WritingTool, string> = {
        professional: `Rewrite the following text in a more professional and formal tone. Return ONLY the rewritten text, no explanations:\n\n${storedSelectedText}`,
        friendly: `Rewrite the following text in a more friendly and casual tone. Return ONLY the rewritten text, no explanations:\n\n${storedSelectedText}`,
        concise: `Make the following text more concise while preserving all key information. Return ONLY the concise version, no explanations:\n\n${storedSelectedText}`,
        expand: `Expand and elaborate on the following text with more detail and context. Return ONLY the expanded text:\n\n${storedSelectedText}`,
        proofread: `Proofread and fix any grammar, spelling, or punctuation errors. Return ONLY the corrected text, no explanations:\n\n${storedSelectedText}`,
        summarize: `Summarize the following text in 2-3 sentences. Return ONLY the summary:\n\n${storedSelectedText}`,
        translate: buildTranslatePrompt(),
        explain: `Explain the following concept in simple, clear terms that anyone can understand. Return ONLY the explanation:\n\n${storedSelectedText}`,
        list: `Convert the following text into a well-formatted bullet point list. Return ONLY the list:\n\n${storedSelectedText}`,
        extract: `Extract the key points from the following text as a numbered list. Return ONLY the list:\n\n${storedSelectedText}`,
      };
      
      // Use configured assistant provider for writing tools
      console.log('[WritingTool] Using provider-based execution');
      try {
        const provider = createProviderFromSettings();
        console.log('[WritingTool] Provider created successfully');
        
        // Convert 'neutral' to undefined for the provider API
        const formalityParam = formality === 'neutral' ? undefined : formality;
        console.log('[WritingTool] Calling provider.runWritingTool...');
        
        const result = await provider.runWritingTool(tool, storedSelectedText, targetLanguage, formalityParam);
        console.log('[WritingTool] Provider returned result:', result.text.substring(0, 100));
        
        setToolResult(result.text);
      } catch (providerError) {
        console.error('[WritingTool] Provider error:', providerError);
        throw new Error(`Provider error: ${providerError instanceof Error ? providerError.message : String(providerError)}`);
      }
      
    } catch (err) {
      console.error('[WritingTool] Execution failed:', err);
      setToolResult(`Error: ${err instanceof Error ? err.message : 'Failed to execute tool'}`);
    } finally {
      setIsToolRunning(false);
    }
  }, [storedSelectedText, translationProvider, targetLanguage, formality, assistantProviderInfo]);

  const handleToolSelect = React.useCallback((tool: WritingTool) => {
    console.log('[handleToolSelect] Tool selected:', tool);
    console.log('[handleToolSelect] storedSelectedText:', storedSelectedText?.substring(0, 100) || 'undefined');
    
    // Special case: Show config dialog for translate
    if (tool === 'translate') {
      setShowTranslateConfig(true);
      return;
    }
    
    // Execute other tools immediately
    executeWritingTool(tool);
  }, [executeWritingTool, storedSelectedText]);

  const executeTranslation = React.useCallback(async () => {
    setShowTranslateConfig(false);
    executeWritingTool('translate');
  }, [executeWritingTool]);

  const suggestionRailVisible = contentIsEmpty && !showCommands;
  const describedBy = error ? "assistant-hint assistant-error" : "assistant-hint";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        aria-modal="true"
        aria-labelledby="assistant-title"
        className={cn(
          "w-full max-w-[var(--modal-max-w)] border border-[var(--border-subtle)]",
          "rounded-[var(--radius-lg)] bg-[var(--bg-surface)] shadow-[var(--elevation-lg)]",
          "p-0 focus-visible:outline-none"
        )}
      >
        <header className="flex items-center justify-between px-[var(--space-6)] pt-[var(--space-6)]">
          <h2 id="assistant-title" className="text-[length:var(--text-lg)] font-semibold text-[color:var(--text-primary)]">
            Assistant
          </h2>
          <DialogClose asChild>
            <button
              type="button"
              className="grid size-8 place-items-center rounded-[var(--radius-md)] text-[color:var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-elevated)]"
              aria-label="Close"
            >
              <X className="size-4" aria-hidden />
            </button>
          </DialogClose>
        </header>

        {/* Writing Tools Mode */}
        {showWritingTools && storedSelectedText && (
          <div className="flex flex-col">
            {/* Show selected text */}
            <div className="px-[var(--space-6)] pt-[var(--space-4)] pb-[var(--space-2)]">
              <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-[var(--space-4)] py-[var(--space-3)]">
                <p className="text-[length:var(--text-xs)] text-[color:var(--text-tertiary)] mb-2">Selected text:</p>
                <p className="text-[length:var(--text-sm)] text-[color:var(--text-secondary)] line-clamp-3">{storedSelectedText}</p>
              </div>
            </div>
            
            {/* Show tools grid or results */}
            {activeTool || toolResult ? (
              <ResultsPane
                result={toolResult}
                isStreaming={isToolRunning}
                onReplace={canEditSelection && onReplace ? () => {
                  onReplace(toolResult);
                  onOpenChange(false);
                } : undefined}
                onInsert={canEditSelection && onInsert ? () => {
                  onInsert(toolResult);
                  onOpenChange(false);
                } : undefined}
                onClose={() => {
                  setActiveTool(null);
                  setToolResult("");
                }}
              />
            ) : showTranslateConfig ? (
              // Translation configuration
              <div className="px-[var(--space-6)] py-[var(--space-4)]">
                <div className="space-y-4">
                  <div>
                    <label className="text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)] mb-2 block">
                      Translation Provider
                    </label>
                    <select
                      value={translationProvider}
                      onChange={(e) => setTranslationProvider(e.target.value as "deepl" | "assistant")}
                      className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] text-[color:var(--text-primary)] text-[length:var(--text-sm)]"
                    >
                      <option value="deepl">DeepL (High quality, native formality)</option>
                      <option value="assistant">{assistantProviderInfo.displayName} (AI-based)</option>
                    </select>
                    {translationProvider === "deepl" && !useProviderSettings.getState().providers.deepl.apiKey && (
                      <p className="text-[length:var(--text-xs)] text-[color:var(--text-tertiary)] mt-1">
                        ⚠️ DeepL API key not configured. Add it in Settings or use {assistantProviderInfo.displayName}.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)] mb-2 block">
                      Target Language
                    </label>
                    <select
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                      className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] text-[color:var(--text-primary)] text-[length:var(--text-sm)]"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {LANGUAGES.find(l => l.code === targetLanguage)?.hasTVDistinction && (
                    <div>
                      <label className="text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)] mb-2 block">
                        Formality Level
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="formality"
                            value="formal"
                            checked={formality === "formal"}
                            onChange={(e) => setFormality(e.target.value as "formal" | "informal" | "neutral")}
                            className="w-4 h-4"
                          />
                          <span className="text-[length:var(--text-sm)] text-[color:var(--text-secondary)]">
                            Formal {LANGUAGES.find(l => l.code === targetLanguage)?.formalExample && 
                              `(${LANGUAGES.find(l => l.code === targetLanguage)?.formalExample})`}
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="formality"
                            value="informal"
                            checked={formality === "informal"}
                            onChange={(e) => setFormality(e.target.value as "formal" | "informal" | "neutral")}
                            className="w-4 h-4"
                          />
                          <span className="text-[length:var(--text-sm)] text-[color:var(--text-secondary)]">
                            Informal {LANGUAGES.find(l => l.code === targetLanguage)?.informalExample && 
                              `(${LANGUAGES.find(l => l.code === targetLanguage)?.informalExample})`}
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="formality"
                            value="neutral"
                            checked={formality === "neutral"}
                            onChange={(e) => setFormality(e.target.value as "formal" | "informal" | "neutral")}
                            className="w-4 h-4"
                          />
                          <span className="text-[length:var(--text-sm)] text-[color:var(--text-secondary)]">
                            Neutral (default)
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => setShowTranslateConfig(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={executeTranslation}
                      className="flex-1"
                    >
                      Translate
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <WritingToolsGrid
                onToolSelect={handleToolSelect}
                disabled={isToolRunning}
              />
            )}
          </div>
        )}

        {/* Normal Mode */}
        {!showWritingTools && (
          <>
            <div className="px-[var(--space-6)] pt-[var(--space-4)] pb-[var(--space-2)]">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  rows={3}
                  value={text}
                  onChange={(event) => handleTextChange(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Capture a thought… Type `/` for commands"
                  aria-describedby={describedBy}
                  autoFocus
                  className={cn(
                    "w-full resize-none bg-transparent text-[length:var(--text-base)] text-[color:var(--text-primary)]",
                    "rounded-[var(--radius-md)] border border-[var(--border-subtle)]",
                    "px-[var(--space-4)] py-[var(--space-3)] shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]"
                  )}
                  style={{ maxHeight: "var(--assistant-field-max-h)" }}
                />

              {showCommands && (
              <div
                role="listbox"
                aria-label="Assistant commands"
                className="mt-[var(--space-2)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] p-[var(--space-2)]"
              >
                {filteredCommands.map((cmd, index) => {
                  const isActive = index === highlightIndex;
                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        applyCommand(cmd);
                      }}
                      className={cn(
                        "flex w-full items-start gap-[var(--space-3)] rounded-[var(--radius-md)] px-[var(--space-3)] py-[var(--space-2)] text-left",
                        isActive
                          ? "bg-[var(--bg-surface)] text-[color:var(--text-primary)]"
                          : "text-[color:var(--text-secondary)] hover:bg-[var(--bg-surface)]"
                      )}
                    >
                      <span className="mt-[2px] text-[color:var(--text-secondary)]">{cmd.icon}</span>
                      <span>
                        <span className="block text-sm text-[color:var(--text-primary)]">{cmd.label}</span>
                        <span className="block text-xs text-[color:var(--text-secondary)]">{cmd.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

              <p id="assistant-hint" className="sr-only">
                Press Enter to {primaryLabel}. Press Shift+Enter for a new line.
              </p>
                {error ? (
                  <p id="assistant-error" className="mt-[var(--space-2)] text-sm text-[color:var(--danger)]" role="alert" aria-live="polite">
                    {error}
                  </p>
                ) : null}
              </div>
            </div>

            {suggestionRailVisible && (
              <div className="px-[var(--space-6)] pb-[var(--space-2)]">
                <div className="flex flex-wrap items-center gap-[var(--space-2)] text-sm text-[color:var(--text-secondary)]">
                  <span className="text-xs uppercase tracking-wide text-[color:var(--text-secondary)]">Suggestions:</span>
                  {COMMANDS.map((cmd) => (
                    <button
                      key={cmd.id}
                      type="button"
                      className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-[var(--space-3)] py-[var(--space-1)] text-sm text-[color:var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-elevated)]"
                      onClick={() => {
                        applyCommand(cmd);
                      }}
                      title={cmd.desc}
                    >
                      {cmd.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer - only show in normal mode */}
        {!showWritingTools && (
          <footer className="border-t border-[var(--border-subtle)] px-[var(--space-6)] py-[var(--space-4)]">
          <div className="flex flex-col gap-[var(--space-3)] sm:flex-row sm:items-center sm:justify-between">
            <a
              href="/notes"
              className="text-sm text-[color:var(--text-secondary)] underline decoration-dotted underline-offset-2 transition-colors hover:text-[color:var(--text-primary)]"
            >
              Go to notes
            </a>
            <div className="flex items-center gap-[var(--space-2)]">
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
                Cancel
              </Button>
              <Button
                onClick={() => void submit()}
                disabled={busy || contentIsEmpty}
                className="min-w-[var(--assistant-primary-min-w)]"
              >
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    <span>Saving…</span>
                  </>
                ) : (
                  primaryLabel
                )}
              </Button>
            </div>
          </div>
          </footer>
        )}
      </DialogContent>
    </Dialog>
  );
}
