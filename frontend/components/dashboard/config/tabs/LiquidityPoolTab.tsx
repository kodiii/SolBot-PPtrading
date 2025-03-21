'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfigSettings } from '@/components/dashboard/types/config'

interface LiquidityPoolTabProps {
  settings: ConfigSettings;
  updateSetting: (category: keyof ConfigSettings, key: string, value: string | number | boolean | string[]) => void;
}

export function LiquidityPoolTab({ settings, updateSetting }: LiquidityPoolTabProps): React.ReactElement {
  return (
    <div className="bg-card/50 rounded-lg p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h3 className="text-lg font-semibold border-b pb-2">Liquidity Pool Configuration</h3>
        <div className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="radiyumProgramId">Radiyum Program ID</Label>
            <Input 
              id="radiyumProgramId" 
              type="text" 
              value={settings.liquidityPool.radiyumProgramId}
              onChange={(e) => updateSetting('liquidityPool', 'radiyumProgramId', e.target.value)}
              placeholder="Enter Radiyum program ID"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="pumpFunProgramId">PumpFun Program ID</Label>
            <Input 
              id="pumpFunProgramId" 
              type="text" 
              value={settings.liquidityPool.pumpFunProgramId}
              onChange={(e) => updateSetting('liquidityPool', 'pumpFunProgramId', e.target.value)}
              placeholder="Enter PumpFun program ID"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="wsolPcMint">WSOL PC Mint</Label>
            <Input 
              id="wsolPcMint" 
              type="text" 
              value={settings.liquidityPool.wsolPcMint}
              onChange={(e) => updateSetting('liquidityPool', 'wsolPcMint', e.target.value)}
              placeholder="Enter WSOL PC mint address"
            />
          </div>
        </div>
      </div>
    </div>
  )
}