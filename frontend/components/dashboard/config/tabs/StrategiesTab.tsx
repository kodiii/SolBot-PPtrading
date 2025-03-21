'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ConfigSettings } from '@/components/dashboard/types/config'

interface StrategiesTabProps {
  settings: ConfigSettings;
  updateSetting: (category: keyof ConfigSettings, key: string, value: string | number | boolean | string[]) => void;
}

export function StrategiesTab({ settings, updateSetting }: StrategiesTabProps): React.ReactElement {
  return (
    <div className="bg-card/50 rounded-lg p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h3 className="text-lg font-semibold border-b pb-2">Liquidity Drop Strategy</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="liquidityDropEnabled">Enabled</Label>
            <Switch 
              id="liquidityDropEnabled" 
              checked={settings.strategies.liquidityDropEnabled}
              onCheckedChange={(checked) => updateSetting('strategies', 'liquidityDropEnabled', checked)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="threshold">Threshold (%)</Label>
            <Input 
              id="threshold" 
              type="number" 
              value={settings.strategies.threshold}
              onChange={(e) => updateSetting('strategies', 'threshold', parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>
    </div>
  )
}