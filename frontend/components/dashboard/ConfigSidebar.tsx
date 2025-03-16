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

// Default settings
const defaultSettings: ConfigSettings = {
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
  },
  rugCheck: {
    verboseLog: false,
    simulationMode: true,
    allowMintAuthority: false,
    allowNotInitialized: false,
    allowFreezeAuthority: false,
    allowRugged: false,
    allowMutable: true,
    blockReturningTokenNames: false,
    blockReturningTokenCreators: false,
    blockSymbols: ["XXX"],
    blockNames: ["XXX"],
    onlyContainString: false,
    containString: ["AI", "GPT", "AGENT"],
    allowInsiderTopholders: true,
    maxAllowedPctTopholders: 50,
    maxAllowedPctAllTopholders: 50,
    excludeLpFromTopholders: true,
    minTotalMarkets: 0,
    minTotalLpProviders: 0,
    minTotalMarketLiquidity: 10000,
    maxTotalMarketLiquidity: 100000,
    maxMarketcap: 25000000,
    maxPriceToken: 0.001,
    ignorePumpFun: false,
    maxScore: 30000,
    legacyNotAllowed: [
      "Freeze Authority still enabled",
      "Single holder ownership",
      "Copycat token"
    ]
  }
};

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
  rugCheck: {
    verboseLog: boolean;
    simulationMode: boolean;
    allowMintAuthority: boolean;
    allowNotInitialized: boolean;
    allowFreezeAuthority: boolean;
    allowRugged: boolean;
    allowMutable: boolean;
    blockReturningTokenNames: boolean;
    blockReturningTokenCreators: boolean;
    blockSymbols: string[];
    blockNames: string[];
    onlyContainString: boolean;
    containString: string[];
    allowInsiderTopholders: boolean;
    maxAllowedPctTopholders: number;
    maxAllowedPctAllTopholders: number;
    excludeLpFromTopholders: boolean;
    minTotalMarkets: number;
    minTotalLpProviders: number;
    minTotalMarketLiquidity: number;
    maxTotalMarketLiquidity: number;
    maxMarketcap: number;
    maxPriceToken: number;
    ignorePumpFun: boolean;
    maxScore: number;
    legacyNotAllowed: string[];
  };
}

export function ConfigSidebar({ isOpen, onClose }: ConfigSidebarProps): React.ReactElement {
  // State for settings
  const [settings, setSettings] = useState<ConfigSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Fetch settings from API
  useEffect(() => {
    let mounted = true;
    
    const fetchSettings = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/settings');
        
        if (!mounted) return;
        
        if (!response.ok) {
          throw new Error(`Failed to fetch settings: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        if (!mounted) return;
        
        setSettings(data);
        setOriginalSettings(data);
      } catch (err) {
        console.error('Error fetching settings:', err);
        if (!mounted) return;
        
        setError('Failed to load settings. Using default values.');
        setSettings(defaultSettings);
        setOriginalSettings(defaultSettings);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchSettings();
    
    return () => {
      mounted = false;
    };
  }, [isOpen]); // Only depend on isOpen

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
  const saveChanges = async () => {
    setIsSaving(true);
    setSaveError(null);
    
    try {
      // Send settings to the API
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save settings: ${response.status} ${response.statusText}`);
      }
      
      // Get the response data
      const data = await response.json();
      console.log('Settings saved successfully:', data);
      
      // Update original settings to match current settings
      setOriginalSettings({...settings});
      setHasChanges(false);
      
      // Close the modal
      onClose();
    } catch (err) {
      console.error('Error saving settings:', err);
      setSaveError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
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
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-[40px] bg-black/70">
        <div className="bg-card rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Loading settings...</p>
        </div>
      </div>
    );
  }

  // Show error message if there was an error saving
  if (saveError) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-[40px] bg-black/70">
        <div className="bg-card rounded-lg p-8 text-center max-w-md">
          <div className="text-destructive text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold mb-2">Error Saving Settings</h3>
          <p className="mb-6 text-muted-foreground">{saveError}</p>
          <div className="flex justify-center">
            <Button onClick={() => setSaveError(null)}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

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
              <TabsTrigger value="rugCheck" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                Rug Check
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
            
            {/* Rug Check Settings */}
            <TabsContent value="rugCheck" className="mt-6">
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
                          value={settings.rugCheck.maxAllowedPctTopholders}
                          onChange={(e) => updateSetting('rugCheck', 'maxAllowedPctTopholders', parseInt(e.target.value))}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="maxAllowedPctAllTopholders">Max % for All Top Holders</Label>
                        <Input 
                          id="maxAllowedPctAllTopholders" 
                          type="number" 
                          value={settings.rugCheck.maxAllowedPctAllTopholders}
                          onChange={(e) => updateSetting('rugCheck', 'maxAllowedPctAllTopholders', parseInt(e.target.value))}
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
                          value={settings.rugCheck.minTotalLpProviders}
                          onChange={(e) => updateSetting('rugCheck', 'minTotalLpProviders', parseInt(e.target.value))}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="minTotalMarketLiquidity">Min Market Liquidity</Label>
                        <Input 
                          id="minTotalMarketLiquidity" 
                          type="number" 
                          value={settings.rugCheck.minTotalMarketLiquidity}
                          onChange={(e) => updateSetting('rugCheck', 'minTotalMarketLiquidity', parseInt(e.target.value))}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="maxTotalMarketLiquidity">Max Market Liquidity</Label>
                        <Input 
                          id="maxTotalMarketLiquidity" 
                          type="number" 
                          value={settings.rugCheck.maxTotalMarketLiquidity}
                          onChange={(e) => updateSetting('rugCheck', 'maxTotalMarketLiquidity', parseInt(e.target.value))}
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
                          value={settings.rugCheck.maxPriceToken}
                          onChange={(e) => updateSetting('rugCheck', 'maxPriceToken', parseFloat(e.target.value))}
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
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Footer */}
        <div className="bg-card p-4 border-t border-border flex justify-end space-x-2 sticky bottom-0">
          {error && (
            <div className="mr-auto text-sm text-destructive">
              {error}
            </div>
          )}
          <Button variant="outline" onClick={cancelChanges}>
            Cancel
          </Button>
          <Button 
            onClick={saveChanges} 
            disabled={!hasChanges || isSaving}
            className={(!hasChanges || isSaving) ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {isSaving ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Saving...
              </>
            ) : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
