'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ConfigSidebarProps {
  isOpen: boolean
  onClose: () => void
}

// Define the configuration settings interface
interface ConfigSettings {
  paperTrading: {
    initialBalance: number;
    dashboardRefresh: number;
    recentTradesLimit: number;
    verboseLogging: boolean;
  };
  priceValidation: {
    enabled: boolean;
    windowSize: number;
    maxDeviation: number;
    minDataPoints: number;
    fallbackToSingleSource: boolean;
  };
  swap: {
    amount: number;
    slippageBps: number;
    maxOpenPositions: number;
  };
  strategies: {
    liquidityDropEnabled: boolean;
    threshold: number;
  };
}

export function ConfigSidebar({ isOpen, onClose }: ConfigSidebarProps): React.ReactElement {
  // Initialize settings with default values
  const [settings, setSettings] = useState<ConfigSettings>({
    paperTrading: {
      initialBalance: 5,
      dashboardRefresh: 2000,
      recentTradesLimit: 12,
      verboseLogging: false
    },
    priceValidation: {
      enabled: true,
      windowSize: 12,
      maxDeviation: 0.05,
      minDataPoints: 6,
      fallbackToSingleSource: true
    },
    swap: {
      amount: 500000000,
      slippageBps: 200,
      maxOpenPositions: 3
    },
    strategies: {
      liquidityDropEnabled: true,
      threshold: 20
    }
  });

  // Create a copy of settings for tracking changes
  const [originalSettings, setOriginalSettings] = useState<ConfigSettings>({...settings});
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('paperTrading');

  // Check for changes when settings are updated
  useEffect(() => {
    const checkChanges = () => {
      const settingsStr = JSON.stringify(settings);
      const originalStr = JSON.stringify(originalSettings);
      setHasChanges(settingsStr !== originalStr);
    };
    
    checkChanges();
  }, [settings, originalSettings]);

  // Update a specific setting
  const updateSetting = (
    category: keyof ConfigSettings, 
    key: string, 
    value: any
  ) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  // Handle saving changes
  const saveChanges = () => {
    // Here you would typically send the settings to an API
    console.log('Saving settings:', settings);
    
    // Update original settings to match current settings
    setOriginalSettings({...settings});
    setHasChanges(false);
    
    // Close the modal
    onClose();
  };

  // Handle canceling changes
  const cancelChanges = () => {
    // Reset settings to original values
    setSettings({...originalSettings});
    onClose();
  };

  // Handle ESC key press
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isOpen, onClose]);

  if (!isOpen) return <></>;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-[40px] bg-black/70 transition-all duration-500" 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        WebkitBackdropFilter: 'blur(40px)',
        backdropFilter: 'blur(40px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      
      {/* Modal */}
      <div 
        className="relative bg-card rounded-lg shadow-xl w-[90%] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300 ease-out will-change-[opacity,transform]"
        style={{ 
          position: 'relative', 
          zIndex: 10000,
          opacity: isOpen ? 1 : 0,
          transform: `scale(${isOpen ? 1 : 0.95}) translateY(${isOpen ? '0px' : '10px'})`
        }}
      >
        {/* Header */}
        <div className="bg-card p-4 border-b border-border flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold">Configuration</h2>
            <span className="bg-primary/10 text-primary text-xs font-medium rounded px-2 py-1">Settings</span>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm">
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
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted/50 p-1">
              <TabsTrigger value="paperTrading" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                Paper Trading
              </TabsTrigger>
              <TabsTrigger value="priceValidation" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                Price Validation
              </TabsTrigger>
              <TabsTrigger value="swapSettings" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                Swap Settings
              </TabsTrigger>
              <TabsTrigger value="strategies" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                Strategies
              </TabsTrigger>
            </TabsList>
            
            {/* Paper Trading Settings */}
            <TabsContent value="paperTrading" className="mt-6">
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
            </TabsContent>
            
            {/* Price Validation Settings */}
            <TabsContent value="priceValidation" className="mt-6">
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
                        value={settings.priceValidation.minDataPoints}
                        onChange={(e) => updateSetting('priceValidation', 'minDataPoints', parseInt(e.target.value))}
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
            </TabsContent>
            
            {/* Swap Settings */}
            <TabsContent value="swapSettings" className="mt-6">
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
                        value={settings.swap.maxOpenPositions}
                        onChange={(e) => updateSetting('swap', 'maxOpenPositions', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Strategies Settings */}
            <TabsContent value="strategies" className="mt-6">
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
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Footer */}
        <div className="bg-card p-4 border-t border-border flex justify-end space-x-2 sticky bottom-0">
          <Button variant="outline" onClick={cancelChanges}>
            Cancel
          </Button>
          <Button 
            onClick={saveChanges} 
            disabled={!hasChanges}
            className={!hasChanges ? 'opacity-50 cursor-not-allowed' : ''}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
