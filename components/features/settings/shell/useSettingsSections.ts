import { useMemo } from 'react';
import type { SectionConfig, SectionId } from './types';

interface UseSettingsSectionsParams {
  config: SectionConfig[];
  filter: (text: string) => boolean;
}

const sectionRefs: Record<SectionId, HTMLElement | null> = {
  models: null,
  accounts: null,
  advanced: null,
};

const registerSection: Record<SectionId, (node: HTMLElement | null) => void> = {
  models: (node) => {
    sectionRefs.models = node;
  },
  accounts: (node) => {
    sectionRefs.accounts = node;
  },
  advanced: (node) => {
    sectionRefs.advanced = node;
  },
};

export function useSettingsSections({ config, filter }: UseSettingsSectionsParams) {
  const visibleSections = useMemo(() => config.filter((section) => filter(section.keywords)), [config, filter]);

  return { visibleSections, registerSection } as const;
}

export function getSectionNode(id: SectionId): HTMLElement | null {
  return sectionRefs[id];
}
