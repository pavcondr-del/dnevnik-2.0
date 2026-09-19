/**
 * Миграция данных из localStorage в IndexedDB.
 * 
 * Запускается один раз при старте приложения.
 * Переносит все ключи с префиксом 'kaloriyka-' в IndexedDB.
 */

import { get, set, getAllKeys, importAll } from './storage';

const MIGRATION_FLAG = 'storage-migration-v1-done';
const LEGACY_PREFIX = 'kaloriyka-';

/**
 * Выполняет миграцию данных из localStorage в IndexedDB.
 * Идемпотентна: повторный запуск не дублирует данные.
 */
export async function migrateFromLocalStorage(): Promise<void> {
  // Проверяем флаг миграции в IndexedDB
  const migrationDone = await get<boolean>(MIGRATION_FLAG);
  if (migrationDone) {
    // Миграция уже выполнена
    return;
  }

  try {
    // Собираем все ключи localStorage с префиксом проекта
    const keysToMigrate: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LEGACY_PREFIX)) {
        keysToMigrate.push(key);
      }
    }

    if (keysToMigrate.length === 0) {
      // Нечего мигрировать, просто ставим флаг
      await set(MIGRATION_FLAG, true);
      return;
    }

    // Копируем данные в IndexedDB
    const dataToMigrate: Record<string, unknown> = {};
    for (const key of keysToMigrate) {
      try {
        const value = localStorage.getItem(key);
        if (value !== null) {
          // Пытаемся распарсить JSON, если не получается - сохраняем как строку
          try {
            dataToMigrate[key] = JSON.parse(value);
          } catch {
            dataToMigrate[key] = value;
          }
        }
      } catch {
        // Игнорируем ошибки чтения отдельных ключей
      }
    }

    // Импортируем всё разом в IndexedDB
    await importAll(dataToMigrate);

    // Устанавливаем флаг завершения миграции
    await set(MIGRATION_FLAG, true);

    // НЕ удаляем localStorage - оставляем как резервную копию
    console.log(
      `[MIGRATION] Перенесено ${keysToMigrate.length} ключей из localStorage в IndexedDB`
    );
  } catch (error) {
    // Если миграция не удалась, просто логируем ошибку
    // Приложение продолжит работу через fallback на localStorage
    console.error('[MIGRATION] Ошибка миграции:', error);
  }
}

/**
 * Сбрасывает флаг миграции (для тестов).
 */
export async function resetMigrationFlag(): Promise<void> {
  await set(MIGRATION_FLAG, false);
}

/**
 * Проверяет, была ли выполнена миграция.
 */
export async function isMigrationDone(): Promise<boolean> {
  const done = await get<boolean>(MIGRATION_FLAG);
  return done === true;
}
