'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ConfigSettings } from '@/components/dashboard/types/config'

interface RugCheckTabProps {
  settings: ConfigSettings;
  updateSetting: (category: keyof ConfigSettings, key: string, value: string | number | boolean | string[]) => void;
}

export function RugCheckTab({ settings, updateSetting }: RugCheckTabProps): React.ReactElement {
  return (
    <div className="bg-card/50 rounded-lg p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* General Settings */}
        <div>
          <h3 className="text-lg font-semibold border-b pb-2">General Settings</h3>
          <div className="space-y-3 mt-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="verboseLog">Verbose Logging</Label>
              <Switch 
                id="verboseLog" 
                checked={settings.rugCheck.verboseLog}
                onCheckedChange={(checked) => updateSetting('rugCheck', 'verboseLog', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="simulationMode">Simulation Mode</Label>
              <Switch 
                id="simulationMode" 
                checked={settings.rugCheck.simulationMode}
                onCheckedChange={(checked) => updateSetting('rugCheck', 'simulationMode', checked)}
              />
            </div>
          </div>
        </div>
        
        {/* Security Checks */}
        <div>
          <h3 className="text-lg font-semibold border-b pb-2">Security Checks</h3>
          <div className="space-y-3 mt-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="allowMintAuthority">Allow Mint Authority</Label>
              <Switch 
                id="allowMintAuthority" 
                checked={settings.rugCheck.allowMintAuthority}
                onCheckedChange={(checked) => updateSetting('rugCheck', 'allowMintAuthority', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="allowNotInitialized">Allow Not Initialized</Label>
              <Switch 
                id="allowNotInitialized" 
                checked={settings.rugCheck.allowNotInitialized}
                onCheckedChange={(checked) => updateSetting('rugCheck', 'allowNotInitialized', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="allowFreezeAuthority">Allow Freeze Authority</Label>
              <Switch 
                id="allowFreezeAuthority" 
                checked={settings.rugCheck.allowFreezeAuthority}
                onCheckedChange={(checked) => updateSetting('rugCheck', 'allowFreezeAuthority', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="allowRugged">Allow Rugged Tokens</Label>
              <Switch 
                id="allowRugged" 
                checked={settings.rugCheck.allowRugged}
                onCheckedChange={(checked) => updateSetting('rugCheck', 'allowRugged', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="allowMutable">Allow Mutable Metadata</Label>
              <Switch 
                id="allowMutable" 
                checked={settings.rugCheck.allowMutable}
                onCheckedChange={(checked) => updateSetting('rugCheck', 'allowMutable', checked)}
              />
            </div>
          </div>
        </div>
        
        {/* Token Filtering */}
        <div>
          <h3 className="text-lg font-semibold border-b pb-2">Token Filtering</h3>
          <div className="space-y-3 mt-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="blockReturningTokenNames">Block Returning Token Names</Label>
              <Switch 
                id="blockReturningTokenNames" 
                checked={settings.rugCheck.blockReturningTokenNames}
                onCheckedChange={(checked) => updateSetting('rugCheck', 'blockReturningTokenNames', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="blockReturningTokenCreators">Block Returning Token Creators</Label>
              <Switch 
                id="blockReturningTokenCreators" 
                checked={settings.rugCheck.blockReturningTokenCreators}
                onCheckedChange={(checked) => updateSetting('rugCheck', 'blockReturningTokenCreators', checked)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="blockSymbols">Blocked Symbols (comma-separated)</Label>
              <Input 
                id="blockSymbols" 
                value={settings.rugCheck.blockSymbols.join(', ')}
                onChange={(e) => updateSetting('rugCheck', 'blockSymbols', e.target.value.split(',').map(s => s.trim()))}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="blockNames">Blocked Names (comma-separated)</Label>
              <Input 
                id="blockNames" 
                value={settings.rugCheck.blockNames.join(', ')}
                onChange={(e) => updateSetting('rugCheck', 'blockNames', e.target.value.split(',').map(s => s.trim()))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="onlyContainString">Only Contain String</Label>
              <Switch 
                id="onlyContainString" 
                checked={settings.rugCheck.onlyContainString}
                onCheckedChange={(checked) => updateSetting('rugCheck', 'onlyContainString', checked)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="containString">Required Strings (comma-separated)</Label>
              <Input 
                id="containString" 
                value={settings.rugCheck.containString.join(', ')}
                onChange={(e) => updateSetting('rugCheck', 'containString', e.target.value.split(',').map(s => s.trim()))}
              />
            </div>
          </div>
        </div>
        
        {/* Holder Distribution */}
        <div>
          <h3 className="text-lg font-semibold border-b pb-2">Holder Distribution</h3>
          <div className="space-y-3 mt-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="allowInsiderTopholders">Allow Insider Top Holders</Label>
              <Switch 
                id="allowInsiderTopholders" 
                checked={settings.rugCheck.allowInsiderTopholders}
                onCheckedChange={(checked) => updateSetting('rugCheck', 'allowInsiderTopholders', checked)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="maxAllowedPctTopholders">Max % for Single Top Holder</Label>
              <Input 
                id="maxAllowedPctTopholders" 
                type="number" 
                value={isNaN(settings.rugCheck.maxAllowedPctTopholders) ? 0 : settings.rugCheck.maxAllowedPctTopholders}
                onChange={(e) => updateSetting('rugCheck', 'maxAllowedPctTopholders', parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="maxAllowedPctAllTopholders">Max % for All Top Holders</Label>
              <Input 
                id="maxAllowedPctAllTopholders" 
                type="number" 
                value={isNaN(settings.rugCheck.maxAllowedPctAllTopholders) ? 0 : settings.rugCheck.maxAllowedPctAllTopholders}
                onChange={(e) => updateSetting('rugCheck', 'maxAllowedPctAllTopholders', parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="excludeLpFromTopholders">Exclude LP from Top Holders</Label>
              <Switch 
                id="excludeLpFromTopholders" 
                checked={settings.rugCheck.excludeLpFromTopholders}
                onCheckedChange={(checked) => updateSetting('rugCheck', 'excludeLpFromTopholders', checked)}
              />
            </div>
          </div>
        </div>
        
        {/* Market Validation */}
        <div>
          <h3 className="text-lg font-semibold border-b pb-2">Market Validation</h3>
          <div className="space-y-3 mt-3">
            <div className="grid gap-2">
              <Label htmlFor="minTotalMarkets">Min Total Markets</Label>
              <Input 
                id="minTotalMarkets" 
                type="number" 
                value={settings.rugCheck.minTotalMarkets}
                onChange={(e) => updateSetting('rugCheck', 'minTotalMarkets', parseInt(e.target.value))}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="minTotalLpProviders">Min LP Providers</Label>
              <Input 
                id="minTotalLpProviders" 
                type="number" 
                value={isNaN(settings.rugCheck.minTotalLpProviders) ? 0 : settings.rugCheck.minTotalLpProviders}
                onChange={(e) => updateSetting('rugCheck', 'minTotalLpProviders', parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="minTotalMarketLiquidity">Min Market Liquidity</Label>
              <Input 
                id="minTotalMarketLiquidity" 
                type="number" 
                value={isNaN(settings.rugCheck.minTotalMarketLiquidity) ? 0 : settings.rugCheck.minTotalMarketLiquidity}
                onChange={(e) => updateSetting('rugCheck', 'minTotalMarketLiquidity', parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="maxTotalMarketLiquidity">Max Market Liquidity</Label>
              <Input 
                id="maxTotalMarketLiquidity" 
                type="number" 
                value={isNaN(settings.rugCheck.maxTotalMarketLiquidity) ? 0 : settings.rugCheck.maxTotalMarketLiquidity}
                onChange={(e) => updateSetting('rugCheck', 'maxTotalMarketLiquidity', parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="maxMarketcap">Max Market Cap ($)</Label>
              <Input 
                id="maxMarketcap" 
                type="number" 
                value={settings.rugCheck.maxMarketcap}
                onChange={(e) => updateSetting('rugCheck', 'maxMarketcap', parseInt(e.target.value))}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="maxPriceToken">Max Token Price ($)</Label>
              <Input 
                id="maxPriceToken" 
                type="number" 
                step="0.0001"
                value={isNaN(settings.rugCheck.maxPriceToken) ? 0 : settings.rugCheck.maxPriceToken}
                onChange={(e) => updateSetting('rugCheck', 'maxPriceToken', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>
        
        {/* Miscellaneous */}
        <div>
          <h3 className="text-lg font-semibold border-b pb-2">Miscellaneous</h3>
          <div className="space-y-3 mt-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="ignorePumpFun">Ignore Pump.fun Tokens</Label>
              <Switch 
                id="ignorePumpFun" 
                checked={settings.rugCheck.ignorePumpFun}
                onCheckedChange={(checked) => updateSetting('rugCheck', 'ignorePumpFun', checked)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="maxScore">Max Risk Score (0 to disable)</Label>
              <Input 
                id="maxScore" 
                type="number" 
                value={settings.rugCheck.maxScore}
                onChange={(e) => updateSetting('rugCheck', 'maxScore', parseInt(e.target.value))}
              />
            </div>
            
            <div className="space-y-3">
              <Label className="text-base">Legacy Risk Checks</Label>
              <div className="grid gap-2 pl-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="freezeAuthority" className="text-sm">Freeze Authority still enabled</Label>
                  <Switch 
                    id="freezeAuthority" 
                    checked={settings.rugCheck.legacyNotAllowed.includes("Freeze Authority still enabled")}
                    onCheckedChange={(checked) => {
                      const newLegacyChecks = [...settings.rugCheck.legacyNotAllowed];
                      const checkValue = "Freeze Authority still enabled";
                      if (checked && !newLegacyChecks.includes(checkValue)) {
                        newLegacyChecks.push(checkValue);
                      } else if (!checked) {
                        const index = newLegacyChecks.indexOf(checkValue);
                        if (index !== -1) newLegacyChecks.splice(index, 1);
                      }
                      updateSetting('rugCheck', 'legacyNotAllowed', newLegacyChecks);
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="singleHolder" className="text-sm">Single holder ownership</Label>
                  <Switch 
                    id="singleHolder" 
                    checked={settings.rugCheck.legacyNotAllowed.includes("Single holder ownership")}
                    onCheckedChange={(checked) => {
                      const newLegacyChecks = [...settings.rugCheck.legacyNotAllowed];
                      const checkValue = "Single holder ownership";
                      if (checked && !newLegacyChecks.includes(checkValue)) {
                        newLegacyChecks.push(checkValue);
                      } else if (!checked) {
                        const index = newLegacyChecks.indexOf(checkValue);
                        if (index !== -1) newLegacyChecks.splice(index, 1);
                      }
                      updateSetting('rugCheck', 'legacyNotAllowed', newLegacyChecks);
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="copycatToken" className="text-sm">Copycat token</Label>
                  <Switch 
                    id="copycatToken" 
                    checked={settings.rugCheck.legacyNotAllowed.includes("Copycat token")}
                    onCheckedChange={(checked) => {
                      const newLegacyChecks = [...settings.rugCheck.legacyNotAllowed];
                      const checkValue = "Copycat token";
                      if (checked && !newLegacyChecks.includes(checkValue)) {
                        newLegacyChecks.push(checkValue);
                      } else if (!checked) {
                        const index = newLegacyChecks.indexOf(checkValue);
                        if (index !== -1) newLegacyChecks.splice(index, 1);
                      }
                      updateSetting('rugCheck', 'legacyNotAllowed', newLegacyChecks);
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="highHolderConcentration" className="text-sm">High holder concentration</Label>
                  <Switch 
                    id="highHolderConcentration" 
                    checked={settings.rugCheck.legacyNotAllowed.includes("High holder concentration")}
                    onCheckedChange={(checked) => {
                      const newLegacyChecks = [...settings.rugCheck.legacyNotAllowed];
                      const checkValue = "High holder concentration";
                      if (checked && !newLegacyChecks.includes(checkValue)) {
                        newLegacyChecks.push(checkValue);
                      } else if (!checked) {
                        const index = newLegacyChecks.indexOf(checkValue);
                        if (index !== -1) newLegacyChecks.splice(index, 1);
                      }
                      updateSetting('rugCheck', 'legacyNotAllowed', newLegacyChecks);
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="largeLpUnlocked" className="text-sm">Large Amount of LP Unlocked</Label>
                  <Switch 
                    id="largeLpUnlocked" 
                    checked={settings.rugCheck.legacyNotAllowed.includes("Large Amount of LP Unlocked")}
                    onCheckedChange={(checked) => {
                      const newLegacyChecks = [...settings.rugCheck.legacyNotAllowed];
                      const checkValue = "Large Amount of LP Unlocked";
                      if (checked && !newLegacyChecks.includes(checkValue)) {
                        newLegacyChecks.push(checkValue);
                      } else if (!checked) {
                        const index = newLegacyChecks.indexOf(checkValue);
                        if (index !== -1) newLegacyChecks.splice(index, 1);
                      }
                      updateSetting('rugCheck', 'legacyNotAllowed', newLegacyChecks);
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="lowLiquidity" className="text-sm">Low Liquidity</Label>
                  <Switch 
                    id="lowLiquidity" 
                    checked={settings.rugCheck.legacyNotAllowed.includes("Low Liquidity")}
                    onCheckedChange={(checked) => {
                      const newLegacyChecks = [...settings.rugCheck.legacyNotAllowed];
                      const checkValue = "Low Liquidity";
                      if (checked && !newLegacyChecks.includes(checkValue)) {
                        newLegacyChecks.push(checkValue);
                      } else if (!checked) {
                        const index = newLegacyChecks.indexOf(checkValue);
                        if (index !== -1) newLegacyChecks.splice(index, 1);
                      }
                      updateSetting('rugCheck', 'legacyNotAllowed', newLegacyChecks);
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="lowLpProviders" className="text-sm">Low amount of LP Providers</Label>
                  <Switch 
                    id="lowLpProviders" 
                    checked={settings.rugCheck.legacyNotAllowed.includes("Low amount of LP Providers")}
                    onCheckedChange={(checked) => {
                      const newLegacyChecks = [...settings.rugCheck.legacyNotAllowed];
                      const checkValue = "Low amount of LP Providers";
                      if (checked && !newLegacyChecks.includes(checkValue)) {
                        newLegacyChecks.push(checkValue);
                      } else if (!checked) {
                        const index = newLegacyChecks.indexOf(checkValue);
                        if (index !== -1) newLegacyChecks.splice(index, 1);
                      }
                      updateSetting('rugCheck', 'legacyNotAllowed', newLegacyChecks);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
