'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ConfigSettings } from '@/components/dashboard/types/config'

interface PriceValidationTabProps {
  settings: ConfigSettings;
  updateSetting: (category: keyof ConfigSettings, key: string, value: string | number | boolean | string[]) => void;
}

export function PriceValidationTab({ settings, updateSetting }: PriceValidationTabProps): React.ReactElement {
  return (
    <div className="bg-card/50 rounded-lg p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h3 className="text-lg font-semibold border-b pb-2">Validation Settings</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="priceValidationEnabled">Enabled</Label>
            <Switch 
              id="priceValidationEnabled" 
              checked={settings.priceValidation.enabled}
              onCheckedChange={(checked) => updateSetting('priceValidation', 'enabled', checked)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="windowSize">Window Size</Label>
            <Input 
              id="windowSize" 
              type="number" 
              value={settings.priceValidation.windowSize}
              onChange={(e) => updateSetting('priceValidation', 'windowSize', parseInt(e.target.value))}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="maxDeviation">Max Deviation</Label>
            <Input 
              id="maxDeviation" 
              type="number" 
              step="0.01"
              value={settings.priceValidation.maxDeviation}
              onChange={(e) => updateSetting('priceValidation', 'maxDeviation', parseFloat(e.target.value))}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="minDataPoints">Min Data Points</Label>
            <Input 
              id="minDataPoints" 
              type="number" 
              value={isNaN(settings.priceValidation.minDataPoints) ? 0 : settings.priceValidation.minDataPoints}
              onChange={(e) => updateSetting('priceValidation', 'minDataPoints', parseInt(e.target.value) || 0)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="fallbackToSingleSource">Fallback to Single Source</Label>
            <Switch 
              id="fallbackToSingleSource" 
              checked={settings.priceValidation.fallbackToSingleSource}
              onCheckedChange={(checked) => updateSetting('priceValidation', 'fallbackToSingleSource', checked)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}