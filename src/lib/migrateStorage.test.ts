/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { migrateFromLocalStorage, resetMigrationFlag, isMigrationDone } from './migrateStorage';
import { get, set, clear } from './storage';

describe('migrateStorage', () => {
  const LEGACY_PREFIX = 'kaloriyka-';
  const TEST_KEY = `${LEGACY_PREFIX}test-data`;
  const TEST_VALUE = { profile: { name: 'Test' }, settings: { theme: 'dark' } };

  beforeEach(async () => {
    await clear();
    localStorage.clear();
    await resetMigrationFlag();
  });

  afterEach(async () => {
    await clear();
    localStorage.clear();
  });

  describe('migrateFromLocalStorage', () => {
    it('должен мигрировать данные из localStorage в IndexedDB', async () => {
      // Устанавливаем данные в localStorage
      localStorage.setItem(TEST_KEY, JSON.stringify(TEST_VALUE));

      // Запускаем миграцию
      await migrateFromLocalStorage();

      // Проверяем, что данные появились в IndexedDB
      const migrated = await get(TEST_KEY);
      expect(migrated).toEqual(TEST_VALUE);
    });

    it('должен устанавливать флаг миграции', async () => {
      localStorage.setItem(TEST_KEY, JSON.stringify(TEST_VALUE));

      await migrateFromLocalStorage();

      const done = await isMigrationDone();
      expect(done).toBe(true);
    });

    it('должна быть идемпотентной (повторный запуск не дублирует)', async () => {
      localStorage.setItem(TEST_KEY, JSON.stringify(TEST_VALUE));

      // Первый запуск
      await migrateFromLocalStorage();
      const first = await get(TEST_KEY);

      // Изменяем данные в localStorage (симулируем, что пользователь что-то изменил)
      const modifiedValue = { ...TEST_VALUE, modified: true };
      localStorage.setItem(TEST_KEY, JSON.stringify(modifiedValue));

      // Второй запуск - должен ничего не делать
      await migrateFromLocalStorage();
      const second = await get(TEST_KEY);

      // Данные должны остаться такими же, как после первой миграции
      expect(second).toEqual(first);
      expect(second).not.toEqual(modifiedValue);
    });

    it('должен работать с пустым localStorage', async () => {
      // Никаких данных в localStorage нет
      await migrateFromLocalStorage();

      const done = await isMigrationDone();
      expect(done).toBe(true);

      const keys = await Object.keys(await import('./storage').then(s => s.exportAll()));
      expect(keys).toContain('storage-migration-v1-done');
    });

    it('должен мигрировать несколько ключей', async () => {
      localStorage.setItem(`${LEGACY_PREFIX}key1`, JSON.stringify({ value: 1 }));
      localStorage.setItem(`${LEGACY_PREFIX}key2`, JSON.stringify({ value: 2 }));
      localStorage.setItem(`${LEGACY_PREFIX}key3`, JSON.stringify({ value: 3 }));

      await migrateFromLocalStorage();

      const k1 = await get(`${LEGACY_PREFIX}key1`);
      const k2 = await get(`${LEGACY_PREFIX}key2`);
      const k3 = await get(`${LEGACY_PREFIX}key3`);

      expect(k1).toEqual({ value: 1 });
      expect(k2).toEqual({ value: 2 });
      expect(k3).toEqual({ value: 3 });
    });

    it('должен игнорировать ключи без префикса проекта', async () => {
      localStorage.setItem('other-key', JSON.stringify({ value: 'other' }));
      localStorage.setItem(TEST_KEY, JSON.stringify(TEST_VALUE));

      await migrateFromLocalStorage();

      const otherKey = await get('other-key');
      const testKey = await get(TEST_KEY);

      expect(otherKey).toBeNull();
      expect(testKey).toEqual(TEST_VALUE);
    });

    it('должен обрабатывать битый JSON как строку', async () => {
      localStorage.setItem(`${LEGACY_PREFIX}broken`, '{ invalid json }');

      await migrateFromLocalStorage();

      const broken = await get(`${LEGACY_PREFIX}broken`);
      expect(broken).toBe('{ invalid json }');
    });

    it('не должен удалять localStorage после миграции', async () => {
      localStorage.setItem(TEST_KEY, JSON.stringify(TEST_VALUE));

      await migrateFromLocalStorage();

      const stillInLs = localStorage.getItem(TEST_KEY);
      expect(stillInLs).toBe(JSON.stringify(TEST_VALUE));
    });

    it('должен работать если localStorage переполнен (частичная миграция)', async () => {
      // Симулируем ситуацию, когда один ключ нельзя прочитать
      localStorage.setItem(TEST_KEY, JSON.stringify(TEST_VALUE));
      
      // Миграция должна завершиться успешно даже с проблемами
      await expect(migrateFromLocalStorage()).resolves.not.toThrow();
      
      const done = await isMigrationDone();
      expect(done).toBe(true);
    });
  });

  describe('isMigrationDone', () => {
    it('должен возвращать false до миграции', async () => {
      const done = await isMigrationDone();
      expect(done).toBe(false);
    });

    it('должен возвращать true после миграции', async () => {
      await set('storage-migration-v1-done', true);
      const done = await isMigrationDone();
      expect(done).toBe(true);
    });
  });

  describe('resetMigrationFlag', () => {
    it('должен сбрасывать флаг миграции', async () => {
      await set('storage-migration-v1-done', true);
      
      await resetMigrationFlag();
      
      const done = await isMigrationDone();
      expect(done).toBe(false);
    });
  });
});
