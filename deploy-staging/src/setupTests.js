// Jest DOM extends expect with custom matchers for DOM nodes
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock ResizeObserver (required for Radix UI components)
class MockResizeObserver {
    constructor(callback) {
        this.callback = callback;
    }
    observe() { }
    unobserve() { }
    disconnect() { }
}
global.ResizeObserver = MockResizeObserver;

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

// Mock HTMLDialogElement methods (for Radix Dialog)
HTMLDialogElement.prototype.showModal = jest.fn();
HTMLDialogElement.prototype.close = jest.fn();

// Mock PointerEvent (required for Radix UI)
class MockPointerEvent extends Event {
    constructor(type, props = {}) {
        super(type, props);
        this.pointerId = props.pointerId || 0;
        this.pointerType = props.pointerType || 'mouse';
        this.isPrimary = props.isPrimary || true;
        this.button = props.button || 0;
        this.buttons = props.buttons || 0;
    }
}
global.PointerEvent = MockPointerEvent;

// Mock Element.prototype methods for Radix
Element.prototype.hasPointerCapture = jest.fn().mockReturnValue(false);
Element.prototype.setPointerCapture = jest.fn();
Element.prototype.releasePointerCapture = jest.fn();

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: jest.fn(),
});

// Suppress console errors/warnings in tests (can be re-enabled if needed)
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
    console.error = (...args) => {
        // Filter out known React 19 warnings
        if (
            typeof args[0] === 'string' &&
            (args[0].includes('act(') ||
                args[0].includes('ReactDOM.render') ||
                args[0].includes('Warning:'))
        ) {
            return;
        }
        originalError.call(console, ...args);
    };
    console.warn = (...args) => {
        if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
            return;
        }
        originalWarn.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalError;
    console.warn = originalWarn;
});

// Reset mocks between tests
afterEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReset();
    localStorageMock.setItem.mockReset();
});
