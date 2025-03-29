'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { ConfigSettings } from '@/components/dashboard/types/config'

interface AppearanceTabProps {
  settings: ConfigSettings;
  updateSetting: (category: keyof ConfigSettings, key: string, value: string | number | boolean | string[]) => void;
}

export function AppearanceTab({ settings, updateSetting }: AppearanceTabProps): React.ReactElement {
  return (
    <div className="bg-card/50 rounded-lg p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h3 className="text-lg font-semibold border-b pb-2">Theme Settings</h3>
        <div className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="theme">Theme</Label>
            <select
              id="theme"
              value={settings.appearance.theme}
              onChange={(e) => updateSetting('appearance', 'theme', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background"
            >
              <option value="system">System</option>
              <option value="bluish-purple-cricket">Bluish Purple</option>
              <option value="exquisite-turquoise-giraffe">Turquoise</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}