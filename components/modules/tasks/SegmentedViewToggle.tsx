import { KanbanSquare, List as ListIcon } from 'lucide-react';

import { SegmentedToggle } from '../../controls/SegmentedToggle';

type ViewMode = 'board' | 'list';

type Props = {
  value: ViewMode;
  onChange: (next: ViewMode) => void;
  className?: string;
};

export function SegmentedViewToggle({ value, onChange, className }: Props) {
  return (
    <SegmentedToggle
      id="tasks-view-toggle"
      ariaLabel="Switch task view"
      surface="tasks"
      value={value}
      onChange={(next) => onChange(next as ViewMode)}
      options={[
        {
          value: 'board',
          label: 'Board',
          icon: KanbanSquare,
          ariaKeyShortcuts: 'Alt+B',
        },
        {
          value: 'list',
          label: 'List',
          icon: ListIcon,
          ariaKeyShortcuts: 'Alt+L',
        },
      ]}
      className={className}
      dense
    />
  );
}
