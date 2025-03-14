import { renderHook, act } from "@testing-library/react"
import {
  useAutoRefresh,
  useMonitoring,
  useThemeSettings,
  useDataPolling,
  useSettingsPersistence,
} from "../useAppSettings"
import { SettingsProvider } from "@/contexts/settings"
import { monitoring } from "@/lib/monitoring"

interface CustomStorage extends Storage {
  getItem: jest.Mock<string | null, [string]>;
  setItem: jest.Mock<void, [string, string]>;
  clear: jest.Mock<void, []>;
  key: jest.Mock<string | null, [number]>;
  removeItem: jest.Mock<void, [string]>;
}

declare global {
  interface Window {
    localStorage: CustomStorage;
  }
}

window.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  removeItem: jest.fn(),
  length: 0,
} as CustomStorage;

// Mock monitoring
jest.mock("@/lib/monitoring", () => ({
  monitoring: {
    setEnabled: jest.fn(),
    trackPerformance: jest.fn(),
  },
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SettingsProvider>{children}</SettingsProvider>
)

describe("useAutoRefresh", () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  it("should return default auto-refresh settings", () => {
    const { result } = renderHook(() => useAutoRefresh(), { wrapper })

    expect(result.current.enabled).toBe(true)
    expect(result.current.interval).toBe(2000)
  })

  it("should update auto-refresh settings", () => {
    const { result } = renderHook(() => useAutoRefresh(), { wrapper })

    act(() => {
      result.current.setEnabled(false)
      result.current.setInterval(5000)
    })

    expect(result.current.enabled).toBe(false)
    expect(result.current.interval).toBe(5000)
  })
})

describe("useMonitoring", () => {
  it("should toggle monitoring", () => {
    const { result } = renderHook(() => useMonitoring(), { wrapper })

    act(() => {
      result.current.setEnabled(false)
    })

    expect(result.current.enabled).toBe(false)
    expect(monitoring.setEnabled).toHaveBeenCalledWith(false)
  })
})

describe("useThemeSettings", () => {
  it("should toggle dark mode", () => {
    const { result } = renderHook(() => useThemeSettings(), { wrapper })

    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.isDark).toBe(true)
  })
})

describe("useDataPolling", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("should poll data at specified interval", async () => {
    const mockFetch = jest.fn().mockResolvedValue({ data: "test" })
    const { result } = renderHook(
      () => useDataPolling(mockFetch, { enabled: true }),
      { wrapper }
    )

    expect(mockFetch).toHaveBeenCalledTimes(1)

    act(() => {
      jest.advanceTimersByTime(2000)
    })

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(result.current.data).toEqual({ data: "test" })
  })

  it("should handle errors", async () => {
    const error = new Error("Test error")
    const mockFetch = jest.fn().mockRejectedValue(error)
    const onError = jest.fn()

    const { result } = renderHook(
      () => useDataPolling(mockFetch, { onError }),
      { wrapper }
    )

    expect(result.current.error).toEqual(error)
    expect(onError).toHaveBeenCalledWith(error)
  })
})

describe("useSettingsPersistence", () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  it("should persist settings to localStorage", () => {
    const { result } = renderHook(() =>
      useSettingsPersistence("test", { value: "initial" })
    )

    act(() => {
      result.current[1]({ value: "updated" })
    })

    expect(localStorage.setItem).toHaveBeenCalledWith(
      "test",
      JSON.stringify({ value: "updated" })
    )
  })

  it("should load persisted settings", () => {
    const mockValue = JSON.stringify({ value: "persisted" });
    (localStorage.getItem as jest.Mock).mockReturnValue(mockValue);

    const { result } = renderHook(() =>
      useSettingsPersistence("test", { value: "initial" })
    )

    expect(result.current[0]).toEqual({ value: "persisted" })
  })
})
