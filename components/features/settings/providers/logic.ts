import type { ProviderConfig, ProviderId } from '../../../modules/settings/state/providerSettings';
import { API_KEY_PATTERNS, PROVIDERS, ProviderMeta } from './config';
import type { ConnectionState } from './connectionStatus';

export type ProviderBaseline = Record<ProviderId, { apiKey: string; baseUrl: string }>;

export interface ProviderStateView {
  apiKey: string;
  baseUrl: string;
  connectionState: ConnectionState;
  lastCheckedAt: number | null;
  lastError: string | null;
}

export function isApiKeyValid(providerId: ProviderId, rawKey: string): boolean {
  if (providerId === 'local') return false;
  const trimmed = rawKey.trim();
  if (!trimmed) return false;
  const pattern = API_KEY_PATTERNS[providerId as Exclude<ProviderId, 'local'>];
  if (pattern && pattern.test(trimmed)) return true;
  return trimmed.length >= 12;
}

export function hasConfiguredCredentials(providerId: ProviderId, apiKey: string, baseUrl: string): boolean {
  if (providerId === 'local') {
    return Boolean(baseUrl.trim());
  }
  return isApiKeyValid(providerId, apiKey);
}

export function getInitialConnectionState(providerId: ProviderId, apiKey: string, baseUrl: string): ConnectionState {
  return hasConfiguredCredentials(providerId, apiKey, baseUrl) ? 'not_verified' : 'not_configured';
}

export function buildBaseline(configs: Record<ProviderId, ProviderConfig>): ProviderBaseline {
  const providerIds: ProviderId[] = [
    ...PROVIDERS.map((provider) => provider.id),
    'local',
  ];

  return providerIds.reduce((acc, providerId) => {
    const config = configs[providerId];
    acc[providerId] = {
      apiKey: config?.apiKey ?? '',
      baseUrl: config?.baseUrl ?? '',
    };
    return acc;
  }, {} as ProviderBaseline);
}

export function buildViewState(configs: Record<ProviderId, ProviderConfig>): Record<ProviderId, ProviderStateView> {
  const providerIds: ProviderId[] = [
    ...PROVIDERS.map((provider) => provider.id),
    'local',
  ];

  return providerIds.reduce((acc, providerId) => {
    const config = configs[providerId];
    const apiKey = config?.apiKey ?? '';
    const baseUrl = config?.baseUrl ?? '';
    acc[providerId] = {
      apiKey,
      baseUrl,
      connectionState: getInitialConnectionState(providerId, apiKey, baseUrl),
      lastCheckedAt: null,
      lastError: null,
    };
    return acc;
  }, {} as Record<ProviderId, ProviderStateView>);
}
