import { useEffect } from 'react';
import type { RefObject } from 'react';
import type { SectionConfig, SectionId } from './types';
import { getSectionNode } from './useSettingsSections';

interface UseScrollSpyOptions {
  viewportRef: RefObject<HTMLDivElement | null>;
  visibleSections: SectionConfig[];
  activeSection: SectionId;
  setActiveSection: (id: SectionId) => void;
  offset?: number;
  disabled?: RefObject<boolean>;
}

export function useScrollSpy({
  viewportRef,
  visibleSections,
  activeSection,
  setActiveSection,
  offset = 72,
  disabled,
}: UseScrollSpyOptions): void {
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleScroll = () => {
      if (disabled?.current) return;
      const viewportRect = viewport.getBoundingClientRect();
      let candidate: SectionId | null = null;
      let candidateDistance = Number.POSITIVE_INFINITY;

      for (const section of visibleSections) {
        const node = getSectionNode(section.id);
        if (!node) continue;
        const rect = node.getBoundingClientRect();
        const distance = Math.abs(rect.top - (viewportRect.top + offset));
        const isInView = rect.bottom > viewportRect.top + offset && rect.top < viewportRect.bottom;
        if (!isInView) continue;
        if (distance < candidateDistance) {
          candidate = section.id;
          candidateDistance = distance;
        }
      }

      if (candidate && candidate !== activeSection) {
        setActiveSection(candidate);
      }
    };

    handleScroll();
    viewport.addEventListener('scroll', handleScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [viewportRef, visibleSections, activeSection, setActiveSection, offset]);
}

export function scrollToSection(id: SectionId, viewport: HTMLElement | null, offset = 48): void {
  const node = getSectionNode(id);
  if (!node || !viewport) return;
  const target = node.offsetTop - offset;
  viewport.scrollTo({ top: target, behavior: 'smooth' });
}
