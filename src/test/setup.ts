import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { server } from './mocks/server';

// Start MSW before any tests; reset after each; shut down after all
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Clean up React trees after each test
afterEach(() => {
  cleanup();
});

// Browser APIs not available in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
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

// navigator.share not in jsdom
Object.defineProperty(navigator, 'share', {
  writable: true,
  value: undefined,
});

// navigator.clipboard not in jsdom
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  configurable: true,
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
});

// HTMLCanvasElement — used by compressImage()
HTMLCanvasElement.prototype.toBlob = vi.fn((cb) => {
  cb(new Blob(['fake-image'], { type: 'image/jpeg' }));
});
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  drawImage: vi.fn(),
})) as unknown as typeof HTMLCanvasElement.prototype.getContext;

// Image constructor — onload never fires in jsdom; fire it synchronously
class MockImage {
  onload: (() => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  width = 100;
  height = 100;
  set src(_: string) {
    // Trigger onload on next tick so the assignment completes first
    setTimeout(() => this.onload?.(), 0);
  }
}
vi.stubGlobal('Image', MockImage);

// URL.createObjectURL / revokeObjectURL (used by ImageUpload)
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();
