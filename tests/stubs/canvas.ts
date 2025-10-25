import { vi } from 'vitest';

class MockDOMMatrix {}
class MockImage {
  width = 0;
  height = 0;
  onload: (() => void) | null = null;
  onerror: ((err: unknown) => void) | null = null;
  src = '';
}

class MockImageData {
  data: Uint8ClampedArray;
  constructor(public width: number, public height: number) {
    this.data = new Uint8ClampedArray(width * height * 4);
  }
}

class MockPath2D {}
class MockCanvasRenderingContext2D {}

const createCanvasInternal = (width = 300, height = 150) => {
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

const exportsObj: any = {
  DOMMatrix: MockDOMMatrix,
  Image: MockImage,
  ImageData: MockImageData,
  Path2D: MockPath2D,
  CanvasRenderingContext2D: MockCanvasRenderingContext2D,
  createCanvas: createCanvasInternal,
  loadImage: vi.fn(async () => new MockImage()),
};

export default exportsObj;
export const DOMMatrix = MockDOMMatrix;
export const Image = MockImage;
export const ImageData = MockImageData;
export const Path2D = MockPath2D;
export const CanvasRenderingContext2D = MockCanvasRenderingContext2D;
export const createCanvasElement = createCanvasInternal;
export const createCanvas = createCanvasInternal;
export const loadImage = exportsObj.loadImage;
