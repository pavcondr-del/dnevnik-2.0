/**
 * Абстракция хранилища на основе IndexedDB.
 * Предоставляет Promise-based API для работы с данными.
 * 
 * Использует нативный IndexedDB API без внешних библиотек.
 */

const DB_NAME = 'dnevnik-db';
const DB_VERSION = 1;
const STORE_NAME = 'kv';

/**
 * Открывает соединение с базой данных IndexedDB.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Получает значение по ключу из IndexedDB.
 * @param key - Ключ для поиска
 * @returns Значение или null, если ключ не найден
 */
export async function get<T>(key: string): Promise<T | null> {
  if (typeof indexedDB === 'undefined') {
    // Fallback для SSR или старых браузеров
    try {
      const raw = localStorage.getItem(`idb-fallback:${key}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Сохраняет значение по ключу в IndexedDB.
 * @param key - Ключ для сохранения
 * @param value - Значение для сохранения
 */
export async function set<T>(key: string, value: T): Promise<void> {
  if (typeof indexedDB === 'undefined') {
    // Fallback для SSR или старых браузеров
    try {
      localStorage.setItem(`idb-fallback:${key}`, JSON.stringify(value));
    } catch {
      // Игнорируем ошибки квоты
    }
    return;
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(value, key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Удаляет значение по ключу из IndexedDB.
 * @param key - Ключ для удаления
 */
export async function remove(key: string): Promise<void> {
  if (typeof indexedDB === 'undefined') {
    try {
      localStorage.removeItem(`idb-fallback:${key}`);
    } catch {
      // Игнорируем ошибки
    }
    return;
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Очищает всё хранилище.
 */
export async function clear(): Promise<void> {
  if (typeof indexedDB === 'undefined') {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('idb-fallback:')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
      // Игнорируем ошибки
    }
    return;
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Возвращает все ключи в хранилище.
 */
export async function getAllKeys(): Promise<string[]> {
  if (typeof indexedDB === 'undefined') {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('idb-fallback:')) {
        keys.push(key.replace('idb-fallback:', ''));
      }
    }
    return keys;
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAllKeys();

    request.onsuccess = () => resolve(request.result as string[]);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Экспортирует все данные из хранилища.
 * @returns Объект со всеми ключами и значениями
 */
export async function exportAll(): Promise<Record<string, unknown>> {
  const keys = await getAllKeys();
  const result: Record<string, unknown> = {};

  for (const key of keys) {
    const value = await get(key);
    if (value !== null) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Импортирует данные в хранилище.
 * @param data - Объект с ключами и значениями для импорта
 */
export async function importAll(data: Record<string, unknown>): Promise<void> {
  if (typeof indexedDB === 'undefined') {
    // Fallback: импортируем по одному
    for (const [key, value] of Object.entries(data)) {
      try {
        localStorage.setItem(`idb-fallback:${key}`, JSON.stringify(value));
      } catch {
        // Игнорируем ошибки квоты
      }
    }
    return;
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    for (const [key, value] of Object.entries(data)) {
      store.put(value, key);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Проверяет, доступен ли IndexedDB в текущем окружении.
 */
export function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}
