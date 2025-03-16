'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ConfigSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function ConfigSidebar({ isOpen, onClose }: ConfigSidebarProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState('paperTrading')

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-card border-l border-border shadow-lg z-50 overflow-y-auto">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h2 className="text-lg font-semibold">Configuration</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <span className="sr-only">Close</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </Button>
      </div>

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="paperTrading">Paper Trading</TabsTrigger>
            <TabsTrigger value="strategies">Strategies</TabsTrigger>
          </TabsList>

          <TabsContent value="paperTrading" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Paper Trading Settings</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="verbose_log">Verbose Logging</Label>
                  <Switch id="verbose_log" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="initial_balance">Initial Balance (SOL)</Label>
                  <Input id="initial_balance" type="number" defaultValue="5" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dashboard_refresh">Dashboard Refresh (ms)</Label>
                  <Input id="dashboard_refresh" type="number" defaultValue="2000" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="recent_trades_limit">Recent Trades Limit</Label>
                  <Input id="recent_trades_limit" type="number" defaultValue="12" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Price Validation</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="price_validation_enabled">Enabled</Label>
                  <Switch id="price_validation_enabled" defaultChecked />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="window_size">Window Size</Label>
                  <Input id="window_size" type="number" defaultValue="12" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="max_deviation">Max Deviation</Label>
                  <Input id="max_deviation" type="number" step="0.01" defaultValue="0.05" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="min_data_points">Min Data Points</Label>
                  <Input id="min_data_points" type="number" defaultValue="6" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="fallback_to_single_source">Fallback to Single Source</Label>
                  <Switch id="fallback_to_single_source" defaultChecked />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Swap Settings</h3>
              <div className="space-y-2">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount (lamports)</Label>
                  <Input id="amount" type="text" defaultValue="500000000" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slippageBps">Slippage (basis points)</Label>
                  <Input id="slippageBps" type="text" defaultValue="200" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="max_open_positions">Max Open Positions</Label>
                  <Input id="max_open_positions" type="number" defaultValue="3" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Sell Settings</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto_sell">Auto Sell</Label>
                  <Switch id="auto_sell" defaultChecked />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stop_loss_percent">Stop Loss (%)</Label>
                  <Input id="stop_loss_percent" type="number" defaultValue="30" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="take_profit_percent">Take Profit (%)</Label>
                  <Input id="take_profit_percent" type="number" defaultValue="26" />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="strategies" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Global Strategy Settings</h3>
              <div className="flex items-center justify-between">
                <Label htmlFor="strategies_debug">Debug Mode</Label>
                <Switch id="strategies_debug" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Liquidity Drop Strategy</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="liquidity_drop_enabled">Enabled</Label>
                  <Switch id="liquidity_drop_enabled" defaultChecked />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="threshold_percent">Threshold (%)</Label>
                  <Input id="threshold_percent" type="number" defaultValue="20" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="liquidity_drop_debug">Debug Mode</Label>
                  <Switch id="liquidity_drop_debug" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Rug Check Settings</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="simulation_mode">Simulation Mode</Label>
                  <Switch id="simulation_mode" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="allow_mint_authority">Allow Mint Authority</Label>
                  <Switch id="allow_mint_authority" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="allow_freeze_authority">Allow Freeze Authority</Label>
                  <Switch id="allow_freeze_authority" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="allow_mutable">Allow Mutable</Label>
                  <Switch id="allow_mutable" defaultChecked />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="max_score">Max Risk Score</Label>
                  <Input id="max_score" type="number" defaultValue="30000" />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  )
}
