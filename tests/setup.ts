import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Provide a lightweight mock for the `canvas` package so Konva can initialise
// in the Vitest environment without pulling in native dependencies.
const mockModule = vi.mock as unknown as (id: string, factory: () => unknown, options?: { virtual?: boolean }) => void;

mockModule('canvas', () => {
  class MockDOMMatrix {}
  class MockImage {
    width = 0;
    height = 0;
    onload: (() => void) | null = null;
    onerror: ((err: unknown) => void) | null = null;
    src = '';
  }

  const createCanvas = (width = 300, height = 150) => {
    const context: any = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      bezierCurveTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      rect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      setLineDash: vi.fn(),
      getLineDash: vi.fn(() => []),
      measureText: vi.fn(() => ({ width: 0 })),
      drawImage: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      translate: vi.fn(),
      transform: vi.fn(),
      setTransform: vi.fn(),
      resetTransform: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createPattern: vi.fn(() => ({})),
      getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(width * height * 4) })),
      putImageData: vi.fn(),
      createImageData: vi.fn((w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) })),
      clip: vi.fn(),
      arc: vi.fn(),
      arcTo: vi.fn(),
      ellipse: vi.fn(),
      lineWidth: 1,
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      strokeStyle: '#000',
      fillStyle: '#000',
      font: '10px sans-serif',
      textAlign: 'start',
      textBaseline: 'alphabetic',
      lineCap: 'butt',
      lineJoin: 'miter',
      miterLimit: 10,
    };

    const canvas: any = {
      width,
      height,
      getContext: vi.fn(() => context),
      toBuffer: vi.fn(),
      toDataURL: vi.fn(() => ''),
      getBoundingClientRect: vi.fn(() => ({
        x: 0,
        y: 0,
        width,
        height,
        top: 0,
        left: 0,
        right: width,
        bottom: height,
      })),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      style: {},
    };

    context.canvas = canvas;

    return canvas;
  };

  const exports: any = {
    DOMMatrix: MockDOMMatrix,
    Image: MockImage,
    ImageData: class MockImageData {
      constructor(public width: number, public height: number, public data = new Uint8ClampedArray(width * height * 4)) {}
    },
    Path2D: class MockPath2D {},
    CanvasRenderingContext2D: class MockCanvasRenderingContext2D {},
    createCanvas,
    loadImage: vi.fn(async () => new MockImage()),
  };

  return {
    default: exports,
    ...exports,
  };
}, { virtual: true });

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
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

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;
