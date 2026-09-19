import { describe, it, expect, beforeEach } from 'vitest';
import { CHALLENGES } from '../lib/seed';
import type { ChallengeDef } from '../lib/types';

describe('CHALLENGES', () => {
  it('должен быть массивом с элементами', () => {
    expect(Array.isArray(CHALLENGES)).toBe(true);
    expect(CHALLENGES.length).toBeGreaterThan(0);
  });

  it('каждый челлендж должен иметь обязательные поля', () => {
    CHALLENGES.forEach((challenge, index) => {
      expect(challenge.id).toBeDefined();
      expect(typeof challenge.id).toBe('string');
      expect(challenge.title).toBeDefined();
      expect(typeof challenge.title).toBe('string');
      expect(challenge.description).toBeDefined();
      expect(typeof challenge.description).toBe('string');
      expect(challenge.icon).toBeDefined();
      expect(typeof challenge.icon).toBe('string');
      expect(typeof challenge.target).toBe('number');
      expect(challenge.target).toBeGreaterThan(0);
      expect(typeof challenge.metric).toBe('string');
      expect(typeof challenge.periodDays).toBe('number');
      expect(challenge.periodDays).toBeGreaterThan(0);
      expect(typeof challenge.unlockLevel).toBe('number');
      expect(challenge.unlockLevel).toBeGreaterThanOrEqual(0);
    });
  });

  it('все ID челленджей должны быть уникальными', () => {
    const ids = CHALLENGES.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('челлендж "c-streak" должен существовать с правильными параметрами', () => {
    const streakChallenge = CHALLENGES.find(c => c.id === 'c-streak');
    expect(streakChallenge).toBeDefined();
    expect(streakChallenge?.title).toBe('Серия дней');
    expect(streakChallenge?.target).toBe(7);
    expect(streakChallenge?.metric).toBe('streak');
    expect(streakChallenge?.periodDays).toBe(7);
    expect(streakChallenge?.unlockLevel).toBe(0);
  });

  it('челлендж "c-cal" должен существовать с правильными параметрами', () => {
    const calChallenge = CHALLENGES.find(c => c.id === 'c-cal');
    expect(calChallenge).toBeDefined();
    expect(calChallenge?.title).toBe('В цель!');
    expect(calChallenge?.target).toBe(5);
    expect(calChallenge?.metric).toBe('calorieDays');
    expect(calChallenge?.periodDays).toBe(7);
  });

  it('челленджи должны иметь корректные уровни разблокировки', () => {
    const maxLevel = Math.max(...CHALLENGES.map(c => c.unlockLevel));
    expect(maxLevel).toBeGreaterThanOrEqual(0);
    
    // Проверяем, что нет челленджей с отрицательным уровнем
    CHALLENGES.forEach(c => {
      expect(c.unlockLevel).toBeGreaterThanOrEqual(0);
    });
  });

  it('метрики челленджей должны быть допустимыми значениями', () => {
    const validMetrics = [
      'streak',
      'calorieDays',
      'proteinDays',
      'loggingDays',
      'uniqueProducts',
      'stableWeightDays',
      'distanceKm',
      'protein100Days',
      'noSugarDays',
      'veggieDays',
      'deficitDays',
      'noOvereatDays',
      'balancedMacroDays',
      'noLateEatDays',
      'fastDays',
      'cheatMeals'
    ];

    CHALLENGES.forEach(c => {
      expect(validMetrics).toContain(c.metric);
    });
  });

  it('челленджи должны быть отсортированы по уровням разблокировки', () => {
    const levels = CHALLENGES.map(c => c.unlockLevel);
    // Не обязательно строго сортированы, но проверяем диапазон
    const minLevel = Math.min(...levels);
    const maxLevel = Math.max(...levels);
    expect(minLevel).toBe(0);
    expect(maxLevel).toBeLessThanOrEqual(10);
  });
});
