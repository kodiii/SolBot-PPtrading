import React from "react"
import { render, screen, userEvent, waitFor } from "@/test/test-utils"
import SettingsPage from "@/app/settings/page"
import { monitoring } from "@/lib/monitoring"

// Mock monitoring
jest.mock("@/lib/monitoring", () => ({
  monitoring: {
    setEnabled: jest.fn(),
    trackPerformance: jest.fn(),
  },
}))

describe("SettingsPage", () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  it("renders all settings sections", () => {
    render(<SettingsPage />)

    // Check headings
    expect(screen.getByText("Settings")).toBeInTheDocument()
    expect(screen.getByText("Appearance")).toBeInTheDocument()
    expect(screen.getByText("Data Updates")).toBeInTheDocument()
    expect(screen.getByText("System")).toBeInTheDocument()
  })

  it("toggles dark mode", async () => {
    render(<SettingsPage />)
    const user = userEvent.setup()
    const themeSwitch = screen.getByLabelText(/Dark Mode/i)

    // Initial state
    expect(document.documentElement).not.toHaveClass("dark")

    // Toggle dark mode
    await user.click(themeSwitch)
    expect(document.documentElement).toHaveClass("dark")

    // Toggle back to light mode
    await user.click(themeSwitch)
    expect(document.documentElement).not.toHaveClass("dark")
  })

  it("toggles auto refresh", async () => {
    render(<SettingsPage />)
    const user = userEvent.setup()
    const autoRefreshSwitch = screen.getByLabelText(/Auto Refresh/i)

    // Auto refresh is enabled by default
    expect(autoRefreshSwitch).toBeChecked()

    // Refresh interval should be enabled
    const refreshInterval = screen.getByLabelText(/Refresh Interval/i)
    expect(refreshInterval).toBeEnabled()

    // Disable auto refresh
    await user.click(autoRefreshSwitch)
    expect(autoRefreshSwitch).not.toBeChecked()

    // Refresh interval should be disabled
    expect(refreshInterval).toBeDisabled()
  })

  it("changes refresh interval", async () => {
    render(<SettingsPage />)
    const user = userEvent.setup()
    const refreshSelect = screen.getByLabelText(/Refresh Interval/i)

    // Default interval
    expect(refreshSelect).toHaveValue("2000")

    // Open select
    await user.click(refreshSelect)

    // Select 5 seconds
    const option = screen.getByText("5 seconds")
    await user.click(option)

    // Check if value is updated
    expect(refreshSelect).toHaveValue("5000")
  })

  it("toggles monitoring", async () => {
    render(<SettingsPage />)
    const user = userEvent.setup()
    const monitoringSwitch = screen.getByLabelText(/Error Monitoring/i)

    // Monitoring is enabled by default
    expect(monitoringSwitch).toBeChecked()

    // Disable monitoring
    await user.click(monitoringSwitch)
    expect(monitoringSwitch).not.toBeChecked()
    expect(monitoring.setEnabled).toHaveBeenCalledWith(false)

    // Enable monitoring
    await user.click(monitoringSwitch)
    expect(monitoringSwitch).toBeChecked()
    expect(monitoring.setEnabled).toHaveBeenCalledWith(true)
  })

  it("persists settings", async () => {
    render(<SettingsPage />)
    const user = userEvent.setup()

    // Change some settings
    await user.click(screen.getByLabelText(/Dark Mode/i))
    await user.click(screen.getByLabelText(/Auto Refresh/i))

    // Re-render component
    const { rerender } = render(<SettingsPage />)
    rerender(<SettingsPage />)

    // Check if settings are persisted
    await waitFor(() => {
      expect(screen.getByLabelText(/Dark Mode/i)).toBeChecked()
      expect(screen.getByLabelText(/Auto Refresh/i)).not.toBeChecked()
    })
  })
})