export function isTauriRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  const candidate = window as typeof window & {
    __TAURI_INTERNALS__?: unknown;
    __TAURI__?: unknown;
    isTauri?: unknown;
  };
  return Boolean(candidate.__TAURI_INTERNALS__ ?? candidate.__TAURI__ ?? candidate.isTauri);
}
