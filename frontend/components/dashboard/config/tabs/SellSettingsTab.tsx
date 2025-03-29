'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ConfigSettings } from '@/components/dashboard/types/config'

interface SellSettingsTabProps {
  settings: ConfigSettings;
  updateSetting: (category: keyof ConfigSettings, key: string, value: string | number | boolean | string[]) => void;
}

export function SellSettingsTab({ settings, updateSetting }: SellSettingsTabProps): React.ReactElement {
  return (
    <div className="bg-card/50 rounded-lg p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h3 className="text-lg font-semibold border-b pb-2">Sell Configuration</h3>
        <div className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="priceSource">Price Source</Label>
            <select
              id="priceSource"
              value={settings.sell.priceSource}
              onChange={(e) => updateSetting('sell', 'priceSource', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background"
            >
              <option value="dex">DEX</option>
              <option value="jup">JUP</option>
            </select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="prioFeeMaxLamports">Priority Fee (lamports)</Label>
            <Input 
              id="prioFeeMaxLamports" 
              type="number" 
              value={settings.sell.prioFeeMaxLamports}
              onChange={(e) => updateSetting('sell', 'prioFeeMaxLamports', parseInt(e.target.value))}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="prioLevel">Priority Level</Label>
            <select
              id="prioLevel"
              value={settings.sell.prioLevel}
              onChange={(e) => updateSetting('sell', 'prioLevel', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="slippageBps">Slippage (basis points)</Label>
            <Input 
              id="slippageBps" 
              type="number" 
              value={settings.sell.slippageBps}
              onChange={(e) => updateSetting('sell', 'slippageBps', parseInt(e.target.value))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="autoSell">Auto Sell</Label>
            <Switch 
              id="autoSell" 
              checked={settings.sell.autoSell}
              onCheckedChange={(checked) => updateSetting('sell', 'autoSell', checked)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="stopLossPercent">Stop Loss (%)</Label>
            <Input 
              id="stopLossPercent" 
              type="number" 
              value={settings.sell.stopLossPercent}
              onChange={(e) => updateSetting('sell', 'stopLossPercent', parseInt(e.target.value))}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="takeProfitPercent">Take Profit (%)</Label>
            <Input 
              id="takeProfitPercent" 
              type="number" 
              value={settings.sell.takeProfitPercent}
              onChange={(e) => updateSetting('sell', 'takeProfitPercent', parseInt(e.target.value))}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="trackPublicWallet">Track Public Wallet</Label>
            <Input 
              id="trackPublicWallet" 
              type="text" 
              value={settings.sell.trackPublicWallet}
              onChange={(e) => updateSetting('sell', 'trackPublicWallet', e.target.value)}
              placeholder="Enter wallet address"
            />
          </div>
        </div>
      </div>
    </div>
  )
}