import { describe, it, expect } from 'vitest';
import {
  calcBMR,
  calcTargets,
  scaleNutrition,
  emptyTotals,
  sumEntries,
  round1,
  roundTotals,
  currentStreak,
  buildDayStats,
  recipeTotals,
  projectWeight,
  ACTIVITY_META,
  GOAL_META,
} from './nutrition';
import type { MealEntry, Profile } from './types';

describe('calcBMR', () => {
  it('должен рассчитывать BMR для мужчины (формула Миффлина-Сан-Жеора)', () => {
    const profile = { sex: 'male' as const, age: 30, weightKg: 80, heightCm: 180 };
    // BMR = 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(calcBMR(profile)).toBe(1780);
  });

  it('должен рассчитывать BMR для женщины (формула Миффлина-Сан-Жеора)', () => {
    const profile = { sex: 'female' as const, age: 25, weightKg: 60, heightCm: 165 };
    // BMR = 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25 ≈ 1345
    expect(calcBMR(profile)).toBe(1345);
  });

  it('должен округлять результат до целого числа', () => {
    const profile = { sex: 'male' as const, age: 40, weightKg: 75.5, heightCm: 175.5 };
    const result = calcBMR(profile);
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe('calcTargets', () => {
  const baseProfile: Profile = {
    id: 'test',
    name: 'Test',
    email: '',
    sex: 'male',
    age: 30,
    heightCm: 180,
    weightKg: 80,
    targetWeightKg: 75,
    activity: 'moderate',
    goal: 'lose',
    createdAt: Date.now(),
  };

  it('должен рассчитывать TDEE с коэффициентом активности', () => {
    const targets = calcTargets(baseProfile);
    // BMR = 1780, TDEE = 1780 * 1.55 (moderate) = 2759
    expect(targets.tdee).toBeGreaterThan(0);
    expect(targets.bmr).toBe(1780);
  });

  it('должен применять дефицит для цели похудения', () => {
    const targets = calcTargets({ ...baseProfile, goal: 'lose' });
    expect(targets.kcal).toBeLessThan(targets.tdee);
  });

  it('должен использовать кастомный дефицит если задан', () => {
    const profileWithCustomDeficit = { ...baseProfile, customDeficitPercent: 25 };
    const targets = calcTargets(profileWithCustomDeficit);
    // Ожидаем дефицит 25% от TDEE
    const expectedKcal = Math.round(targets.tdee * 0.75 / 10) * 10;
    expect(targets.kcal).toBe(expectedKcal);
  });

  it('должен рассчитывать белки по весу тела', () => {
    const targets = calcTargets({ ...baseProfile, goal: 'lose' });
    // proteinPerKg для lose = 1.9, вес 80кг => 152г белка
    expect(targets.protein).toBe(Math.round(80 * 1.9));
  });

  it('должен устанавливать минимальное количество жиров 45г', () => {
    const smallProfile = { ...baseProfile, weightKg: 40 };
    const targets = calcTargets(smallProfile);
    expect(targets.fat).toBeGreaterThanOrEqual(45);
  });

  it('должен рассчитывать углеводы как остаток калорий', () => {
    const targets = calcTargets(baseProfile);
    const calculatedCarbs = Math.max(
      40,
      Math.round((targets.kcal - targets.protein * 4 - targets.fat * 9) / 4)
    );
    expect(targets.carbs).toBe(calculatedCarbs);
  });

  it('должен возвращать все целевые значения', () => {
    const targets = calcTargets(baseProfile);
    expect(targets).toHaveProperty('bmr');
    expect(targets).toHaveProperty('tdee');
    expect(targets).toHaveProperty('kcal');
    expect(targets).toHaveProperty('protein');
    expect(targets).toHaveProperty('fat');
    expect(targets).toHaveProperty('carbs');
  });
});

describe('ACTIVITY_META', () => {
  it('должен содержать 5 уровней активности', () => {
    expect(ACTIVITY_META.length).toBe(5);
  });

  it('должен иметь корректные коэффициенты активности', () => {
    const factors = ACTIVITY_META.map(a => a.factor);
    expect(factors).toEqual([1.2, 1.375, 1.55, 1.725, 1.9]);
  });

  it('каждый уровень должен иметь все обязательные поля', () => {
    ACTIVITY_META.forEach(activity => {
      expect(activity.id).toBeDefined();
      expect(activity.label).toBeDefined();
      expect(activity.factor).toBeDefined();
      expect(activity.hint).toBeDefined();
    });
  });
});

describe('GOAL_META', () => {
  it('должен содержать 3 цели', () => {
    expect(Object.keys(GOAL_META).length).toBe(3);
  });

  it('должен иметь корректные факторы для каждой цели', () => {
    expect(GOAL_META.lose.factor).toBe(0.82);
    expect(GOAL_META.maintain.factor).toBe(1);
    expect(GOAL_META.gain.factor).toBe(1.12);
  });

  it('каждая цель должна иметь proteinPerKg', () => {
    Object.values(GOAL_META).forEach(goal => {
      expect(goal.proteinPerKg).toBeGreaterThan(0);
    });
  });
});

describe('scaleNutrition', () => {
  const per100 = { kcal: 200, protein: 10, fat: 5, carbs: 30 };

  it('должен масштабировать нутриенты для 100г', () => {
    const result = scaleNutrition(per100, 100);
    expect(result.kcal).toBe(200);
    expect(result.protein).toBe(10);
    expect(result.fat).toBe(5);
    expect(result.carbs).toBe(30);
  });

  it('должен масштабировать нутриенты для 50г', () => {
    const result = scaleNutrition(per100, 50);
    expect(result.kcal).toBe(100);
    expect(result.protein).toBe(5);
    expect(result.fat).toBe(2.5);
    expect(result.carbs).toBe(15);
  });

  it('должен масштабировать нутриенты для 200г', () => {
    const result = scaleNutrition(per100, 200);
    expect(result.kcal).toBe(400);
    expect(result.protein).toBe(20);
    expect(result.fat).toBe(10);
    expect(result.carbs).toBe(60);
  });

  it('должен работать с нулевым весом', () => {
    const result = scaleNutrition(per100, 0);
    expect(result.kcal).toBe(0);
    expect(result.protein).toBe(0);
    expect(result.fat).toBe(0);
    expect(result.carbs).toBe(0);
  });
});

describe('emptyTotals', () => {
  it('должен возвращать объект с нулевыми значениями', () => {
    const result = emptyTotals();
    expect(result.kcal).toBe(0);
    expect(result.protein).toBe(0);
    expect(result.fat).toBe(0);
    expect(result.carbs).toBe(0);
  });
});

describe('sumEntries', () => {
  it('должен суммировать нутриенты записей', () => {
    const entries: MealEntry[] = [
      { id: '1', date: '2024-01-01', meal: 'breakfast', time: '08:00', refId: 'p1', kcal: 300, protein: 15, fat: 10, carbs: 40 },
      { id: '2', date: '2024-01-01', meal: 'lunch', time: '13:00', refId: 'p2', kcal: 500, protein: 25, fat: 20, carbs: 60 },
    ];
    const result = sumEntries(entries);
    expect(result.kcal).toBe(800);
    expect(result.protein).toBe(40);
    expect(result.fat).toBe(30);
    expect(result.carbs).toBe(100);
  });

  it('должен возвращать нули для пустого массива', () => {
    const result = sumEntries([]);
    expect(result.kcal).toBe(0);
    expect(result.protein).toBe(0);
    expect(result.fat).toBe(0);
    expect(result.carbs).toBe(0);
  });
});

describe('round1', () => {
  it('должен округлять до одного знака после запятой', () => {
    expect(round1(1.234)).toBe(1.2);
    expect(round1(1.567)).toBe(1.6);
    expect(round1(1.25)).toBe(1.3);
  });

  it('должен работать с целыми числами', () => {
    expect(round1(5)).toBe(5);
  });
});

describe('roundTotals', () => {
  it('должен округлять калории до целого, а макросы до 1 знака', () => {
    const input = { kcal: 234.567, protein: 15.678, fat: 10.123, carbs: 30.999 };
    const result = roundTotals(input);
    expect(result.kcal).toBe(235);
    expect(result.protein).toBe(15.7);
    expect(result.fat).toBe(10.1);
    expect(result.carbs).toBe(31);
  });
});

describe('currentStreak', () => {
  it('должен возвращать 0 для пустого массива', () => {
    expect(currentStreak([])).toBe(0);
  });

  it('должен считать серию дней подряд', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBeforeYesterday = new Date(yesterday);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 1);

    const formatKey = (d: Date) => d.toISOString().split('T')[0];

    const entries: MealEntry[] = [
      { id: '1', date: formatKey(today), meal: 'breakfast', time: '08:00', refId: 'p1', kcal: 300, protein: 15, fat: 10, carbs: 40 },
      { id: '2', date: formatKey(yesterday), meal: 'breakfast', time: '08:00', refId: 'p1', kcal: 300, protein: 15, fat: 10, carbs: 40 },
      { id: '3', date: formatKey(dayBeforeYesterday), meal: 'breakfast', time: '08:00', refId: 'p1', kcal: 300, protein: 15, fat: 10, carbs: 40 },
    ];

    expect(currentStreak(entries)).toBeGreaterThanOrEqual(2);
  });
});

describe('buildDayStats', () => {
  it('должен строить статистику за N дней', () => {
    const entries: MealEntry[] = [
      { id: '1', date: '2024-01-01', meal: 'breakfast', time: '08:00', refId: 'p1', kcal: 300, protein: 15, fat: 10, carbs: 40 },
    ];
    const activities = [{ date: '2024-01-01', kcal: 200 }];
    
    const stats = buildDayStats(entries, activities, 7);
    expect(stats.length).toBe(7);
    expect(stats[0]).toHaveProperty('date');
    expect(stats[0]).toHaveProperty('totals');
    expect(stats[0]).toHaveProperty('burned');
  });

  it('должен суммировать сожжённые калории по активностям', () => {
    const today = new Date();
    const todayKey = today.toISOString().split('T')[0];
    
    const entries: MealEntry[] = [];
    const activities = [
      { date: todayKey, kcal: 100 },
      { date: todayKey, kcal: 150 },
    ];
    
    const stats = buildDayStats(entries, activities, 1);
    expect(stats[0].burned).toBe(250);
  });
});

describe('recipeTotals', () => {
  it('должен суммировать нутриенты ингредиентов рецепта', () => {
    const recipe = {
      ingredients: [
        { productId: 'p1', name: 'Ingredient 1', grams: 100, kcal: 200, protein: 10, fat: 5, carbs: 30 },
        { productId: 'p2', name: 'Ingredient 2', grams: 50, kcal: 100, protein: 5, fat: 2, carbs: 15 },
      ],
    };
    const result = recipeTotals(recipe);
    expect(result.kcal).toBe(300);
    expect(result.protein).toBe(15);
    expect(result.fat).toBe(7);
    expect(result.carbs).toBe(45);
    expect(result.grams).toBe(150);
  });

  it('должен возвращать нули для пустого рецепта', () => {
    const recipe = { ingredients: [] };
    const result = recipeTotals(recipe);
    expect(result.kcal).toBe(0);
    expect(result.protein).toBe(0);
    expect(result.fat).toBe(0);
    expect(result.carbs).toBe(0);
    expect(result.grams).toBe(0);
  });
});

describe('projectWeight', () => {
  it('должен рассчитывать дни до целевого веса', () => {
    const params = {
      currentWeightKg: 80,
      targetWeightKg: 75,
      tdee: 2500,
      dailyDeficit: 500,
    };
    const result = projectWeight(params);
    expect(result.daysToTarget).toBeGreaterThan(0);
    expect(result.weeklyLossKg).toBeGreaterThan(0);
  });

  it('должен определять безопасный дефицит', () => {
    const safeParams = {
      currentWeightKg: 80,
      targetWeightKg: 75,
      tdee: 2500,
      dailyDeficit: 400, // 16% от TDEE - безопасно
    };
    const unsafeParams = {
      currentWeightKg: 80,
      targetWeightKg: 75,
      tdee: 2500,
      dailyDeficit: 800, // 32% от TDEE - небезопасно
    };
    
    expect(projectWeight(safeParams).isSafe).toBe(true);
    expect(projectWeight(unsafeParams).isSafe).toBe(false);
  });

  it('должен возвращать 0 дней если цель уже достигнута', () => {
    const params = {
      currentWeightKg: 75,
      targetWeightKg: 75,
      tdee: 2500,
      dailyDeficit: 500,
    };
    const result = projectWeight(params);
    expect(result.daysToTarget).toBe(0);
    expect(result.isSafe).toBe(true);
  });

  it('должен учитывать дополнительный расход от активности', () => {
    const params = {
      currentWeightKg: 80,
      targetWeightKg: 75,
      tdee: 2500,
      dailyDeficit: 500,
      extraBurnPerDay: 200,
    };
    const result = projectWeight(params);
    expect(result.dailyDeficit).toBe(700); // 500 + 200
  });

  it('должен выдавать предупреждение при слишком малом дефиците', () => {
    const params = {
      currentWeightKg: 80,
      targetWeightKg: 75,
      tdee: 2500,
      dailyDeficit: 50, // Очень маленький дефицит
    };
    const result = projectWeight(params);
    expect(result.warning).toBeDefined();
  });
});
