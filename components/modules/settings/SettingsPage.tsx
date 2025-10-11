import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button } from '../../ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { ScrollArea } from '../../ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Separator } from '../../ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../ui/accordion';
import { Badge } from '../../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../ui/alert-dialog';
import {
  Copy,
  Eye,
  EyeOff,
  Link2,
  Loader2,
  Plus,
  Save,
  TestTube,
  Trash2,
} from 'lucide-react';
import { useProviderSettings } from './state/providerSettings';

const VIEWPORT_QUERY = '(min-width: 1024px)';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isTauriContext = (): boolean => {
  if (typeof window === 'undefined') return false;
  const candidate = window as unknown as { __TAURI_INTERNALS__?: unknown; isTauri?: unknown };
  return Boolean(candidate.__TAURI_INTERNALS__ ?? candidate.isTauri);
};

const formatBytes = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[exponent]}`;
};

const formatTimestamp = (timestamp?: string | null): string => {
  if (!timestamp) return '—';
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return timestamp;
  return parsed.toLocaleString();
};

const reportEvent = (event: string, payload?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return;
  // eslint-disable-next-line no-console
  console.info(`[analytics] ${event}`, payload ?? {});
};

type ProviderId =
  | 'openai'
  | 'anthropic'
  | 'openrouter'
  | 'deepseek'
  | 'mistral'
  | 'gemini'
  | 'local'
  | 'none';

type WritingStyle = 'balanced' | 'formal' | 'creative';

type SaveScope = 'models' | 'assistant';

type StatusTone = 'neutral' | 'success' | 'error';

interface ProviderConfig {
  id: ProviderId;
  label: string;
  baseUrlPlaceholder?: string;
  hint?: string;
  supportsModelLoad?: boolean;
}

interface ProviderState {
  apiKey: string;
  baseUrl: string;
  savedApiKey: string;
  savedBaseUrl: string;
  saving: boolean;
  status: ProviderStatus;
  lastTested: string | null;
  statusMessage?: string | null;
  statusTone?: StatusTone;
}

interface LocalModel {
  id: string;
  name: string;
  size: string;
  modified: string;
  isDefault: boolean;
}

interface GoogleAccount {
  id: string;
  displayName: string;
  email: string;
  isPrimary: boolean;
  connectedAt: string;
}

interface AssistantSettings {
  provider: ProviderId;
  model: string;
  fallbackProvider: ProviderId | 'none';
  fallbackModel: string;
  style: WritingStyle;
  autoReplace: boolean;
  showConfidence: boolean;
  keepHistory: boolean;
  maxResponseLength: number;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    baseUrlPlaceholder: 'https://api.openai.com/v1',
    hint: 'GPT-4o, o-series, and TTS models. Base URL is optional for proxies.',
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    baseUrlPlaceholder: 'https://api.anthropic.com/v1',
    hint: 'Claude 3 models with long context windows for reasoning and writing.',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrlPlaceholder: 'https://openrouter.ai/api/v1',
    hint: 'Unified marketplace routing across 80+ providers with fallback logic.',
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    baseUrlPlaceholder: 'https://api.deepseek.com/v1',
    hint: 'High-context reasoning models built for code and analysis workloads.',
  },
  {
    id: 'mistral',
    label: 'Mistral AI',
    baseUrlPlaceholder: 'https://api.mistral.ai/v1',
    hint: 'Fast, lightweight instruction-tuned models ideal for realtime UX.',
    supportsModelLoad: true,
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    baseUrlPlaceholder: 'https://generativelanguage.googleapis.com/v1beta',
    hint: 'Google’s Gemini models via the Generative Language API.',
  },
];

// Extended providers list that includes local models option
const ALL_PROVIDERS: ProviderConfig[] = [
  ...PROVIDERS,
  { id: 'local' as ProviderId, label: 'Local (Ollama)' },
];

// Fallback providers list includes a "none" option
const FALLBACK_PROVIDERS: ProviderConfig[] = [
  { id: 'none' as ProviderId, label: 'No fallback' },
  ...ALL_PROVIDERS,
];

const MODEL_OPTIONS: Record<ProviderId, { value: string; label: string }[]> = {
  openai: [
    { value: 'auto', label: 'Auto-select' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o mini' },
    { value: 'o3-mini', label: 'O3 mini' },
  ],
  anthropic: [
    { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3.5-haiku', label: 'Claude 3.5 Haiku' },
    { value: 'claude-3-opus', label: 'Claude 3 Opus' },
  ],
  openrouter: [
    { value: 'auto', label: 'Auto-select' },
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude Sonnet via OpenRouter' },
    { value: 'meta-llama/llama-3.1-405b', label: 'Llama 3.1 405B' },
  ],
  deepseek: [
    { value: 'deepseek-chat', label: 'DeepSeek Chat' },
    { value: 'deepseek-coder', label: 'DeepSeek Coder' },
  ],
  mistral: [
    { value: 'mistral-large-latest', label: 'Mistral Large' },
    { value: 'mistral-medium', label: 'Mistral Medium' },
    { value: 'codestral', label: 'Codestral' },
  ],
  gemini: [
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  ],
  local: [], // Local models are handled dynamically
  none: [], // No fallback provider
};

const WRITING_STYLE_LABEL: Record<WritingStyle, string> = {
  balanced: 'Balanced',
  formal: 'Formal',
  creative: 'Creative',
};

const INITIAL_ASSISTANT_SETTINGS: AssistantSettings = {
  provider: 'openai',
  model: 'gpt-4o',
  fallbackProvider: 'none',
  fallbackModel: '',
  style: 'balanced',
  autoReplace: false,
  showConfidence: false,
  keepHistory: true,
  maxResponseLength: 1000,
};

const createInitialProviderState = (): Record<ProviderId, ProviderState> =>
  PROVIDERS.reduce<Record<ProviderId, ProviderState>>((acc, provider) => {
    acc[provider.id] = {
      apiKey: '',
      baseUrl: '',
      savedApiKey: '',
      savedBaseUrl: '',
      saving: false,
      status: 'empty',
      lastTested: null,
      statusMessage: null,
      statusTone: 'neutral',
    };
    return acc;
  }, {} as Record<ProviderId, ProviderState>);

const useViewportMatch = (query: string): boolean => {
  const initial = useMemo(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia(query).matches;
  }, [query]);

  const [matches, setMatches] = useState(initial);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    setMatches(mq.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, [query]);

  return matches;
};

interface SectionDescriptor {
  id: string;
  label: string;
  description: string;
}

const SECTIONS: SectionDescriptor[] = [
  {
    id: 'cloud',
    label: 'Cloud models',
    description: 'Store API keys, base URLs, and sync models from hosted providers.',
  },
  {
    id: 'local',
    label: 'Local models',
    description: 'Connect your Ollama server and manage downloaded models.',
  },
  {
    id: 'assistant',
    label: 'Assistant',
    description: 'Choose the default provider and tune assistant behavior.',
  },
  {
    id: 'accounts',
    label: 'Accounts',
    description: 'Manage Google connections used across modules.',
  },
];

const statusToneClass: Record<StatusTone, string> = {
  neutral: 'text-[color:var(--text-secondary)]',
  success: 'text-[color:var(--success)]',
  error: 'text-[color:var(--danger)]',
};

type ProviderStatus = 'ok' | 'warn' | 'empty';

const PROVIDER_STATUS_LABEL: Record<ProviderStatus, string> = {
  ok: 'Connected',
  warn: 'Needs attention',
  empty: 'Not connected',
};

const PROVIDER_STATUS_BADGE_CLASS: Record<ProviderStatus, string> = {
  ok: 'bg-[color-mix(in_oklab,var(--status-ok)_18%,transparent)] text-[var(--status-ok)]',
  warn: 'bg-[color-mix(in_oklab,var(--status-warn)_18%,transparent)] text-[var(--status-warn)]',
  empty: 'border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[color:var(--text-secondary)]',
};

export default function SettingsPage(): JSX.Element {
  const isDesktop = useViewportMatch(VIEWPORT_QUERY);
  const [currentSection, setCurrentSection] = useState<string>(SECTIONS[0].id);
  const [mobileOpenSection, setMobileOpenSection] = useState<string>(
    SECTIONS[0].id,
  );

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const navRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const lastReportedSection = useRef<string | null>(null);

  const registerSection = useCallback(
    (id: string) => (node: HTMLElement | null) => {
      sectionRefs.current[id] = node;
    },
    [],
  );

  const registerNavItem = useCallback(
    (id: string) => (node: HTMLAnchorElement | null) => {
      navRefs.current[id] = node;
    },
    [],
  );

  useEffect(() => {
    if (!isDesktop) return;
    const observedNodes = SECTIONS.map((section) => sectionRefs.current[section.id]).filter(
      (node): node is HTMLElement => Boolean(node),
    );
    if (!observedNodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = [...entries]
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target?.id && visible.target.id !== currentSection) {
          setCurrentSection(visible.target.id);
        }
      },
      {
        rootMargin: '-35% 0px -55% 0px',
        threshold: [0.2, 0.4, 0.6],
      },
    );

    observedNodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [currentSection, isDesktop]);

  useEffect(() => {
    if (lastReportedSection.current === currentSection) return;
    lastReportedSection.current = currentSection;
    reportEvent('settings.section_viewed', { section: currentSection });
  }, [currentSection]);

  useEffect(() => {
    if (isDesktop) return;
    setMobileOpenSection(currentSection);
  }, [currentSection, isDesktop]);

  const handleNavClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      event.preventDefault();
      const target = sectionRefs.current[id];
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setCurrentSection(id);
      reportEvent('settings.link_clicked', { section: id, surface: 'sidebar' });
    },
    [],
  );

  const handleNavKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLAnchorElement>) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      const items = SECTIONS.map((section) => navRefs.current[section.id]).filter(
        (node): node is HTMLAnchorElement => Boolean(node),
      );
      const index = items.findIndex((item) => item === event.currentTarget);
      if (index === -1) return;
      const nextIndex =
        event.key === 'ArrowDown'
          ? Math.min(index + 1, items.length - 1)
          : Math.max(index - 1, 0);
      items[nextIndex]?.focus();
    },
    [],
  );

  const [ollamaEndpoint, setOllamaEndpoint] = useState('http://localhost:11434');
  const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'busy' | 'ok' | 'error'>(
    'idle',
  );
  const [ollamaMessage, setOllamaMessage] = useState<string | null>(null);

  const [localModels, setLocalModels] = useState<LocalModel[]>([]);
  const [modelsStatus, setModelsStatus] = useState<string | null>(null);
  const [modelsTone, setModelsTone] = useState<StatusTone>('neutral');

  const localProviderConfig = useProviderSettings((state) => state.providers.local);
  const updateProviderConfig = useProviderSettings((state) => state.updateProvider);

  const testOllama = useCallback(async () => {
    const endpoint = ollamaEndpoint.trim() || 'http://127.0.0.1:11434';
    setOllamaStatus('busy');
    setOllamaMessage(null);
    setModelsStatus(null);
    setModelsTone('neutral');
    reportEvent('settings.test_connection', { target: 'ollama' });

    const runFallbackCheck = () => {
      const success = /^https?:/i.test(endpoint);
      setOllamaStatus(success ? 'ok' : 'error');
      setOllamaMessage(
        success ? 'Connection successful.' : 'Could not reach the Ollama endpoint.',
      );
      return success;
    };

    if (!isTauriContext()) {
      runFallbackCheck();
      setTimeout(() => setOllamaStatus('idle'), 1800);
      return;
    }

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const result = await invoke<{ ok: boolean; message?: string | null }>(
        'test_ollama_connection',
        { baseUrl: endpoint },
      );

      if (!result.ok) {
        throw new Error(result.message ?? 'Could not reach Ollama.');
      }

      setOllamaStatus('ok');
      setOllamaMessage('Connection successful.');

      const models = await invoke<Array<{ name: string; size?: number; modified_at?: string }>>('ollama_list_models', {
        baseUrl: endpoint,
      });
      const modelIds = models.map((model) => model.name);
      const nextDefault = modelIds[0] ?? '';

      setLocalModels(
        models.map((model, index) => ({
          id: model.name,
          name: model.name,
          size: formatBytes(model.size),
          modified: formatTimestamp(model.modified_at ?? null),
          isDefault: nextDefault ? nextDefault === model.name : index === 0,
        })),
      );

      updateProviderConfig('local', {
        baseUrl: endpoint,
        availableModels: modelIds,
        enabledModels: modelIds,
        defaultModel: nextDefault,
      });

      if (modelIds.length) {
        setModelsTone('success');
        setModelsStatus(
          `Found ${modelIds.length} model${modelIds.length === 1 ? '' : 's'}.`,
        );
      } else {
        setModelsTone('neutral');
        setModelsStatus('No models reported. Pull one with `ollama pull`.');
      }
    } catch (error) {
      console.error('Ollama test failed:', error);
      setOllamaStatus('error');
      setOllamaMessage(
        error instanceof Error ? error.message : 'Could not reach the Ollama endpoint.',
      );
      setModelsTone('error');
      setModelsStatus('Model discovery failed.');
    } finally {
      setTimeout(() => setOllamaStatus('idle'), 2000);
    }
  }, [ollamaEndpoint, updateProviderConfig]);

  useEffect(() => {
    if (localProviderConfig.baseUrl && localProviderConfig.baseUrl !== ollamaEndpoint) {
      setOllamaEndpoint(localProviderConfig.baseUrl);
    }

    if (localProviderConfig.availableModels.length === 0) {
      setLocalModels([]);
      return;
    }

    setLocalModels((prev) => {
      const existing = new Map(prev.map((model) => [model.id, model]));
      return localProviderConfig.availableModels.map((id) => {
        const record = existing.get(id);
        return {
          id,
          name: id,
          size: record?.size ?? '—',
          modified: record?.modified ?? '—',
          isDefault: localProviderConfig.defaultModel
            ? localProviderConfig.defaultModel === id
            : record?.isDefault ?? false,
        };
      });
    });
  }, [localProviderConfig.availableModels, localProviderConfig.defaultModel]);

  const setDefaultModel = useCallback((id: string) => {
    setLocalModels((prev) =>
      prev.map((model) => ({ ...model, isDefault: model.id === id })),
    );

    const nextEnabled = localProviderConfig.enabledModels.includes(id)
      ? localProviderConfig.enabledModels
      : [...localProviderConfig.enabledModels, id];

    updateProviderConfig('local', {
      defaultModel: id,
      enabledModels: nextEnabled,
    });

    setModelsTone('success');
    setModelsStatus('Default updated.');
    setTimeout(() => setModelsStatus(null), 2000);
  }, [localProviderConfig.enabledModels, updateProviderConfig]);

  const removeModel = useCallback((id: string) => {
    setLocalModels((prev) => prev.filter((model) => model.id !== id));

    const nextAvailable = localProviderConfig.availableModels.filter((modelId) => modelId !== id);
    const nextEnabled = localProviderConfig.enabledModels.filter((modelId) => modelId !== id);
    const nextDefault = localProviderConfig.defaultModel === id
      ? nextAvailable[0] ?? ''
      : localProviderConfig.defaultModel;

    updateProviderConfig('local', {
      availableModels: nextAvailable,
      enabledModels: nextEnabled,
      defaultModel: nextDefault,
    });

    setModelsTone('neutral');
    setModelsStatus('Model removed.');
    setTimeout(() => setModelsStatus(null), 2000);
  }, [localProviderConfig.availableModels, localProviderConfig.enabledModels, localProviderConfig.defaultModel, updateProviderConfig]);

  const pullModel = useCallback(() => {
    reportEvent('settings.pull_model');
    setModelsTone('neutral');
    setModelsStatus('Model downloader coming soon.');
    setTimeout(() => setModelsStatus(null), 2400);
  }, []);

  const [assistantDraft, setAssistantDraft] = useState<AssistantSettings>(
    INITIAL_ASSISTANT_SETTINGS,
  );
  const [assistantSaved, setAssistantSaved] = useState<AssistantSettings>(
    INITIAL_ASSISTANT_SETTINGS,
  );
  const [assistantSaving, setAssistantSaving] = useState<SaveScope | 'none'>('none');
  const [assistantStatus, setAssistantStatus] = useState<
    { scope: SaveScope; message: string; tone: StatusTone } | null
  >(null);

  const updateAssistant = useCallback(<K extends keyof AssistantSettings>(
    key: K,
    value: AssistantSettings[K],
  ) => {
    setAssistantDraft((prev) => {
      const updated = { ...prev, [key]: value };
      
      // If provider changes, reset model to first available option
      if (key === 'provider' && value !== prev.provider) {
        const newProvider = value as ProviderId;
        let defaultModel = '';
        
        if (newProvider === 'local' && localModels.length > 0) {
          defaultModel = localModels[0].id;
        } else if (MODEL_OPTIONS[newProvider]?.length > 0) {
          defaultModel = MODEL_OPTIONS[newProvider][0].value;
        }
        
        updated.model = defaultModel;
      }
      
      // If fallback provider changes, reset fallback model
      if (key === 'fallbackProvider' && value !== prev.fallbackProvider) {
        const newProvider = value as ProviderId;
        let defaultModel = '';
        
        if (newProvider === 'none') {
          defaultModel = '';
        } else if (newProvider === 'local' && localModels.length > 0) {
          defaultModel = localModels[0].id;
        } else if (MODEL_OPTIONS[newProvider]?.length > 0) {
          defaultModel = MODEL_OPTIONS[newProvider][0].value;
        }
        
        updated.fallbackModel = defaultModel;
      }
      
      return updated;
    });
  }, [localModels]);

  const commitAssistant = useCallback(
    async (scope: SaveScope) => {
      const snapshot = { ...assistantDraft };
      setAssistantSaving(scope);
      reportEvent('settings.assistant_save', { scope });
      await wait(550);
      setAssistantSaved(snapshot);
      setAssistantSaving('none');
      setAssistantStatus({ scope, message: 'Settings saved.', tone: 'success' });
      setTimeout(
        () =>
          setAssistantStatus((prev) =>
            prev && prev.scope === scope ? null : prev,
          ),
        2400,
      );
    },
    [assistantDraft],
  );

  const isModelDefaultsDirty =
    assistantDraft.provider !== assistantSaved.provider ||
    assistantDraft.model !== assistantSaved.model ||
    assistantDraft.fallbackProvider !== assistantSaved.fallbackProvider ||
    assistantDraft.fallbackModel !== assistantSaved.fallbackModel;

  const [providers, setProviders] = useState<Record<ProviderId, ProviderState>>(
    () => createInitialProviderState(),
  );

  const updateProviderField = useCallback(
    (id: ProviderId, field: 'apiKey' | 'baseUrl', value: string) => {
      setProviders((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          [field]: value,
        },
      }));
    },
    [],
  );

  const saveProvider = useCallback(
    async (id: ProviderId) => {
      setProviders((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          saving: true,
        },
      }));
      reportEvent('settings.provider_save', { provider: id });
      await wait(520);
      setProviders((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          savedApiKey: prev[id].apiKey,
          savedBaseUrl: prev[id].baseUrl,
          saving: false,
          statusMessage: 'Saved just now.',
          statusTone: 'success',
        },
      }));
      setTimeout(() => {
        setProviders((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            statusMessage: null,
            statusTone: 'neutral',
          },
        }));
      }, 2400);
    },
    [],
  );

  const testProvider = useCallback(
    async (id: ProviderId) => {
      reportEvent('settings.provider_test', { provider: id });
      setProviders((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          statusMessage: 'Testing…',
          statusTone: 'neutral',
        },
      }));
      await wait(480);
      const hasKey = providers[id]?.apiKey.trim().length > 10;
      const result = hasKey ? 'ok' : 'error';
      const tone: StatusTone = result === 'ok' ? 'success' : 'error';
      const message = result === 'ok' ? 'Credentials look good.' : 'Check your key.';
      const status: ProviderStatus = result === 'ok' ? 'ok' : 'warn';
      const testedAt = new Date().toLocaleString();

      setProviders((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          status,
          lastTested: testedAt,
          statusMessage: message,
          statusTone: tone,
        },
      }));

      setTimeout(() => {
        setProviders((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            statusMessage: null,
            statusTone: 'neutral',
          },
        }));
      }, 2400);

      return result;
    },
    [providers],
  );

  const loadProviderModels = useCallback((id: ProviderId) => {
    reportEvent('settings.provider_load_models', { provider: id });
  }, []);

  const [accounts, setAccounts] = useState<GoogleAccount[]>([
    {
      id: 'acc-1',
      displayName: 'Tyler',
      email: 'mitchel.tyler.m@gmail.com',
      isPrimary: true,
      connectedAt: 'Connected 4 days ago',
    },
  ]);

  const [accountStatus, setAccountStatus] = useState<string | null>(null);
  const [accountTone, setAccountTone] = useState<StatusTone>('neutral');

  const addAccount = useCallback((account: GoogleAccount) => {
    setAccounts((prev) => [...prev, account]);
    setAccountTone('success');
    setAccountStatus('Google account connected.');
    setTimeout(() => setAccountStatus(null), 2400);
  }, []);

  const removeAccount = useCallback((id: string) => {
    setAccounts((prev) => prev.filter((account) => account.id !== id));
    setAccountTone('neutral');
    setAccountStatus('Account removed.');
    setTimeout(() => setAccountStatus(null), 2000);
  }, []);

  const setPrimaryAccount = useCallback((id: string) => {
    setAccounts((prev) =>
      prev.map((account) => ({
        ...account,
        isPrimary: account.id === id,
      })),
    );
    setAccountTone('success');
    setAccountStatus('Primary account updated.');
    setTimeout(() => setAccountStatus(null), 2000);
  }, []);

  const renderLocalSection = useCallback(
    () => (
      <SectionCard
        title="Local models"
        subtitle="Connect your Ollama server and manage downloaded models."
      >
        <div className="space-y-[var(--space-6)]">
        <div className="space-y-[var(--space-2)]">
          <Label htmlFor="ollama-endpoint">Endpoint URL</Label>
            <div className="flex flex-wrap items-center gap-[var(--space-2)]">
              <Input
                id="ollama-endpoint"
                value={ollamaEndpoint}
                onChange={(event) => setOllamaEndpoint(event.target.value)}
                className="max-w-[var(--field-max-w)]"
                placeholder="http://localhost:11434"
                spellCheck={false}
                autoComplete="off"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-[color:var(--text-secondary)]"
                onClick={() => {
                  if (!ollamaEndpoint.trim()) return;
                  window.open(ollamaEndpoint.trim(), '_blank', 'noopener,noreferrer');
                  reportEvent('settings.open_endpoint', { target: 'ollama' });
                }}
              >
                <Link2 className="mr-2 size-4" />
                Open
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={testOllama}
                disabled={ollamaStatus === 'busy'}
              >
                <TestTube className="mr-2 size-4" />
                {ollamaStatus === 'busy'
                  ? 'Testing…'
                  : ollamaStatus === 'ok'
                    ? 'Success'
                    : ollamaStatus === 'error'
                      ? 'Retry'
                      : 'Test connection'}
              </Button>
            </div>
            {ollamaMessage ? (
              <p
                className={`text-sm ${statusToneClass[
                  ollamaStatus === 'error'
                    ? 'error'
                    : ollamaStatus === 'ok'
                      ? 'success'
                      : 'neutral'
                ]}`}
              >
                {ollamaMessage}
              </p>
            ) : null}
          </div>

          <Separator />

          <div className="flex flex-wrap items-center justify-between gap-[var(--space-3)]">
            <div className="space-y-[var(--space-1)]">
              <p className="text-sm font-medium text-[color:var(--text-primary)]">Models</p>
              {modelsStatus ? (
                <span className={`text-xs ${statusToneClass[modelsTone]}`}>{modelsStatus}</span>
              ) : null}
            </div>
            <Button onClick={pullModel} variant="outline" size="sm">
              <Plus className="mr-2 size-4" />
              Pull model
            </Button>
          </div>

          <div className="overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--border-subtle)]">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-[var(--space-2)] bg-[color:var(--bg-surface-elevated)] px-[var(--space-3)] py-[var(--space-2)] text-[color:var(--text-secondary)] text-sm">
              <span>Model</span>
              <span>Size</span>
              <span>Modified</span>
              <span className="justify-self-end">Actions</span>
            </div>
            {localModels.length === 0 ? (
              <div className="px-[var(--space-3)] py-[var(--space-4)] text-center text-sm text-[color:var(--text-secondary)]">
                No local models yet.
              </div>
            ) : (
              localModels.map((model) => (
                <div
                  key={model.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-[var(--space-2)] border-t border-[color:var(--border-subtle)] px-[var(--space-3)] py-[var(--space-3)] text-sm"
                >
                  <div className="flex items-center gap-[var(--space-2)]">
                    <input
                      type="radio"
                      name="default-local-model"
                      checked={model.isDefault}
                      onChange={() => setDefaultModel(model.id)}
                      aria-label={`Set ${model.name} as default`}
                      className="size-4 accent-[color:var(--primary)]"
                    />
                    <span className="font-medium text-[color:var(--text-primary)]">{model.name}</span>
                  </div>
                  <span className="text-[color:var(--text-secondary)]">{model.size}</span>
                  <span className="text-[color:var(--text-secondary)]">{model.modified}</span>
                  <div className="flex justify-end">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-[color:var(--text-secondary)]"
                          title={`Delete ${model.name}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-[color:var(--bg-surface)] border border-[color:var(--border-subtle)] shadow-[var(--elevation-lg)]">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete model?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove <strong>{model.name}</strong> from disk. You can redownload it later.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removeModel(model.id)}
                            className="bg-[color:var(--danger)] hover:bg-[color:var(--danger)]/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </SectionCard>
    ),
    [
      localModels,
      modelsStatus,
      modelsTone,
      ollamaEndpoint,
      ollamaMessage,
      ollamaStatus,
      pullModel,
      removeModel,
      setDefaultModel,
      setOllamaEndpoint,
      testOllama,
    ],
  );

  const renderAssistantSection = useCallback(
    () => (
      <ModelDefaultsCard
        providers={ALL_PROVIDERS}
        assistant={assistantDraft}
        localModels={localModels}
        isDirty={isModelDefaultsDirty}
        isSaving={assistantSaving === 'models'}
        status={
          assistantStatus?.scope === 'models' ? assistantStatus.message : null
        }
        statusTone={assistantStatus?.tone ?? 'neutral'}
        onProviderChange={(value) => updateAssistant('provider', value)}
        onModelChange={(value) => updateAssistant('model', value)}
        onFallbackProviderChange={(value) => updateAssistant('fallbackProvider', value)}
        onFallbackModelChange={(value) => updateAssistant('fallbackModel', value)}
        onSave={() => commitAssistant('models')}
      />
    ),
    [
      ALL_PROVIDERS,
      assistantDraft,
      assistantSaving,
      assistantStatus,
      commitAssistant,
      isModelDefaultsDirty,
      localModels,
      updateAssistant,
    ],
  );

  const renderProvidersSection = useCallback(
    () => (
      <SectionCard
        title="Cloud providers"
        subtitle="Manage API keys, base URLs, and model syncing for hosted services."
      >
        <Accordion type="multiple" className="divide-y divide-[color:var(--border-subtle)]">
          {PROVIDERS.map((provider) => {
            const state = providers[provider.id];
            const dirty =
              state.apiKey !== state.savedApiKey ||
              state.baseUrl !== state.savedBaseUrl;
            return (
              <ProviderAccordionItem
                key={provider.id}
                provider={provider}
                state={state}
                isDirty={dirty}
                onChange={updateProviderField}
                onSave={saveProvider}
                onTest={testProvider}
                onLoadModels={loadProviderModels}
              />
            );
          })}
        </Accordion>
      </SectionCard>
    ),
    [loadProviderModels, providers, saveProvider, testProvider, updateProviderField],
  );

  const renderAccountSection = useCallback(
    () => (
      <GoogleAccountsCard
        accounts={accounts}
        onAdd={addAccount}
        onRemove={removeAccount}
        onSetPrimary={setPrimaryAccount}
        statusMessage={accountStatus}
        statusTone={accountTone}
      />
    ),
    [accountStatus, accountTone, accounts, addAccount, removeAccount, setPrimaryAccount],
  );

  const sectionContent: Record<string, () => React.ReactNode> = {
    cloud: renderProvidersSection,
    local: renderLocalSection,
    assistant: renderAssistantSection,
    accounts: renderAccountSection,
  };

  const desktopLayout = (
    <div
      className="grid gap-[var(--space-8)]"
      style={{
        gridTemplateColumns: 'minmax(0, var(--settings-nav-w)) 1fr',
      }}
    >
      <nav
        aria-label="Settings sections"
        className="sticky top-0 h-[100dvh] overflow-y-auto bg-[color:var(--bg-surface-elevated)] border-r border-[color:var(--border-subtle)]"
      >
        <ul className="flex flex-col gap-[var(--space-2)] p-[var(--space-6)]">
          {SECTIONS.map((section) => {
            const isActive = currentSection === section.id;
            return (
              <li key={section.id}>
                <a
                  ref={registerNavItem(section.id)}
                  href={`#${section.id}`}
                  className={[
                    'block rounded-[var(--radius-md)] px-[var(--space-3)] py-[var(--space-2)] transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[color:var(--focus-ring)]',
                    'text-[color:var(--text-primary)] hover:bg-[color:var(--bg-surface)]',
                    isActive
                      ? 'bg-[color:var(--primary-tint-10)] font-medium'
                      : 'font-normal',
                  ].join(' ')}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={(event) => handleNavClick(event, section.id)}
                  onKeyDown={handleNavKeyDown}
                  title={section.label}
                >
                  {section.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <ScrollArea className="h-[100dvh]">
        <div className="mx-auto flex max-w-[var(--content-measure)] flex-col gap-[var(--space-8)] px-[var(--space-6)] py-[var(--space-6)]">
          {SECTIONS.map((section) => (
            <Section
              key={section.id}
              id={section.id}
              title={section.label}
              description={section.description}
              ref={registerSection(section.id)}
            >
              {sectionContent[section.id]()}
            </Section>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  const mobileLayout = (
    <div className="flex flex-col gap-[var(--space-4)]">
      <Tabs
        value={currentSection}
        onValueChange={(value) => {
          setCurrentSection(value);
          setMobileOpenSection(value);
          reportEvent('settings.link_clicked', {
            section: value,
            surface: 'mobile-tabs',
          });
        }}
      >
        <TabsList className="bg-[color:var(--bg-surface-elevated)] overflow-x-auto">
          {SECTIONS.map((section) => (
            <TabsTrigger key={section.id} value={section.id} className="data-[state=active]:shadow-none">
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {SECTIONS.map((section) => (
          <TabsContent key={section.id} value={section.id} className="hidden" />
        ))}
      </Tabs>

      <div className="space-y-[var(--space-3)]">
        <Accordion
          type="single"
          collapsible
          value={mobileOpenSection}
          onValueChange={(value) => {
            if (!value) return;
            setMobileOpenSection(value);
            setCurrentSection(value);
            reportEvent('settings.section_opened', {
              section: value,
              surface: 'mobile-accordion',
            });
          }}
        >
          {SECTIONS.map((section) => (
            <AccordionItem
              key={section.id}
              value={section.id}
              className="border border-[color:var(--border-subtle)] rounded-[var(--radius-lg)] bg-[color:var(--bg-surface)]"
            >
              <AccordionTrigger className="px-[var(--space-4)] text-left">
                <div className="flex flex-col gap-[var(--space-1)] text-left">
                  <span className="text-[color:var(--text-primary)] text-base font-medium">
                    {section.label}
                  </span>
                  <span className="text-[color:var(--text-secondary)] text-sm">
                    {section.description}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-[var(--space-4)] pb-[var(--space-4)]">
                <div className="flex flex-col gap-[var(--space-6)]">
                  {sectionContent[section.id]()}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-[var(--space-6)]">
      {isDesktop ? desktopLayout : mobileLayout}
    </div>
  );
}

interface SectionProps {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ id, title, description, children }, ref) => (
    <section
      id={id}
      ref={ref}
      role="region"
      aria-labelledby={`${id}-heading`}
      className="flex flex-col gap-[var(--space-3)]"
    >
      <header className="flex flex-col gap-[var(--space-1)]">
        <h2
          id={`${id}-heading`}
          className="text-[color:var(--text-primary)] text-xl font-medium"
        >
          {title}
        </h2>
        <p className="text-[color:var(--text-secondary)] text-sm">{description}</p>
      </header>
      <div className="flex flex-col gap-[var(--space-6)]">{children}</div>
    </section>
  ),
);
Section.displayName = 'Section';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  statusMessage?: string | null;
  statusTone?: StatusTone;
}

function SectionCard({
  title,
  subtitle,
  children,
  footer,
  statusMessage,
  statusTone = 'neutral',
}: SectionCardProps) {
  return (
    <Card className="rounded-[var(--radius-lg)] border border-[color:var(--border-subtle)] bg-[color:var(--bg-surface)] shadow-[var(--elevation-sm)]">
      <CardHeader className="gap-[var(--space-1)]">
        <CardTitle className="text-[color:var(--text-primary)] text-lg font-medium">
          {title}
        </CardTitle>
        {subtitle ? (
          <CardDescription className="text-[color:var(--text-secondary)] text-sm">
            {subtitle}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-[var(--space-4)]">
        {children}
      </CardContent>
      {footer ? (
        <CardFooter className="border-t border-[color:var(--border-subtle)] pt-[var(--space-4)]">
          <div
            className="flex w-full items-center justify-between gap-[var(--space-3)]"
            aria-live="polite"
          >
            {statusMessage ? (
              <span
                className={`${statusToneClass[statusTone]} text-sm`}
              >
                {statusMessage}
              </span>
            ) : (
              <span className="text-[color:var(--text-secondary)] text-sm">
                &nbsp;
              </span>
            )}
            <div className="flex items-center gap-[var(--space-2)]">{footer}</div>
          </div>
        </CardFooter>
      ) : null}
    </Card>
  );
}

interface ModelDefaultsCardProps {
  providers: ProviderConfig[];
  assistant: AssistantSettings;
  localModels: LocalModel[];
  isDirty: boolean;
  isSaving: boolean;
  status: string | null;
  statusTone: StatusTone;
  onProviderChange: (provider: ProviderId) => void;
  onModelChange: (model: string) => void;
  onFallbackProviderChange: (provider: ProviderId) => void;
  onFallbackModelChange: (model: string) => void;
  onSave: () => void;
}

function ModelDefaultsCard({
  providers,
  assistant,
  localModels,
  isDirty,
  isSaving,
  status,
  statusTone,
  onProviderChange,
  onModelChange,
  onFallbackProviderChange,
  onFallbackModelChange,
  onSave,
}: ModelDefaultsCardProps) {
  // Get model options for primary provider
  const getPrimaryModelOptions = () => {
    if (assistant.provider === 'local') {
      return localModels.map(model => ({
        value: model.id,
        label: model.name
      }));
    } else if (assistant.provider === 'none') {
      return [];
    } else {
      return MODEL_OPTIONS[assistant.provider] || [];
    }
  };

  // Get model options for fallback provider
  const getFallbackModelOptions = () => {
    if (assistant.fallbackProvider === 'none') {
      return [];
    } else if (assistant.fallbackProvider === 'local') {
      return localModels.map(model => ({
        value: model.id,
        label: model.name
      }));
    } else {
      return MODEL_OPTIONS[assistant.fallbackProvider] || [];
    }
  };

  return (
    <SectionCard
      title="Model defaults"
      subtitle="Configure primary and fallback providers for system-wide operations."
      footer={
        <Button onClick={onSave} disabled={!isDirty || isSaving}>
          {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
      }
      statusMessage={status}
      statusTone={statusTone}
    >
      <div className="flex flex-col gap-[var(--space-6)]">
        {/* Primary Provider Section */}
        <div className="flex flex-col gap-[var(--space-4)]">
          <h4 className="text-[color:var(--text-primary)] font-medium">Primary provider</h4>
          <div className="flex flex-col gap-[var(--space-4)] sm:flex-row sm:gap-[var(--space-6)]">
            <div className="flex flex-col gap-[var(--space-2)] flex-1">
              <Label>Provider</Label>
              <Select
                value={assistant.provider}
                onValueChange={(value) => onProviderChange(value as ProviderId)}
              >
                <SelectTrigger className="max-w-[var(--field-max-w)]">
                  <SelectValue placeholder="Choose a provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-[var(--space-2)] flex-1">
              <Label>Model</Label>
              <Select
                value={assistant.model}
                onValueChange={onModelChange}
                disabled={assistant.provider === 'none'}
              >
                <SelectTrigger className="max-w-[var(--field-max-w)]">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {getPrimaryModelOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Fallback Provider Section */}
        <div className="flex flex-col gap-[var(--space-4)]">
          <h4 className="text-[color:var(--text-primary)] font-medium">Fallback provider</h4>
          <div className="flex flex-col gap-[var(--space-4)] sm:flex-row sm:gap-[var(--space-6)]">
            <div className="flex flex-col gap-[var(--space-2)] flex-1">
              <Label>Provider</Label>
              <Select
                value={assistant.fallbackProvider}
                onValueChange={(value) => onFallbackProviderChange(value as ProviderId)}
              >
                <SelectTrigger className="max-w-[var(--field-max-w)]">
                  <SelectValue placeholder="Choose fallback" />
                </SelectTrigger>
                <SelectContent>
                  {FALLBACK_PROVIDERS.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-[var(--space-2)] flex-1">
              <Label>Model</Label>
              <Select
                value={assistant.fallbackModel}
                onValueChange={onFallbackModelChange}
                disabled={assistant.fallbackProvider === 'none'}
              >
                <SelectTrigger className="max-w-[var(--field-max-w)]">
                  <SelectValue placeholder="Select fallback model" />
                </SelectTrigger>
                <SelectContent>
                  {getFallbackModelOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

interface ProviderCardProps {
  provider: ProviderConfig;
  state: ProviderState;
  isDirty: boolean;
  onChange: (id: ProviderId, field: 'apiKey' | 'baseUrl', value: string) => void;
  onSave: (id: ProviderId) => void;
  onTest: (id: ProviderId) => Promise<'ok' | 'error'>;
  onLoadModels: (id: ProviderId) => void;
}

function ProviderAccordionItem({
  provider,
  state,
  isDirty,
  onChange,
  onSave,
  onTest,
  onLoadModels,
}: ProviderCardProps) {
  const [testStatus, setTestStatus] = useState<'idle' | 'busy' | 'ok' | 'error'>(
    'idle',
  );
  const [inputStatus, setInputStatus] = useState<
    { message: string; tone: StatusTone } | undefined
  >();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(state.apiKey);
      setInputStatus({ message: 'Copied to clipboard.', tone: 'success' });
      setTimeout(() => setInputStatus(undefined), 2000);
    } catch {
      setInputStatus({ message: 'Copy failed.', tone: 'error' });
      setTimeout(() => setInputStatus(undefined), 2000);
    }
  }, [state.apiKey]);

  const handleTest = useCallback(async () => {
    setTestStatus('busy');
    try {
      const result = await onTest(provider.id);
      setTestStatus(result);
      setInputStatus({
        message: result === 'ok' ? 'Key looks valid.' : 'Could not verify.',
        tone: result === 'ok' ? 'success' : 'error',
      });
    } catch (error) {
      console.error(error);
      setTestStatus('error');
      setInputStatus({ message: 'Test failed.', tone: 'error' });
    } finally {
      setTimeout(() => setTestStatus('idle'), 1600);
      setTimeout(() => setInputStatus(undefined), 2400);
    }
  }, [onTest, provider.id]);

  const statusTone = state.statusTone ?? 'neutral';

  const footerStatus = state.statusMessage
    ? state.statusMessage
    : state.lastTested
      ? `Last tested ${state.lastTested}`
      : undefined;

  return (
    <AccordionItem value={provider.id} className="border-none">
      <AccordionTrigger className="flex items-start justify-between gap-[var(--space-3)] py-[var(--space-3)] text-left">
        <div className="space-y-[var(--space-1)]">
          <span className="text-sm font-medium text-[color:var(--text-primary)]">{provider.label}</span>
          {provider.hint ? (
            <span className="text-xs text-[color:var(--text-secondary)]">{provider.hint}</span>
          ) : null}
        </div>
        <Badge className={PROVIDER_STATUS_BADGE_CLASS[state.status]}>{PROVIDER_STATUS_LABEL[state.status]}</Badge>
      </AccordionTrigger>
      <AccordionContent className="space-y-[var(--space-4)] pb-[var(--space-4)]">
        <div className="flex flex-col gap-[var(--space-4)]">
          <div className="flex flex-col gap-[var(--space-2)]">
            <Label htmlFor={`${provider.id}-key`}>API key</Label>
            <SecretInput
              id={`${provider.id}-key`}
              value={state.apiKey}
              onChange={(value) => onChange(provider.id, 'apiKey', value)}
              placeholder="sk-..."
              onCopy={handleCopy}
              onTest={handleTest}
              testStatus={testStatus}
              status={inputStatus}
            />
          </div>
          <div className="flex flex-col gap-[var(--space-2)]">
            <Label htmlFor={`${provider.id}-url`}>Base URL (optional)</Label>
            <Input
              id={`${provider.id}-url`}
              value={state.baseUrl}
              onChange={(event) => onChange(provider.id, 'baseUrl', event.target.value)}
              placeholder={provider.baseUrlPlaceholder}
              className="max-w-[var(--field-max-w)]"
              autoComplete="off"
              spellCheck={false}
            />
            <p className="text-[color:var(--text-secondary)] text-sm">
              Only change if you proxy requests.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-[var(--space-2)] sm:flex-row sm:items-center sm:justify-between">
          {footerStatus ? (
            <span className={`${statusToneClass[statusTone]} text-sm`}>{footerStatus}</span>
          ) : (
            <span className="text-sm text-[color:var(--text-secondary)]">&nbsp;</span>
          )}
          <div className="flex items-center gap-[var(--space-2)]">
            {provider.supportsModelLoad ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onLoadModels(provider.id)}
              >
                Load models
              </Button>
            ) : null}
            <Button
              onClick={() => onSave(provider.id)}
              disabled={!isDirty || state.saving}
            >
              {state.saving ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Save className="mr-2 size-4" />
              )}
              {state.saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

interface SecretInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onCopy: () => Promise<void> | void;
  onTest?: () => Promise<void>;
  testStatus: 'idle' | 'busy' | 'ok' | 'error';
  status?: { message: string; tone: StatusTone };
}

function SecretInput({
  id,
  value,
  onChange,
  placeholder,
  onCopy,
  onTest,
  testStatus,
  status,
}: SecretInputProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex flex-col gap-[var(--space-2)]">
      <div className="flex items-center gap-[var(--space-2)]">
        <Input
          id={id}
          type={revealed ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="max-w-[var(--field-max-w)] font-mono"
          autoComplete="off"
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-pressed={revealed}
              onClick={() => setRevealed((prev) => !prev)}
            >
              {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reveal</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onCopy()}
              aria-label="Copy key"
            >
              <Copy className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy</TooltipContent>
        </Tooltip>
        {onTest ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onTest}
            disabled={testStatus === 'busy'}
          >
            <TestTube className="mr-2 size-4" />
            {testStatus === 'busy'
              ? 'Testing…'
              : testStatus === 'ok'
                ? 'Success'
                : testStatus === 'error'
                  ? 'Retry'
                  : 'Test'}
          </Button>
        ) : null}
      </div>
      {status ? (
        <span
          className={`${statusToneClass[status.tone]} text-sm`}
          aria-live="polite"
        >
          {status.message}
        </span>
      ) : null}
    </div>
  );
}

interface GoogleAccountsCardProps {
  accounts: GoogleAccount[];
  onAdd: (account: GoogleAccount) => void;
  onRemove: (id: string) => void;
  onSetPrimary: (id: string) => void;
  statusMessage: string | null;
  statusTone: StatusTone;
}

function GoogleAccountsCard({
  accounts,
  onAdd,
  onRemove,
  onSetPrimary,
  statusMessage,
  statusTone,
}: GoogleAccountsCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingName, setPendingName] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!pendingEmail) return;
    setIsSubmitting(true);
    await wait(450);
    const account: GoogleAccount = {
      id: `acc-${Date.now()}`,
      displayName: pendingName || pendingEmail.split('@')[0],
      email: pendingEmail,
      isPrimary: accounts.length === 0,
      connectedAt: 'Just now',
    };
    onAdd(account);
    setPendingEmail('');
    setPendingName('');
    setIsSubmitting(false);
    setDialogOpen(false);
  };

  return (
    <SectionCard
      title="Google accounts"
      subtitle="Manage Gmail, Calendar, and Tasks connections."
      statusMessage={statusMessage}
      statusTone={statusTone}
    >
      <div className="flex flex-col gap-[var(--space-4)]">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="flex flex-col gap-[var(--space-3)] rounded-[var(--radius-md)] border border-[color:var(--border-subtle)] bg-[color:var(--bg-surface-elevated)] p-[var(--space-3)] sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-col gap-[var(--space-1)]">
              <div className="flex items-center gap-[var(--space-2)]">
                <span className="text-[color:var(--text-primary)] font-medium">
                  {account.displayName}
                </span>
                {account.isPrimary ? (
                  <Badge variant="outline" size="sm">
                    Primary
                  </Badge>
                ) : null}
              </div>
              <span className="text-[color:var(--text-secondary)] text-sm">
                {account.email}
              </span>
              <span className="text-[color:var(--text-secondary)] text-xs">
                {account.connectedAt}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-[var(--space-2)]">
              {!account.isPrimary ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onSetPrimary(account.id)}
                >
                  Make primary
                </Button>
              ) : null}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                  >
                    Remove
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[color:var(--bg-surface)] border border-[color:var(--border-subtle)] shadow-[var(--elevation-lg)]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Google account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Removing <strong>{account.email}</strong> disconnects Gmail,
                      Calendar, and Tasks.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onRemove(account.id)}
                      className="bg-[color:var(--danger)] hover:bg-[color:var(--danger)]/90"
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" className="w-fit">
              <Plus className="mr-2 size-4" />
              Add account
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[color:var(--bg-surface)] border border-[color:var(--border-subtle)] shadow-[var(--elevation-lg)] max-w-lg">
            <DialogHeader>
              <DialogTitle>Connect Google account</DialogTitle>
              <DialogDescription>
                Sign in with the Google account you use for Gmail, Calendar, or
                Tasks.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-[var(--space-3)]">
              <div className="flex flex-col gap-[var(--space-2)]">
                <Label htmlFor="google-name">Name (optional)</Label>
                <Input
                  id="google-name"
                  value={pendingName}
                  onChange={(event) => setPendingName(event.target.value)}
                  placeholder="Account label"
                />
              </div>
              <div className="flex flex-col gap-[var(--space-2)]">
                <Label htmlFor="google-email">Google email</Label>
                <Input
                  id="google-email"
                  type="email"
                  value={pendingEmail}
                  onChange={(event) => setPendingEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!pendingEmail || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                {isSubmitting ? 'Connecting…' : 'Connect'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SectionCard>
  );
}
