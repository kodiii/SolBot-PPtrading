/// <reference types="jest" />

import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toBeVisible(): R;
      toBeEmpty(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeInvalid(): R;
      toBeRequired(): R;
      toBeValid(): R;
      toBeChecked(): R;
      toContainElement(element: Element | null): R;
      toContainHTML(html: string): R;
      toHaveAttribute(attr: string, value?: string | RegExp): R;
      toHaveClass(...classNames: string[]): R;
      toHaveStyle(css: string | Record<string, unknown>): R;
      toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): R;
      toHaveValue(value: string | string[] | number): R;
      toBeEmptyDOMElement(): R;
      toHaveFocus(): R;
      toHaveFormValues(values: Record<string, unknown>): R;
      toBeVisible(): R;
    }
  }
}
