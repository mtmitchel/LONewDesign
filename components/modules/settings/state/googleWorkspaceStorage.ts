import { isTauriRuntime } from '../../../../lib/isTauri';

type PersistedGoogleWorkspaceState = {
  account: unknown;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastError: string | null;
};

const DB_NAME = 'libreollama-secure';
const VALUE_STORE = 'values';
const KEY_STORE = 'keys';
const VALUE_KEY = 'google-workspace';

export async function loadGoogleWorkspaceState(): Promise<PersistedGoogleWorkspaceState | null> {
  if (isTauriRuntime()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const raw = await invoke<string | null>('google_workspace_store_get');
      if (raw) {
        return JSON.parse(raw) as PersistedGoogleWorkspaceState;
      }
    } catch (error) {
      console.warn('[googleWorkspaceStorage] Failed to load secure store snapshot via Tauri.', error);
    }
  }

  try {
    const raw = await readSecureWebValue();
    if (!raw) return null;
    return JSON.parse(raw) as PersistedGoogleWorkspaceState;
  } catch (error) {
    console.warn('[googleWorkspaceStorage] Failed to parse secure web snapshot.', error);
    return null;
  }
}

export async function saveGoogleWorkspaceState(snapshot: PersistedGoogleWorkspaceState): Promise<void> {
  const serialised = JSON.stringify(snapshot);

  if (isTauriRuntime()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke<boolean>('google_workspace_store_set', { payload: { value: serialised } });
      return;
    } catch (error) {
      console.warn('[googleWorkspaceStorage] Failed to persist via Tauri secure store. Falling back to web path.', error);
    }
  }

  try {
    await writeSecureWebValue(serialised);
  } catch (error) {
    console.error('[googleWorkspaceStorage] Failed to persist secure snapshot in web runtime.', error);
  }
}

export async function clearGoogleWorkspaceState(): Promise<void> {
  if (isTauriRuntime()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke<boolean>('google_workspace_store_clear');
    } catch (error) {
      console.warn('[googleWorkspaceStorage] Failed to clear secure store via Tauri.', error);
    }
  }

  try {
    await clearSecureWebValue();
  } catch (error) {
    console.warn('[googleWorkspaceStorage] Failed to clear secure web snapshot.', error);
  }
}

async function readSecureWebValue(): Promise<string | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return null;
  }
  const crypto = window.crypto?.subtle;
  if (!crypto) {
    console.warn('[googleWorkspaceStorage] Web Crypto API unavailable; cannot load secure snapshot.');
    return null;
  }

  try {
    const db = await openSecureDb();
    try {
      const key = await getOrCreateKey(db, crypto);
      const record = await getValueRecord(db);
      if (!record) return null;
      return await decryptValue(crypto, key, record.iv, record.data);
    } finally {
      db.close();
    }
  } catch (error) {
    console.warn('[googleWorkspaceStorage] Failed to read secure snapshot from IndexedDB.', error);
    return null;
  }
}

async function writeSecureWebValue(value: string): Promise<void> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    throw new Error('IndexedDB unavailable in current environment.');
  }
  const crypto = window.crypto?.subtle;
  if (!crypto) {
    throw new Error('Web Crypto API unavailable; cannot encrypt snapshot.');
  }

  const db = await openSecureDb();
  try {
    const key = await getOrCreateKey(db, crypto);
    const { iv, data } = await encryptValue(crypto, key, value);
    await putValueRecord(db, { iv, data });
  } finally {
    db.close();
  }
}

async function clearSecureWebValue(): Promise<void> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return;
  }
  const db = await openSecureDb();
  try {
    await deleteValueRecord(db);
  } finally {
    db.close();
  }
}

type SecureRecord = {
  iv: string;
  data: string;
};

async function openSecureDb(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(VALUE_STORE)) {
        db.createObjectStore(VALUE_STORE);
      }
      if (!db.objectStoreNames.contains(KEY_STORE)) {
        db.createObjectStore(KEY_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB.'));
  });
}

async function getValueRecord(db: IDBDatabase): Promise<SecureRecord | null> {
  return new Promise<SecureRecord | null>((resolve, reject) => {
    const tx = db.transaction(VALUE_STORE, 'readonly');
    const store = tx.objectStore(VALUE_STORE);
    const req = store.get(VALUE_KEY);
    req.onsuccess = () => {
      resolve((req.result as SecureRecord | undefined) ?? null);
    };
    req.onerror = () => reject(req.error ?? new Error('Failed to read secure snapshot.'));
  });
}

async function putValueRecord(db: IDBDatabase, record: SecureRecord): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(VALUE_STORE, 'readwrite');
    const store = tx.objectStore(VALUE_STORE);
    const req = store.put(record, VALUE_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error('Failed to write secure snapshot.'));
  });
}

async function deleteValueRecord(db: IDBDatabase): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(VALUE_STORE, 'readwrite');
    const store = tx.objectStore(VALUE_STORE);
    const req = store.delete(VALUE_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error('Failed to clear secure snapshot.'));
  });
}

async function getOrCreateKey(db: IDBDatabase, crypto: SubtleCrypto): Promise<CryptoKey> {
  const existing = await new Promise<CryptoKey | null>((resolve, reject) => {
    const tx = db.transaction(KEY_STORE, 'readonly');
    const store = tx.objectStore(KEY_STORE);
    const req = store.get(VALUE_KEY);
    req.onsuccess = () => resolve((req.result as CryptoKey | undefined) ?? null);
    req.onerror = () => reject(req.error ?? new Error('Failed to read encryption key.'));
  });

  if (existing) {
    return existing;
  }

  const key = await crypto.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(KEY_STORE, 'readwrite');
    const store = tx.objectStore(KEY_STORE);
    const req = store.put(key, VALUE_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error('Failed to persist encryption key.'));
  });

  return key;
}

async function encryptValue(crypto: SubtleCrypto, key: CryptoKey, value: string): Promise<SecureRecord> {
  const ivArray = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(value);
  const encrypted = await crypto.encrypt({ name: 'AES-GCM', iv: ivArray }, key, encoded);
  return {
    iv: bufferToBase64(ivArray.buffer),
    data: bufferToBase64(encrypted),
  };
}

async function decryptValue(crypto: SubtleCrypto, key: CryptoKey, iv: string, data: string): Promise<string> {
  const ivBuffer = base64ToBuffer(iv);
  const dataBuffer = base64ToBuffer(data);
  const decrypted = await crypto.decrypt({ name: 'AES-GCM', iv: new Uint8Array(ivBuffer) }, key, dataBuffer);
  return new TextDecoder().decode(decrypted);
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const length = binary.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export type { PersistedGoogleWorkspaceState };
