import type { JSX } from 'react';

export type SectionId = 'models' | 'accounts' | 'advanced';

export type SectionConfig = {
  id: SectionId;
  label: string;
  description: string;
  keywords: string;
  render: (props: {
    id: string;
    filter: (text: string) => boolean;
    registerSection: (node: HTMLElement | null) => void;
  }) => JSX.Element | null;
};
