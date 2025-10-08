import React, {
  useCallback,
  useEffect,
  useId,
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
import { Switch } from '../../ui/switch';
import { ScrollArea } from '../../ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { Slider } from '../../ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
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

const VIEWPORT_QUERY = '(min-width: 1024px)';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  supportsModelLoad?: boolean;
}

interface ProviderState {
  apiKey: string;
  baseUrl: string;
  savedApiKey: string;
  savedBaseUrl: string;
  saving: boolean;
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
  { id: 'openai', label: 'OpenAI', baseUrlPlaceholder: 'https://api.openai.com/v1' },
  { id: 'anthropic', label: 'Anthropic', baseUrlPlaceholder: 'https://api.anthropic.com/v1' },
  { id: 'openrouter', label: 'OpenRouter', baseUrlPlaceholder: 'https://openrouter.ai/api/v1' },
  { id: 'deepseek', label: 'DeepSeek', baseUrlPlaceholder: 'https://api.deepseek.com/v1' },
  {
    id: 'mistral',
    label: 'Mistral AI',
    baseUrlPlaceholder: 'https://api.mistral.ai/v1',
    supportsModelLoad: true,
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    baseUrlPlaceholder: 'https://generativelanguage.googleapis.com/v1beta',
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
    id: 'agents',
    label: 'Agents and models',
    description: 'Connect Ollama and manage local model defaults.',
  },
  {
    id: 'assistant',
    label: 'AI writing assistant',
    description: 'Tune tone, context, and limits for quick edits.',
  },
  {
    id: 'cloud',
    label: 'Cloud providers',
    description: 'Store API keys, base URLs, and model sync actions.',
  },
  {
    id: 'account',
    label: 'Account',
    description: 'Manage Google connections used across modules.',
  },
];

const statusToneClass: Record<StatusTone, string> = {
  neutral: 'text-[color:var(--text-secondary)]',
  success: 'text-[color:var(--success)]',
  error: 'text-[color:var(--danger)]',
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

  const testOllama = useCallback(async () => {
    setOllamaStatus('busy');
    reportEvent('settings.test_connection', { target: 'ollama' });
    await wait(600);
    const success = /^https?:/i.test(ollamaEndpoint.trim());
    setOllamaStatus(success ? 'ok' : 'error');
    setOllamaMessage(
      success ? 'Connection successful.' : 'Could not reach the Ollama endpoint.',
    );
    setTimeout(() => setOllamaStatus('idle'), 1800);
  }, [ollamaEndpoint]);

  const [localModels, setLocalModels] = useState<LocalModel[]>([
    {
      id: 'tinyllama',
      name: 'tinyllama:1.1b',
      size: '608 MB',
      modified: '10 days ago',
      isDefault: false,
    },
    {
      id: 'gemma3',
      name: 'gemma3:8b',
      size: '7.0 GB',
      modified: '4 days ago',
      isDefault: true,
    },
  ]);
  const [modelsStatus, setModelsStatus] = useState<string | null>(null);
  const [modelsTone, setModelsTone] = useState<StatusTone>('neutral');

  const setDefaultModel = useCallback((id: string) => {
    setLocalModels((prev) =>
      prev.map((model) => ({ ...model, isDefault: model.id === id })),
    );
    setModelsTone('success');
    setModelsStatus('Default updated.');
    setTimeout(() => setModelsStatus(null), 2000);
  }, []);

  const removeModel = useCallback((id: string) => {
    setLocalModels((prev) => prev.filter((model) => model.id !== id));
    setModelsTone('neutral');
    setModelsStatus('Model removed.');
    setTimeout(() => setModelsStatus(null), 2000);
  }, []);

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

  const isAssistantDirty =
    assistantDraft.provider !== assistantSaved.provider ||
    assistantDraft.model !== assistantSaved.model ||
    assistantDraft.fallbackProvider !== assistantSaved.fallbackProvider ||
    assistantDraft.fallbackModel !== assistantSaved.fallbackModel ||
    assistantDraft.style !== assistantSaved.style ||
    assistantDraft.autoReplace !== assistantSaved.autoReplace ||
    assistantDraft.showConfidence !== assistantSaved.showConfidence ||
    assistantDraft.keepHistory !== assistantSaved.keepHistory ||
    assistantDraft.maxResponseLength !== assistantSaved.maxResponseLength;

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
      await wait(480);
      const hasKey = providers[id].apiKey.trim().length > 10;
      return hasKey ? 'ok' : 'error';
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

  const renderAgentsSection = useCallback(
    () => (
      <>
        <OllamaServerCard
          endpoint={ollamaEndpoint}
          onChange={setOllamaEndpoint}
          onTest={testOllama}
          status={ollamaStatus}
          statusMessage={ollamaMessage}
        />
        <LocalModelsCard
          models={localModels}
          onSetDefault={setDefaultModel}
          onRemove={removeModel}
          onPull={pullModel}
          statusMessage={modelsStatus}
          statusTone={modelsTone}
        />
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
      </>
    ),
    [
      assistantDraft,
      assistantSaving,
      assistantStatus,
      commitAssistant,
      isModelDefaultsDirty,
      localModels,
      modelsStatus,
      modelsTone,
      ollamaEndpoint,
      ollamaMessage,
      ollamaStatus,
      pullModel,
      removeModel,
      setDefaultModel,
      testOllama,
      updateAssistant,
    ],
  );

  const renderAssistantSection = useCallback(
    () => (
      <AssistantCard
        assistant={assistantDraft}
        localModels={localModels}
        onChange={updateAssistant}
        isDirty={isAssistantDirty}
        isSaving={assistantSaving === 'assistant'}
        status={
          assistantStatus?.scope === 'assistant' ? assistantStatus.message : null
        }
        statusTone={assistantStatus?.tone ?? 'neutral'}
        onSave={() => commitAssistant('assistant')}
      />
    ),
    [
      assistantDraft,
      localModels,
      assistantSaving,
      assistantStatus,
      commitAssistant,
      isAssistantDirty,
      updateAssistant,
    ],
  );

  const renderProvidersSection = useCallback(
    () => (
      <div className="grid gap-[var(--space-6)]">
        {PROVIDERS.map((provider) => {
          const state = providers[provider.id];
          const dirty =
            state.apiKey !== state.savedApiKey ||
            state.baseUrl !== state.savedBaseUrl;
          return (
            <ProviderCard
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
      </div>
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
    agents: renderAgentsSection,
    assistant: renderAssistantSection,
    cloud: renderProvidersSection,
    account: renderAccountSection,
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

interface OllamaServerCardProps {
  endpoint: string;
  onChange: (value: string) => void;
  onTest: () => Promise<void>;
  status: 'idle' | 'busy' | 'ok' | 'error';
  statusMessage: string | null;
}

function OllamaServerCard({
  endpoint,
  onChange,
  onTest,
  status,
  statusMessage,
}: OllamaServerCardProps) {
  return (
    <SectionCard
      title="Ollama server"
      subtitle="Provide the base URL for your local Ollama instance."
      footer={
        <Button
          variant="outline"
          size="sm"
          onClick={onTest}
          disabled={status === 'busy'}
          title="Test the Ollama connection"
        >
          <TestTube className="mr-2 size-4" />
          {status === 'busy'
            ? 'Testing…'
            : status === 'ok'
              ? 'Success'
              : status === 'error'
                ? 'Retry'
                : 'Test connection'}
        </Button>
      }
      statusMessage={statusMessage}
      statusTone={status === 'error' ? 'error' : status === 'ok' ? 'success' : 'neutral'}
    >
      <div className="flex flex-col gap-[var(--space-2)]">
        <Label htmlFor="ollama-endpoint">Endpoint URL</Label>
        <div className="flex flex-col gap-[var(--space-2)] sm:flex-row sm:items-center">
          <Input
            id="ollama-endpoint"
            value={endpoint}
            onChange={(event) => onChange(event.target.value)}
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
              if (!endpoint) return;
              window.open(endpoint, '_blank', 'noopener,noreferrer');
              reportEvent('settings.open_endpoint', { target: 'ollama' });
            }}
          >
            <Link2 className="mr-2 size-4" />
            Open
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

interface LocalModelsCardProps {
  models: LocalModel[];
  onSetDefault: (id: string) => void;
  onRemove: (id: string) => void;
  onPull: () => void;
  statusMessage: string | null;
  statusTone: StatusTone;
}

function LocalModelsCard({
  models,
  onSetDefault,
  onRemove,
  onPull,
  statusMessage,
  statusTone,
}: LocalModelsCardProps) {
  return (
    <SectionCard
      title="Local models"
      subtitle="Manage downloaded models and pick the default for quick runs."
      footer={
        <Button onClick={onPull}>
          <Plus className="mr-2 size-4" />
          Pull a new model
        </Button>
      }
      statusMessage={statusMessage}
      statusTone={statusTone}
    >
      <div className="overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--border-subtle)]">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-[var(--space-2)] bg-[color:var(--bg-surface-elevated)] px-[var(--space-3)] py-[var(--space-2)] text-[color:var(--text-secondary)] text-sm">
          <span>Model</span>
          <span>Size</span>
          <span>Modified</span>
          <span className="justify-self-end">Actions</span>
        </div>
        {models.map((model, index) => (
          <div
            key={model.id}
            className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-[var(--space-2)] border-t border-[color:var(--border-subtle)] px-[var(--space-3)] py-[var(--space-3)] text-sm first:border-t-0"
          >
            <div className="flex items-center gap-[var(--space-2)]">
              <input
                type="radio"
                name="default-model"
                checked={model.isDefault}
                onChange={() => onSetDefault(model.id)}
                aria-label={`Set ${model.name} as default`}
                className="size-4 accent-[color:var(--primary)]"
              />
              <span className="text-[color:var(--text-primary)] font-medium">
                {model.name}
              </span>
            </div>
            <span className="text-[color:var(--text-secondary)]">{model.size}</span>
            <span className="text-[color:var(--text-secondary)]">
              {model.modified}
            </span>
            <div className="flex items-center justify-end">
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
                      This will remove <strong>{model.name}</strong> from disk. You
                      can redownload it later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onRemove(model.id)}
                      className="bg-[color:var(--danger)] hover:bg-[color:var(--danger)]/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
        {models.length === 0 ? (
          <div className="px-[var(--space-3)] py-[var(--space-4)] text-center text-[color:var(--text-secondary)] text-sm">
            No local models yet.
          </div>
        ) : null}
      </div>
    </SectionCard>
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

interface AssistantCardProps {
  assistant: AssistantSettings;
  localModels: LocalModel[];
  onChange: <K extends keyof AssistantSettings>(
    key: K,
    value: AssistantSettings[K],
  ) => void;
  isDirty: boolean;
  isSaving: boolean;
  status: string | null;
  statusTone: StatusTone;
  onSave: () => void;
}

function AssistantCard({
  assistant,
  localModels,
  onChange,
  isDirty,
  isSaving,
  status,
  statusTone,
  onSave,
}: AssistantCardProps) {
  // Get model options based on selected provider
  const getModelOptions = () => {
    if (assistant.provider === 'local') {
      // For local provider, show only local models
      return localModels.map(model => ({
        value: model.id,
        label: model.name
      }));
    } else {
      // For cloud providers, show their models
      return MODEL_OPTIONS[assistant.provider] || [];
    }
  };

  return (
    <SectionCard
      title="Writing defaults"
      subtitle="Control tone, history retention, and guard rails for quick edits."
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
        <div className="flex flex-col gap-[var(--space-4)] sm:flex-row sm:gap-[var(--space-6)]">
          <div className="flex flex-col gap-[var(--space-2)] flex-1">
            <Label>Default provider</Label>
            <Select
              value={assistant.provider}
              onValueChange={(value) => onChange('provider', value as ProviderId)}
            >
              <SelectTrigger className="max-w-[var(--field-max-w)]">
                <SelectValue placeholder="Choose provider" />
              </SelectTrigger>
              <SelectContent>
                {ALL_PROVIDERS.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-[var(--space-2)] flex-1">
            <Label>Default model</Label>
            <Select
              value={assistant.model}
              onValueChange={(value) => onChange('model', value)}
            >
              <SelectTrigger className="max-w-[var(--field-max-w)]">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {getModelOptions().map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex flex-col gap-[var(--space-2)]">
          <Label>Writing style</Label>
          <Select
            value={assistant.style}
            onValueChange={(value) => onChange('style', value as WritingStyle)}
          >
            <SelectTrigger className="max-w-[var(--field-max-w)]">
              <SelectValue placeholder="Select style" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(WRITING_STYLE_LABEL) as WritingStyle[]).map((style) => (
                <SelectItem key={style} value={style}>
                  {WRITING_STYLE_LABEL[style]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-[var(--space-3)]">
          <ToggleRow
            label="Auto-replace for simple edits"
            help="Skip the preview for quick grammar fixes."
            value={assistant.autoReplace}
            onChange={(checked) => onChange('autoReplace', checked)}
          />
          <ToggleRow
            label="Show confidence scores"
            help="Display AI confidence for suggestions."
            value={assistant.showConfidence}
            onChange={(checked) => onChange('showConfidence', checked)}
          />
          <ToggleRow
            label="Keep conversation history"
            help="Maintain context across interactions."
            value={assistant.keepHistory}
            onChange={(checked) => onChange('keepHistory', checked)}
          />
        </div>

        <div className="flex flex-col gap-[var(--space-2)] max-w-[var(--field-max-w)]">
          <Label htmlFor="assistant-max-length">
            Maximum response length: {assistant.maxResponseLength} tokens
          </Label>
          <Slider
            id="assistant-max-length"
            min={100}
            max={2000}
            step={50}
            value={[assistant.maxResponseLength]}
            onValueChange={([value]) => onChange('maxResponseLength', value)}
          />
        </div>
      </div>
    </SectionCard>
  );
}

interface ToggleRowProps {
  label: string;
  help?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

function ToggleRow({ label, help, value, onChange }: ToggleRowProps) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-[var(--space-3)]">
      <div className="flex flex-col gap-[var(--space-1)]">
        <Label htmlFor={id}>{label}</Label>
        {help ? (
          <p className="text-[color:var(--text-secondary)] text-sm">{help}</p>
        ) : null}
      </div>
      <Switch
        id={id}
        checked={value}
        onCheckedChange={onChange}
        aria-pressed={value}
      />
    </div>
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

function ProviderCard({
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

  return (
    <SectionCard
      title={provider.label}
      subtitle="Store API keys securely. Base URL is optional for proxies."
      footer={
        <>
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
        </>
      }
      statusMessage={state.statusMessage}
      statusTone={statusTone}
    >
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
            Only change if using a proxy.
          </p>
        </div>
      </div>
    </SectionCard>
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
