import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { StoreProvider, useStore } from './store';
import type { Profile, Settings, MealEntry, WeightPoint } from './types';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <StoreProvider>{children}</StoreProvider>
);

describe('useStore - профиль', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('должен загружать состояние по умолчанию', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    
    expect(result.current.state.profile).toBeDefined();
    expect(result.current.state.profile.sex).toBe('male');
    expect(result.current.state.profile.age).toBe(30);
  });

  it('должен сохранять профиль', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    
    const newProfile: Profile = {
      ...result.current.state.profile,
      name: 'Test User',
      age: 35,
      weightKg: 80,
    };
    
    act(() => {
      result.current.saveProfile(newProfile);
    });
    
    expect(result.current.state.profile.name).toBe('Test User');
    expect(result.current.state.profile.age).toBe(35);
    expect(result.current.state.profile.weightKg).toBe(80);
  });

  it('должен сохранять профиль в localStorage', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    
    act(() => {
      result.current.saveProfile({
        ...result.current.state.profile,
        name: 'Persistent User',
      });
    });
    
    const stored = localStorage.getItem('kaloriyka-v1');
    expect(stored).toBeDefined();
    const parsed = JSON.parse(stored!);
    expect(parsed.profile.name).toBe('Persistent User');
  });
});

describe('useStore - настройки', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('должен загружать настройки по умолчанию', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    
    expect(result.current.state.settings.theme).toBe('dark');
    expect(result.current.state.settings.language).toBe('ru');
    expect(result.current.state.settings.units).toBe('g');
  });

  it('должен сохранять настройки', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    
    act(() => {
      result.current.saveSettings({
        ...result.current.state.settings,
        theme: 'light',
        language: 'en',
      });
    });
    
    expect(result.current.state.settings.theme).toBe('light');
    expect(result.current.state.settings.language).toBe('en');
  });
});

describe('useStore - продукты', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('должен добавлять новый продукт', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    const initialCount = result.current.state.products.length;
    
    act(() => {
      result.current.upsertProduct({
        id: 'custom1',
        name: 'Custom Product',
        category: 'Другое',
        kcal: 100,
        protein: 10,
        fat: 5,
        carbs: 10,
        custom: true,
      });
    });
    
    expect(result.current.state.products.length).toBe(initialCount + 1);
    const product = result.current.state.products.find(p => p.id === 'custom1');
    expect(product).toBeDefined();
    expect(product?.name).toBe('Custom Product');
  });

  it('должен обновлять существующий продукт', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    
    act(() => {
      result.current.upsertProduct({
        id: 'custom1',
        name: 'Original',
        category: 'Другое',
        kcal: 100,
        protein: 10,
        fat: 5,
        carbs: 10,
        custom: true,
      });
    });
    
    act(() => {
      result.current.upsertProduct({
        id: 'custom1',
        name: 'Updated',
        category: 'Другое',
        kcal: 150,
        protein: 15,
        fat: 7,
        carbs: 12,
        custom: true,
      });
    });
    
    const product = result.current.state.products.find(p => p.id === 'custom1');
    expect(product?.name).toBe('Updated');
    expect(product?.kcal).toBe(150);
  });

  it('должен удалять продукт', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    
    act(() => {
      result.current.upsertProduct({
        id: 'to-delete',
        name: 'To Delete',
        category: 'Другое',
        kcal: 100,
        protein: 10,
        fat: 5,
        carbs: 10,
        custom: true,
      });
    });
    
    expect(result.current.state.products.some(p => p.id === 'to-delete')).toBe(true);
    
    act(() => {
      result.current.deleteProduct('to-delete');
    });
    
    expect(result.current.state.products.some(p => p.id === 'to-delete')).toBe(false);
  });

  it('должен переключать избранное', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    const firstProductId = result.current.state.products[0].id;
    
    expect(result.current.state.products[0].favorite).toBeFalsy();
    
    act(() => {
      result.current.toggleFavorite(firstProductId);
    });
    
    expect(result.current.state.products.find(p => p.id === firstProductId)?.favorite).toBe(true);
    
    act(() => {
      result.current.toggleFavorite(firstProductId);
    });
    
    expect(result.current.state.products.find(p => p.id === firstProductId)?.favorite).toBeFalsy();
  });
});

describe('useStore - записи дневника', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('должен добавлять запись', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    
    const entry: MealEntry = {
      id: 'e1',
      date: '2024-01-01',
      meal: 'breakfast',
      time: '08:00',
      refId: 'p1',
      kcal: 300,
      protein: 15,
      fat: 10,
      carbs: 40,
    };
    
    act(() => {
      result.current.addEntry(entry);
    });
    
    expect(result.current.state.entries.length).toBe(1);
    expect(result.current.state.entries[0]).toEqual(entry);
  });

  it('должен обновлять запись', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    
    const entry: MealEntry = {
      id: 'e1',
      date: '2024-01-01',
      meal: 'breakfast',
      time: '08:00',
      refId: 'p1',
      kcal: 300,
      protein: 15,
      fat: 10,
      carbs: 40,
    };
    
    act(() => {
      result.current.addEntry(entry);
    });
    
    const updated: MealEntry = {
      ...entry,
      kcal: 350,
      protein: 18,
    };
    
    act(() => {
      result.current.updateEntry(updated);
    });
    
    expect(result.current.state.entries.find(e => e.id === 'e1')?.kcal).toBe(350);
  });

  it('должен удалять запись', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    
    act(() => {
      result.current.addEntry({
        id: 'e1',
        date: '2024-01-01',
        meal: 'breakfast',
        time: '08:00',
        refId: 'p1',
        kcal: 300,
        protein: 15,
        fat: 10,
        carbs: 40,
      });
    });
    
    expect(result.current.state.entries.length).toBe(1);
    
    act(() => {
      result.current.deleteEntry('e1');
    });
    
    expect(result.current.state.entries.length).toBe(0);
  });
});

describe('useStore - вес', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('должен добавлять точку веса', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    
    const weight: WeightPoint = {
      date: '2024-01-01',
      kg: 75.5,
    };
    
    act(() => {
      result.current.addWeight(weight);
    });
    
    expect(result.current.state.weights.length).toBe(1);
    expect(result.current.state.weights[0]).toEqual(weight);
  });

  it('должен удалять точку веса по дате', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    
    act(() => {
      result.current.addWeight({ date: '2024-01-01', kg: 75.5 });
      result.current.addWeight({ date: '2024-01-02', kg: 75.3 });
    });
    
    expect(result.current.state.weights.length).toBe(2);
    
    act(() => {
      result.current.deleteWeightAt('2024-01-01');
    });
    
    expect(result.current.state.weights.length).toBe(1);
    expect(result.current.state.weights[0].date).toBe('2024-01-02');
  });
});

describe('useStore - активность', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('должен добавлять активность', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    
    act(() => {
      result.current.addActivity({
        date: '2024-01-01',
        type: 'running',
        minutes: 30,
        kcal: 300,
      });
    });
    
    expect(result.current.state.activities.length).toBe(1);
    expect(result.current.state.activities[0].type).toBe('running');
    expect(result.current.state.activities[0].minutes).toBe(30);
  });

  it('должен удалять активность', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    
    act(() => {
      result.current.addActivity({
        date: '2024-01-01',
        type: 'running',
        minutes: 30,
        kcal: 300,
      });
    });
    
    const activityId = result.current.state.activities[0].id;
    expect(result.current.state.activities.length).toBe(1);
    
    act(() => {
      result.current.deleteActivity(activityId);
    });
    
    expect(result.current.state.activities.length).toBe(0);
  });
});

describe('useStore - челленджи', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('должен присоединяться к челленджу', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    
    act(() => {
      result.current.joinChallenge('c-protein');
    });
    
    expect(result.current.state.joinedChallenges).toContain('c-protein');
  });

  it('должен покидать челлендж', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    
    // По умолчанию уже есть c-streak и c-cal
    expect(result.current.state.joinedChallenges).toContain('c-streak');
    
    act(() => {
      result.current.leaveChallenge('c-streak');
    });
    
    expect(result.current.state.joinedChallenges).not.toContain('c-streak');
  });

  it('не должен дублировать челлендж при повторном присоединении', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    
    act(() => {
      result.current.joinChallenge('c-protein');
      result.current.joinChallenge('c-protein');
    });
    
    const count = result.current.state.joinedChallenges.filter(id => id === 'c-protein').length;
    expect(count).toBe(1);
  });

  it('должен корректно обрабатывать выход из несуществующего челленджа', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    const beforeCount = result.current.state.joinedChallenges.length;
    
    act(() => {
      result.current.leaveChallenge('non-existent-challenge');
    });
    
    expect(result.current.state.joinedChallenges.length).toBe(beforeCount);
  });
});

describe('useStore - экспорт/импорт', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('должен экспортировать состояние в JSON', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    
    act(() => {
      result.current.saveProfile({
        ...result.current.state.profile,
        name: 'Export Test',
      });
    });
    
    const json = result.current.exportBackup();
    expect(typeof json).toBe('string');
    
    const parsed = JSON.parse(json);
    expect(parsed.profile.name).toBe('Export Test');
  });

  it('должен импортировать состояние из JSON', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    
    const backup = JSON.stringify({
      version: 1,
      profile: { ...result.current.state.profile, name: 'Imported' },
      settings: result.current.state.settings,
      products: [],
      entries: [],
      weights: [],
      recipes: [],
      activities: [],
      joinedChallenges: [],
      notes: [],
      checkins: [],
      habits: [],
      habitLogs: [],
    });
    
    act(() => {
      const success = result.current.importBackup(backup);
      expect(success).toBe(true);
    });
    
    expect(result.current.state.profile.name).toBe('Imported');
  });

  it('должен возвращать false при импорте битого JSON', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    
    const success = result.current.importBackup('invalid json{');
    expect(success).toBe(false);
  });
});

describe('useStore - заметки', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('должен добавлять заметку', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    
    act(() => {
      result.current.addNote({
        text: 'Test note',
        tags: ['#test'],
        date: '2024-01-01',
      });
    });
    
    expect(result.current.state.notes.length).toBe(1);
    expect(result.current.state.notes[0].text).toBe('Test note');
  });

  it('должен обновлять заметку', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    
    act(() => {
      result.current.addNote({
        text: 'Original',
        tags: [],
        date: '2024-01-01',
      });
    });
    
    const noteId = result.current.state.notes[0].id;
    
    act(() => {
      result.current.updateNote({
        id: noteId,
        text: 'Updated',
        tags: ['#updated'],
        date: '2024-01-01',
        createdAt: result.current.state.notes[0].createdAt,
      });
    });
    
    expect(result.current.state.notes[0].text).toBe('Updated');
  });

  it('должен удалять заметку', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    
    act(() => {
      result.current.addNote({
        text: 'To delete',
        tags: [],
        date: '2024-01-01',
      });
    });
    
    const noteId = result.current.state.notes[0].id;
    expect(result.current.state.notes.length).toBe(1);
    
    act(() => {
      result.current.deleteNote(noteId);
    });
    
    expect(result.current.state.notes.length).toBe(0);
  });
});
