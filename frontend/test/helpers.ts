import { screen, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * Types for form interactions
 */
interface FormValues {
  [key: string]: string | number | boolean
}

interface QueryOptions {
  container?: HTMLElement
  exact?: boolean
}

/**
 * Fill form fields with provided values
 */
export async function fillForm(values: FormValues): Promise<void> {
  const user = userEvent.setup()
  
  for (const [name, value] of Object.entries(values)) {
    const element = screen.getByRole('textbox', { name: new RegExp(name, 'i') }) ||
                   screen.getByLabelText(new RegExp(name, 'i'))
    
    if (typeof value === 'boolean') {
      await user.click(element)
    } else {
      await user.clear(element)
      await user.type(element, String(value))
    }
  }
}

/**
 * Find element by text content
 */
export function findByTextContent(
  text: string | RegExp,
  options: QueryOptions = {}
): HTMLElement | null {
  const { container = document.body, exact = true } = options
  const nodes = Array.from(container.querySelectorAll('*'))
  
  return nodes.find(node => {
    const nodeText = node.textContent
    if (!nodeText) return false
    
    return exact
      ? nodeText.trim() === text.toString()
      : nodeText.match(new RegExp(text, 'i'))
  }) as HTMLElement | null
}

/**
 * Wait for element to be removed with timeout
 */
export async function waitForRemoval(
  element: Element | null,
  timeout = 1000
): Promise<void> {
  if (!element) return
  
  return new Promise((resolve, reject) => {
    const observer = new MutationObserver(() => {
      if (!document.contains(element)) {
        observer.disconnect()
        resolve()
      }
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
    
    setTimeout(() => {
      observer.disconnect()
      reject(new Error(`Element not removed within ${timeout}ms`))
    }, timeout)
  })
}

/**
 * Select option from dropdown
 */
export async function selectOption(
  labelText: string | RegExp,
  optionText: string | RegExp
): Promise<void> {
  const user = userEvent.setup()
  const select = screen.getByLabelText(labelText)
  
  await user.click(select)
  const option = screen.getByText(optionText)
  await user.click(option)
}

/**
 * Get form field value
 */
export function getFieldValue(labelText: string | RegExp): string {
  const field = screen.getByLabelText(labelText)
  return (field as HTMLInputElement).value
}

/**
 * Check if element is visible
 */
export function isVisible(element: Element | null): boolean {
  if (!element) return false
  
  const style = window.getComputedStyle(element)
  return style.display !== 'none' &&
         style.visibility !== 'hidden' &&
         style.opacity !== '0'
}

/**
 * Get element by test id within container
 */
export function getByTestIdIn(
  container: HTMLElement,
  testId: string
): HTMLElement {
  return within(container).getByTestId(testId)
}

/**
 * Simulate file upload
 */
export function uploadFile(
  inputElement: HTMLElement,
  file: File
): void {
  fireEvent.change(inputElement, {
    target: { files: [file] }
  })
}

/**
 * Create test file
 */
export function createTestFile(
  name = 'test.txt',
  type = 'text/plain',
  content = 'test content'
): File {
  return new File([content], name, { type })
}