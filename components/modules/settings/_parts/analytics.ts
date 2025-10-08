import type { DependencyList } from 'react';

export type SettingsEvent =
  | 'settings.search_used'
  | 'settings.section_view'
  | 'settings.provider_edit_opened'
  | 'settings.provider_test'
  | 'settings.provider_copy_success'
  | 'settings.provider_copy_error'
  | 'settings.provider_copy_empty'
  | 'settings.provider_clipboard_unavailable'
  | 'settings.provider_sheet_save'
  | 'settings.provider_sheet_cancel'
  | 'settings.model_pull_started'
  | 'settings.model_pull_completed'
  | 'settings.model_pull_failed'
  | 'settings.save_clicked';

type AnalyticsPayload = Record<string, unknown> | undefined;

export function reportSettingsEvent(event: SettingsEvent, payload?: AnalyticsPayload) {
  if (typeof window === 'undefined') return;
  // eslint-disable-next-line no-console
  console.info(`[analytics] ${event}`, payload ?? {});
}

export function onceEffect(effect: () => void, deps: DependencyList, hasRunRef: { current: boolean }) {
  if (hasRunRef.current) return;
  if (!deps.every((dep) => dep !== undefined && dep !== null)) return;
  hasRunRef.current = true;
  effect();
}
