import * as React from "react"
import { render as rtlRender, screen } from "@testing-library/react"
import { act } from "react-dom/test-utils"
import userEvent from "@testing-library/user-event"
import type { RenderOptions } from "@testing-library/react"
import { ThemeProvider } from "@/components/theme"
import { SettingsProvider } from "../contexts/settings"

/**
 * Test wrapper with providers
 */
function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SettingsProvider>{children}</SettingsProvider>
    </ThemeProvider>
  )
}

/**
 * Custom render with providers
 */
function render(
  ui: React.ReactElement,
  options: Omit<RenderOptions, "wrapper"> = {}
) {
  return {
    user: userEvent.setup(),
    ...rtlRender(ui, {
      wrapper: Providers,
      ...options,
    }),
  }
}

/**
 * Setup intersection observer mock
 */
function setupIntersectionObserverMock({
  root = null,
  rootMargin = "",
  thresholds = [],
  disconnect = () => null,
  observe = () => null,
  unobserve = () => null,
} = {}) {
  window.IntersectionObserver = class MockIntersectionObserver {
    readonly root = root
    readonly rootMargin = rootMargin
    readonly thresholds = thresholds
    constructor() {}
    disconnect = disconnect
    observe = observe
    unobserve = unobserve
  } as unknown as typeof window.IntersectionObserver
}

/**
 * Wait for element to be removed
 */
async function waitForElementToBeRemoved(element: Element | null) {
  if (!element) return
  return new Promise<void>((resolve) => {
    const observer = new MutationObserver(() => {
      if (!document.contains(element)) {
        observer.disconnect()
        resolve()
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  })
}

/**
 * Mock console methods
 */
function mockConsole() {
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
}

// Re-export everything
export * from "@testing-library/react"
export {
  render,
  screen,
  userEvent,
  act,
  mockConsole,
  setupIntersectionObserverMock,
  waitForElementToBeRemoved,
  type RenderOptions,
}

// Add jest-dom matchers
import "@testing-library/jest-dom/extend-expect"
