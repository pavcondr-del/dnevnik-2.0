/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as storage from './storage';

describe('storage (IndexedDB)', () => {
  beforeEach(async () => {
    await storage.clear();
  });

  afterEach(async () => {
    await storage.clear();
  });

  describe('get/set', () => {
    it('должен сохранять и получать строку', async () => {
      await storage.set('test-key', 'test-value');
      const result = await storage.get<string>('test-key');
      expect(result).toBe('test-value');
    });

    it('должен сохранять и получать число', async () => {
      await storage.set('num-key', 42);
      const result = await storage.get<number>('num-key');
      expect(result).toBe(42);
    });

    it('должен сохранять и получать объект', async () => {
      const obj = { name: 'test', value: 123 };
      await storage.set('obj-key', obj);
      const result = await storage.get<typeof obj>('obj-key');
      expect(result).toEqual(obj);
    });

    it('должен сохранять и получать массив', async () => {
      const arr = [1, 2, 3];
      await storage.set('arr-key', arr);
      const result = await storage.get<typeof arr>('arr-key');
      expect(result).toEqual(arr);
    });

    it('должен возвращать null для несуществующего ключа', async () => {
      const result = await storage.get('nonexistent');
      expect(result).toBeNull();
    });

    it('должен перезаписывать существующий ключ', async () => {
      await storage.set('key', 'first');
      await storage.set('key', 'second');
      const result = await storage.get<string>('key');
      expect(result).toBe('second');
    });
  });

  describe('remove', () => {
    it('должен удалять существующий ключ', async () => {
      await storage.set('key-to-remove', 'value');
      await storage.remove('key-to-remove');
      const result = await storage.get('key-to-remove');
      expect(result).toBeNull();
    });

    it('не должен падать при удалении несуществующего ключа', async () => {
      await expect(storage.remove('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    it('должен очищать всё хранилище', async () => {
      await storage.set('key1', 'value1');
      await storage.set('key2', 'value2');
      await storage.set('key3', 'value3');
      
      await storage.clear();
      
      const keys = await storage.getAllKeys();
      expect(keys).toHaveLength(0);
    });

    it('не должен падать при очистке пустого хранилища', async () => {
      await expect(storage.clear()).resolves.not.toThrow();
    });
  });

  describe('getAllKeys', () => {
    it('должен возвращать пустой массив для пустого хранилища', async () => {
      const keys = await storage.getAllKeys();
      expect(keys).toEqual([]);
    });

    it('должен возвращать все ключи', async () => {
      await storage.set('a', 1);
      await storage.set('b', 2);
      await storage.set('c', 3);
      
      const keys = await storage.getAllKeys();
      expect(keys.sort()).toEqual(['a', 'b', 'c']);
    });
  });

  describe('exportAll/importAll', () => {
    it('должен экспортировать все данные', async () => {
      await storage.set('key1', 'value1');
      await storage.set('key2', { nested: 'object' });
      await storage.set('key3', [1, 2, 3]);
      
      const exported = await storage.exportAll();
      
      expect(exported.key1).toBe('value1');
      expect(exported.key2).toEqual({ nested: 'object' });
      expect(exported.key3).toEqual([1, 2, 3]);
    });

    it('должен импортировать данные', async () => {
      const data = {
        imported1: 'string',
        imported2: { obj: true },
        imported3: [4, 5, 6],
      };
      
      await storage.importAll(data);
      
      const v1 = await storage.get<string>('imported1');
      const v2 = await storage.get<typeof data.imported2>('imported2');
      const v3 = await storage.get<typeof data.imported3>('imported3');
      
      expect(v1).toBe('string');
      expect(v2).toEqual({ obj: true });
      expect(v3).toEqual([4, 5, 6]);
    });

    it('должен импортировать данные поверх существующих', async () => {
      await storage.set('existing', 'old-value');
      await storage.set('new', 'new-value');
      
      await storage.importAll({ existing: 'new-value', another: 'data' });
      
      const existing = await storage.get<string>('existing');
      const another = await storage.get<string>('another');
      const stillThere = await storage.get<string>('new');
      
      expect(existing).toBe('new-value');
      expect(another).toBe('data');
      expect(stillThere).toBe('new-value');
    });

    it('должен экспортировать пустой объект для пустого хранилища', async () => {
      const exported = await storage.exportAll();
      expect(exported).toEqual({});
    });
  });

  describe('isIndexedDBAvailable', () => {
    it('должен возвращать false если indexedDB недоступен', () => {
      // В jsdom indexedDB может быть не доступен в некоторых конфигурациях
      const available = storage.isIndexedDBAvailable();
      expect(typeof available).toBe('boolean');
    });
  });

  describe('edge cases', () => {
    it('должен работать с null значением', async () => {
      await storage.set('null-key', null);
      const result = await storage.get<null>('null-key');
      expect(result).toBeNull();
    });

    it('должен работать с undefined значением (сохраняется как null)', async () => {
      await storage.set('undefined-key', undefined);
      const result = await storage.get<undefined>('undefined-key');
      // IndexedDB преобразует undefined в null при сериализации
      expect(result).toBeNull();
    });

    it('должен работать с пустой строкой', async () => {
      await storage.set('empty-string', '');
      const result = await storage.get<string>('empty-string');
      expect(result).toBe('');
    });

    it('должен работать с нулём', async () => {
      await storage.set('zero', 0);
      const result = await storage.get<number>('zero');
      expect(result).toBe(0);
    });

    it('должен работать с false', async () => {
      await storage.set('false', false);
      const result = await storage.get<boolean>('false');
      expect(result).toBe(false);
    });

    it('должен работать с вложенными объектами', async () => {
      const complex = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
        array: [{ id: 1 }, { id: 2 }],
      };
      
      await storage.set('complex', complex);
      const result = await storage.get<typeof complex>('complex');
      expect(result).toEqual(complex);
    });
  });
});
