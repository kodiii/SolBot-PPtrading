'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ConfigSettings } from '@/components/dashboard/types/config'

interface PaperTradingTabProps {
  settings: ConfigSettings;
  updateSetting: (category: keyof ConfigSettings, key: string, value: string | number | boolean | string[]) => void;
}

export function PaperTradingTab({ settings, updateSetting }: PaperTradingTabProps): React.ReactElement {
  return (
    <div className="bg-card/50 rounded-lg p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h3 className="text-lg font-semibold border-b pb-2">General Settings</h3>
        <div className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="initialBalance">Initial Balance (SOL)</Label>
            <Input 
              id="initialBalance" 
              type="number" 
              value={settings.paperTrading.initialBalance}
              onChange={(e) => updateSetting('paperTrading', 'initialBalance', parseFloat(e.target.value))}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="dashboardRefresh">Dashboard Refresh (ms)</Label>
            <Input 
              id="dashboardRefresh" 
              type="number" 
              value={settings.paperTrading.dashboardRefresh}
              onChange={(e) => updateSetting('paperTrading', 'dashboardRefresh', parseInt(e.target.value))}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="recentTradesLimit">Recent Trades Limit</Label>
            <Input 
              id="recentTradesLimit" 
              type="number" 
              value={settings.paperTrading.recentTradesLimit}
              onChange={(e) => updateSetting('paperTrading', 'recentTradesLimit', parseInt(e.target.value))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="verboseLogging">Verbose Logging</Label>
            <Switch 
              id="verboseLogging" 
              checked={settings.paperTrading.verboseLogging}
              onCheckedChange={(checked) => updateSetting('paperTrading', 'verboseLogging', checked)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}