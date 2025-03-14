import { http, HttpResponse, delay } from 'msw'
import { setupServer } from 'msw/node'

/**
 * Common API response types
 */
interface ApiResponse<T = any> {
  data?: T
  error?: string
  status: number
}

/**
 * Handler response type
 */
export type HandlerResponse = Response | Promise<Response>

/**
 * Base handler params
 */
export interface BaseRequestInfo {
  request: Request
}

/**
 * Handler params with route params
 */
export interface ParamsRequestInfo extends BaseRequestInfo {
  params: {
    [key: string]: string
  }
}

export type HandlerInfo = BaseRequestInfo | ParamsRequestInfo

export type MockHandler = (info: HandlerInfo) => HandlerResponse

/**
 * Default handlers for common API endpoints
 */
const defaultHandlers = [
  // Health check
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' }, { status: 200 })
  }),

  // API error simulation
  http.get('/api/error', () => {
    return HttpResponse.json({
      error: 'Internal Server Error',
      message: 'Test error response'
    }, { status: 500 })
  })
]

/**
 * Create API mock handlers
 */
export function createHandlers(handlers: Record<string, MockHandler>) {
  return Object.entries(handlers).map(([path, handler]) => {
    const [method, endpoint] = path.split(' ')
    const httpMethod = (http as any)[method.toLowerCase()]
    return httpMethod(endpoint, handler)
  })
}

/**
 * Create MSW server with handlers
 */
export function createServer(handlers: Record<string, MockHandler> = {}) {
  const server = setupServer(
    ...defaultHandlers,
    ...createHandlers(handlers)
  )

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterAll(() => server.close())
  afterEach(() => server.resetHandlers())

  return server
}

/**
 * Mock successful API response
 */
export function mockApiSuccess<T>(data: T, status = 200): ApiResponse<T> {
  return { data, status }
}

/**
 * Mock API error response
 */
export function mockApiError(
  message: string,
  status = 500,
  code?: string
): ApiResponse {
  return {
    error: message,
    status,
    data: { code, message }
  }
}

/**
 * Response composition helpers
 */
export const responseHelpers = {
  success: (data: any) => () =>
    HttpResponse.json(mockApiSuccess(data), { status: 200 }),

  error: (message: string, status = 500) => () =>
    HttpResponse.json(mockApiError(message, status), { status }),

  delay: (ms: number) => async () => {
    await delay(ms)
    return new HttpResponse(null, { status: 200 })
  },

  networkError: () => () =>
    HttpResponse.error()
}
