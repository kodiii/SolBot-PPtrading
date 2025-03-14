import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import { fetch, Headers, Request, Response } from 'cross-fetch'

// Mock fetch API
global.fetch = fetch
global.Headers = Headers
global.Request = Request
global.Response = Response

// Mock TextEncoder/TextDecoder
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as typeof global.TextDecoder

// Mock intersection observer
const mockIntersectionObserver = jest.fn()
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
})
window.IntersectionObserver = mockIntersectionObserver as unknown as typeof IntersectionObserver

// Mock resize observer
const mockResizeObserver = jest.fn()
mockResizeObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
})
window.ResizeObserver = mockResizeObserver as unknown as typeof ResizeObserver

// Mock match media
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock local storage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    clear: () => {
      store = {}
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    key: (index: number) => Object.keys(store)[index] || null,
    length: 0,
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock scroll behavior
Object.defineProperty(window, 'scroll', {
  value: jest.fn(),
})
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
})

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback) => setTimeout(callback, 0)
global.cancelAnimationFrame = (id: number) => clearTimeout(id)

// Suppress console during tests
const originalConsole = { ...console }
beforeAll(() => {
  console.error = jest.fn()
  console.warn = jest.fn()
  console.log = jest.fn()
})
afterAll(() => {
  console.error = originalConsole.error
  console.warn = originalConsole.warn
  console.log = originalConsole.log
})

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
  document.body.innerHTML = ''
})