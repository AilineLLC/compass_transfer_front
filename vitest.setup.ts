import '@testing-library/jest-dom';

// matchMedia mock (use-mobile hook)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

Object.defineProperty(window, 'innerWidth', {
  writable: true,
  value: 1024,
});

// Radix UI compatibility
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserver;

// Radix UI uses pointer events for dismiss/focus management
global.PointerEvent = class PointerEvent extends MouseEvent {
  constructor(type: string, props: PointerEventInit = {}) {
    super(type, props);
  }
} as unknown as typeof PointerEvent;

window.HTMLElement.prototype.hasPointerCapture = () => false;
window.HTMLElement.prototype.setPointerCapture = () => {};
window.HTMLElement.prototype.releasePointerCapture = () => {};

// scrollTo mock (used by form chapter navigation)
Object.defineProperty(window, 'scrollTo', { writable: true, value: () => {} });
Object.defineProperty(window, 'pageYOffset', { writable: true, value: 0 });
