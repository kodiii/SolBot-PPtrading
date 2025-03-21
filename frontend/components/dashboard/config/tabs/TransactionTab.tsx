'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfigSettings } from '@/components/dashboard/types/config'

interface TransactionTabProps {
  settings: ConfigSettings;
  updateSetting: (category: keyof ConfigSettings, key: string, value: string | number | boolean | string[]) => void;
}

export function TransactionTab({ settings, updateSetting }: TransactionTabProps): React.ReactElement {
  return (
    <div className="bg-card/50 rounded-lg p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h3 className="text-lg font-semibold border-b pb-2">Transaction Configuration</h3>
        <div className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="fetchTxMaxRetries">Max Retries</Label>
            <Input 
              id="fetchTxMaxRetries" 
              type="number" 
              value={settings.tx.fetchTxMaxRetries}
              onChange={(e) => updateSetting('tx', 'fetchTxMaxRetries', parseInt(e.target.value))}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="fetchTxInitialDelay">Initial Delay (ms)</Label>
            <Input 
              id="fetchTxInitialDelay" 
              type="number" 
              value={settings.tx.fetchTxInitialDelay}
              onChange={(e) => updateSetting('tx', 'fetchTxInitialDelay', parseInt(e.target.value))}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="swapTxInitialDelay">Swap Initial Delay (ms)</Label>
            <Input 
              id="swapTxInitialDelay" 
              type="number" 
              value={settings.tx.swapTxInitialDelay}
              onChange={(e) => updateSetting('tx', 'swapTxInitialDelay', parseInt(e.target.value))}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="getTimeout">Timeout (ms)</Label>
            <Input 
              id="getTimeout" 
              type="number" 
              value={settings.tx.getTimeout}
              onChange={(e) => updateSetting('tx', 'getTimeout', parseInt(e.target.value))}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="concurrentTransactions">Concurrent Transactions</Label>
            <Input 
              id="concurrentTransactions" 
              type="number" 
              value={settings.tx.concurrentTransactions}
              onChange={(e) => updateSetting('tx', 'concurrentTransactions', parseInt(e.target.value))}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="retryDelay">Retry Delay (ms)</Label>
            <Input 
              id="retryDelay" 
              type="number" 
              value={settings.tx.retryDelay}
              onChange={(e) => updateSetting('tx', 'retryDelay', parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>
    </div>
  )
}