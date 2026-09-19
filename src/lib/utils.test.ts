import { describe, it, expect } from 'vitest';
import {
  cn,
  uid,
  toKey,
  todayKey,
  addDaysKey,
  parseKey,
  ruDate,
  ruDateLong,
  weekdayShort,
  nowTime,
  fmt,
  gramsFromDisplay,
  displayFromGrams,
  OZ_G,
  DEFAULT_CUP_G,
  UNIT_LABEL,
  toCSV,
  clamp,
  MEAL_META,
  MEAL_ORDER,
} from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('должен объединять классы через пробел', () => {
      expect(cn('a', 'b', 'c')).toBe('a b c');
    });

    it('должен фильтровать falsy значения', () => {
      expect(cn('a', false, null, undefined, 'b')).toBe('a b');
    });

    it('должен возвращать пустую строку при отсутствии аргументов', () => {
      expect(cn()).toBe('');
      expect(cn(false, null, undefined)).toBe('');
    });
  });

  describe('uid', () => {
    it('должен генерировать уникальные ID', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(uid('test'));
      }
      expect(ids.size).toBe(100);
    });

    it('должен добавлять префикс', () => {
      const id = uid('prefix');
      expect(id.startsWith('prefix')).toBe(true);
    });

    it('должен использовать "id" по умолчанию', () => {
      const id = uid();
      expect(id.startsWith('id')).toBe(true);
    });
  });

  describe('toKey / parseKey', () => {
    it('должен форматировать дату в ключ YYYY-MM-DD', () => {
      const date = new Date(2024, 0, 15); // 15 января 2024
      expect(toKey(date)).toBe('2024-01-15');
    });

    it('должен добавлять ведущие нули для месяца и дня', () => {
      const date = new Date(2024, 11, 5); // 5 декабря 2024
      expect(toKey(date)).toBe('2024-12-05');
    });

    it('должен парсить ключ обратно в дату', () => {
      const key = '2024-06-15';
      const date = parseKey(key);
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(5); // Июнь (0-indexed)
      expect(date.getDate()).toBe(15);
    });

    it('должен быть обратимым', () => {
      const original = new Date(2024, 5, 20);
      const key = toKey(original);
      const parsed = parseKey(key);
      expect(parsed.getTime()).toBe(original.getTime());
    });
  });

  describe('todayKey', () => {
    it('должен возвращать ключ для текущей даты', () => {
      const today = new Date();
      const expected = toKey(today);
      expect(todayKey()).toBe(expected);
    });
  });

  describe('addDaysKey', () => {
    it('должен добавлять дни к ключу', () => {
      expect(addDaysKey('2024-01-01', 5)).toBe('2024-01-06');
    });

    it('должен вычитать дни при отрицательном значении', () => {
      expect(addDaysKey('2024-01-10', -5)).toBe('2024-01-05');
    });

    it('должен корректно переходить через месяц', () => {
      expect(addDaysKey('2024-01-30', 5)).toBe('2024-02-04');
    });

    it('должен корректно переходить через год', () => {
      expect(addDaysKey('2023-12-30', 5)).toBe('2024-01-04');
    });

    it('должен учитывать високосный год', () => {
      expect(addDaysKey('2024-02-28', 1)).toBe('2024-02-29');
      expect(addDaysKey('2023-02-28', 1)).toBe('2023-03-01');
    });
  });

  describe('ruDate', () => {
    it('должен форматировать дату на русском', () => {
      expect(ruDate('2024-01-15')).toBe('15 января');
    });

    it('должен правильно склонять месяцы', () => {
      expect(ruDate('2024-03-01')).toBe('1 марта');
      expect(ruDate('2024-05-01')).toBe('1 мая');
    });
  });

  describe('ruDateLong', () => {
    it('должен форматировать дату с днём недели', () => {
      // 1 января 2024 — понедельник
      expect(ruDateLong('2024-01-01')).toContain('понедельник');
      expect(ruDateLong('2024-01-01')).toContain('января');
    });
  });

  describe('weekdayShort', () => {
    it('должен возвращать сокращённое название дня недели', () => {
      // 1 января 2024 — воскресенье
      expect(weekdayShort('2024-01-07')).toBe('вс');
      expect(weekdayShort('2024-01-08')).toBe('пн');
      expect(weekdayShort('2024-01-09')).toBe('вт');
    });
  });

  describe('nowTime', () => {
    it('должен возвращать время в формате ЧЧ:ММ', () => {
      const time = nowTime();
      expect(time).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe('fmt', () => {
    it('должен форматировать числа с указанным количеством знаков', () => {
      // toLocaleString использует неразрывный пробел (U+00A0)
      expect(fmt(1234.567, 2)).toMatch(/1\s?234,57/);
      expect(fmt(100, 0)).toBe('100');
    });

    it('должен использовать русскую локаль', () => {
      // Проверяем наличие разделителя тысяч (пробел или неразрывный пробел)
      expect(fmt(1000)).toMatch(/1\s?000/);
    });

    it('должен округлять значения', () => {
      expect(fmt(1.234, 2)).toBe('1,23');
      expect(fmt(1.236, 2)).toBe('1,24');
    });

    it('должен работать с отрицательными числами', () => {
      expect(fmt(-100, 0)).toBe('-100');
    });
  });

  describe('gramsFromDisplay / displayFromGrams', () => {
    it('должен конвертировать унции в граммы', () => {
      expect(gramsFromDisplay(1, 'oz')).toBeCloseTo(OZ_G, 4);
      expect(gramsFromDisplay(2, 'oz')).toBeCloseTo(2 * OZ_G, 4);
    });

    it('должен конвертировать чашки в граммы', () => {
      expect(gramsFromDisplay(1, 'cup')).toBe(DEFAULT_CUP_G);
      expect(gramsFromDisplay(2, 'cup')).toBe(2 * DEFAULT_CUP_G);
    });

    it('должен оставлять граммы без изменений', () => {
      expect(gramsFromDisplay(100, 'g')).toBe(100);
    });

    it('должен конвертировать граммы в унции', () => {
      expect(displayFromGrams(OZ_G, 'oz')).toBeCloseTo(1, 4);
    });

    it('должен конвертировать граммы в чашки', () => {
      expect(displayFromGrams(DEFAULT_CUP_G, 'cup')).toBe(1);
    });

    it('должен оставлять граммы без изменений при обратном преобразовании', () => {
      expect(displayFromGrams(100, 'g')).toBe(100);
    });

    it('должен использовать кастомный вес чашки', () => {
      const customCupG = 200;
      expect(gramsFromDisplay(1, 'cup', customCupG)).toBe(customCupG);
      expect(displayFromGrams(customCupG, 'cup', customCupG)).toBe(1);
    });
  });

  describe('UNIT_LABEL', () => {
    it('должен содержать метки для всех единиц', () => {
      expect(UNIT_LABEL.g).toBe('г');
      expect(UNIT_LABEL.oz).toBe('унция');
      expect(UNIT_LABEL.cup).toBe('чашка');
    });
  });

  describe('toCSV', () => {
    it('должен форматировать данные как CSV', () => {
      const rows = [
        ['a', 'b', 'c'],
        [1, 2, 3],
      ];
      expect(toCSV(rows)).toBe('a;b;c\n1;2;3');
    });

    it('должен экранировать кавычки', () => {
      const rows = [['a"', 'b']];
      expect(toCSV(rows)).toBe('"a""";b');
    });

    it('должен оборачивать ячейки с разделителями в кавычки', () => {
      const rows = [['a;b', 'c']];
      expect(toCSV(rows)).toBe('"a;b";c');
    });
  });

  describe('clamp', () => {
    it('должен ограничивать значение сверху', () => {
      expect(clamp(10, 0, 5)).toBe(5);
    });

    it('должен ограничивать значение снизу', () => {
      expect(clamp(-10, 0, 5)).toBe(0);
    });

    it('должен возвращать значение в диапазоне', () => {
      expect(clamp(3, 0, 5)).toBe(3);
    });

    it('должен работать с отрицательными диапазонами', () => {
      expect(clamp(-5, -10, 0)).toBe(-5);
      expect(clamp(-15, -10, 0)).toBe(-10);
    });
  });

  describe('MEAL_META', () => {
    it('должен содержать метаданные для всех приёмов пищи', () => {
      expect(MEAL_META.breakfast.label).toBe('Завтрак');
      expect(MEAL_META.lunch.label).toBe('Обед');
      expect(MEAL_META.dinner.label).toBe('Ужин');
      expect(MEAL_META.snack.label).toBe('Перекус');
      expect(MEAL_META.extra.label).toBe('Дополнительно');
    });

    it('должен содержать emoji для всех приёмов пищи', () => {
      for (const meal of MEAL_ORDER) {
        expect(MEAL_META[meal].emoji).toBeDefined();
      }
    });

    it('должен содержать время по умолчанию', () => {
      expect(MEAL_META.breakfast.defaultTime).toBe('08:00');
      expect(MEAL_META.lunch.defaultTime).toBe('13:00');
      expect(MEAL_META.dinner.defaultTime).toBe('19:00');
    });
  });

  describe('MEAL_ORDER', () => {
    it('должен содержать все типы приёмов пищи', () => {
      expect(MEAL_ORDER).toEqual(['breakfast', 'lunch', 'dinner', 'snack', 'extra']);
    });

    it('должен иметь правильный порядок', () => {
      expect(MEAL_ORDER.indexOf('breakfast')).toBeLessThan(MEAL_ORDER.indexOf('lunch'));
      expect(MEAL_ORDER.indexOf('lunch')).toBeLessThan(MEAL_ORDER.indexOf('dinner'));
      expect(MEAL_ORDER.indexOf('dinner')).toBeLessThan(MEAL_ORDER.indexOf('snack'));
    });
  });
});
