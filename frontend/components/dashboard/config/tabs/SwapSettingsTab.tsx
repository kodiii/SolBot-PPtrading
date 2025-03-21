'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfigSettings } from '@/components/dashboard/types/config'

interface SwapSettingsTabProps {
  settings: ConfigSettings;
  updateSetting: (category: keyof ConfigSettings, key: string, value: string | number | boolean | string[]) => void;
}

export function SwapSettingsTab({ settings, updateSetting }: SwapSettingsTabProps): React.ReactElement {
  return (
    <div className="bg-card/50 rounded-lg p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h3 className="text-lg font-semibold border-b pb-2">Swap Configuration</h3>
        <div className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount (lamports)</Label>
            <Input 
              id="amount" 
              type="number" 
              value={settings.swap.amount}
              onChange={(e) => updateSetting('swap', 'amount', parseInt(e.target.value))}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="slippageBps">Slippage (basis points)</Label>
            <Input 
              id="slippageBps" 
              type="number" 
              value={settings.swap.slippageBps}
              onChange={(e) => updateSetting('swap', 'slippageBps', parseInt(e.target.value))}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="maxOpenPositions">Max Open Positions</Label>
            <Input 
              id="maxOpenPositions" 
              type="number" 
              value={isNaN(settings.swap.maxOpenPositions) ? 0 : settings.swap.maxOpenPositions}
              onChange={(e) => updateSetting('swap', 'maxOpenPositions', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}