import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Очищаем DOM после каждого теста
afterEach(() => {
  cleanup();
});

// Очищаем localStorage после каждого теста
afterEach(() => {
  localStorage.clear();
});

// Сбрасываем все моки после каждого теста
afterEach(() => {
  vi.clearAllMocks();
});

// Заглушка для matchMedia (нужна для тем и медиа-запросов)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Заглушка для Notification API
class MockNotification {
  title: string;
  options?: any;
  constructor(title: string, options?: any) {
    this.title = title;
    this.options = options;
  }
  static permission = 'default';
  static requestPermission = vi.fn(() => Promise.resolve('granted'));
}
window.Notification = MockNotification as any;

// Заглушка для BarcodeDetector API
class MockBarcodeDetectorImpl {
  detect = vi.fn(() => Promise.resolve([]));
  static getSupportedFormats = vi.fn(() => Promise.resolve([]));
}
(window as any).BarcodeDetector = MockBarcodeDetectorImpl;
