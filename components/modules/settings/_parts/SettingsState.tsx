import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { reportSettingsEvent } from './analytics';

type DirtyMap = Record<string, boolean>;

interface SettingsStateValue {
  dirty: boolean;
  dirtyFields: string[];
  setFieldDirty: (field: string, dirty: boolean) => void;
  saveAll: () => void;
  resetAll: () => void;
}

const SettingsStateContext = createContext<SettingsStateValue | null>(null);

export function SettingsStateProvider({ children }: { children: React.ReactNode }) {
  const [dirtyMap, setDirtyMap] = useState<DirtyMap>({});

  const setFieldDirty = useCallback((field: string, dirty: boolean) => {
    setDirtyMap((prev) => {
      const next = { ...prev };
      if (dirty) {
        next[field] = true;
      } else {
        delete next[field];
      }
      const changed = dirty ? !prev[field] : Boolean(prev[field]);
      return changed ? next : prev;
    });
  }, []);

  const resetAll = useCallback(() => {
    setDirtyMap({});
  }, []);

  const dirtyFields = useMemo(
    () => Object.keys(dirtyMap).filter((key) => dirtyMap[key]),
    [dirtyMap],
  );

  const dirty = dirtyFields.length > 0;

  const saveAll = useCallback(() => {
    if (!dirty) return;
    reportSettingsEvent('settings.save_clicked', {
      dirty_fields_count: dirtyFields.length,
      dirty_fields: dirtyFields,
    });
    toast.success('Settings saved');
    resetAll();
  }, [dirty, dirtyFields, resetAll]);

  const value = useMemo<SettingsStateValue>(
    () => ({ dirty, dirtyFields, setFieldDirty, saveAll, resetAll }),
    [dirty, dirtyFields, setFieldDirty, saveAll, resetAll],
  );

  return <SettingsStateContext.Provider value={value}>{children}</SettingsStateContext.Provider>;
}

export function useSettingsState(): SettingsStateValue {
  const ctx = useContext(SettingsStateContext);
  if (!ctx) {
    throw new Error('useSettingsState must be used within SettingsStateProvider');
  }
  return ctx;
}
