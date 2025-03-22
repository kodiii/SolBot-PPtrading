'use client'

import React, { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useConfigSettings } from '@/components/dashboard/config/hooks/useConfigSettings'
import { PaperTradingTab } from '@/components/dashboard/config/tabs/PaperTradingTab'
import { PriceValidationTab } from '@/components/dashboard/config/tabs/PriceValidationTab'
import { SwapSettingsTab } from '@/components/dashboard/config/tabs/SwapSettingsTab'
import { StrategiesTab } from '@/components/dashboard/config/tabs/StrategiesTab'
import { RugCheckTab } from '@/components/dashboard/config/tabs/RugCheckTab'
import { AppearanceTab } from '@/components/dashboard/config/tabs/AppearanceTab'
import { SellSettingsTab } from '@/components/dashboard/config/tabs/SellSettingsTab'
import { LiquidityPoolTab } from '@/components/dashboard/config/tabs/LiquidityPoolTab'
import { TransactionTab } from '@/components/dashboard/config/tabs/TransactionTab'

interface ConfigModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ConfigModal({ isOpen, onClose }: ConfigModalProps): React.ReactElement {
  const {
    settings,
    isLoading,
    isSaving,
    saveError,
    hasChanges,
    isResetting,
    isRestarting,
    restartError,
    showRestartNotice,
    restartMessage,
    updateSetting,
    saveChanges,
    cancelChanges,
    resetToDefault,
    restartServer,
    setShowRestartNotice,
    setSaveError
  } = useConfigSettings(isOpen, onClose);
  
  const [activeTab, setActiveTab] = React.useState('paperTrading');

  // Handle ESC key press
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent): void => {
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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-[5px] bg-black/70">
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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-[5px] bg-black/70">
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

  // Show restart notification if settings were saved but require restart
  if (showRestartNotice) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-[5px] bg-black/70">
        <div className="bg-card rounded-lg p-8 text-center max-w-md">
          <div className="text-amber-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold mb-2">Restart Required</h3>
          <p className="mb-6 text-muted-foreground">{restartMessage}</p>
          
          {restartError && (
            <p className="text-destructive mb-4">{restartError}</p>
          )}
          
          <div className="flex justify-center space-x-4">
            <Button 
              variant="outline"
              onClick={() => {
                setShowRestartNotice(false);
                onClose();
              }}
            >
              Close
            </Button>
            
            <Button 
              onClick={restartServer}
              disabled={isRestarting}
              className={isRestarting ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {isRestarting ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Restarting...
                </>
              ) : 'Restart Server'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-[5px] bg-black/70 transition-all duration-500"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        WebkitBackdropFilter: 'blur(5px)',
        backdropFilter: 'blur(5px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      
      {/* Modal */}
      <div 
        className="relative bg-card rounded-lg shadow-xl w-[90%] max-w-5xl max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300 ease-out will-change-[opacity,transform]"
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
              <TabsTrigger value="liquidityPool" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                Liquidity Pool
              </TabsTrigger>
              <TabsTrigger value="transaction" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                Transaction
              </TabsTrigger>
              <TabsTrigger value="paperTrading" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                Paper Trading
              </TabsTrigger>
              <TabsTrigger value="priceValidation" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                Price Validation
              </TabsTrigger>
              <TabsTrigger value="swapSettings" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                Swap
              </TabsTrigger>
              <TabsTrigger value="sell" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                Sell
              </TabsTrigger>
              <TabsTrigger value="strategies" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                Strategies
              </TabsTrigger>
              <TabsTrigger value="rugCheck" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                Rug Check
              </TabsTrigger>
              <TabsTrigger value="appearance" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                Appearance
              </TabsTrigger>
            </TabsList>
            
            {/* Paper Trading Settings */}
            <TabsContent value="paperTrading" className="mt-6">
              <PaperTradingTab settings={settings} updateSetting={updateSetting} />
            </TabsContent>
            
            {/* Price Validation Settings */}
            <TabsContent value="priceValidation" className="mt-6">
              <PriceValidationTab settings={settings} updateSetting={updateSetting} />
            </TabsContent>
            
            {/* Swap Settings */}
            <TabsContent value="swapSettings" className="mt-6">
              <SwapSettingsTab settings={settings} updateSetting={updateSetting} />
            </TabsContent>
            
            {/* Strategies Settings */}
            <TabsContent value="strategies" className="mt-6">
              <StrategiesTab settings={settings} updateSetting={updateSetting} />
            </TabsContent>
            
            {/* Appearance Settings */}
            <TabsContent value="appearance" className="mt-6">
              <AppearanceTab settings={settings} updateSetting={updateSetting} />
            </TabsContent>
            <TabsContent value="sell" className="mt-4">
              <SellSettingsTab settings={settings} updateSetting={updateSetting} />
            </TabsContent>
            <TabsContent value="liquidityPool" className="mt-4">
              <LiquidityPoolTab settings={settings} updateSetting={updateSetting} />
            </TabsContent>
            <TabsContent value="transaction" className="mt-4">
              <TransactionTab settings={settings} updateSetting={updateSetting} />
            </TabsContent>
            
            {/* Rug Check Settings */}
            <TabsContent value="rugCheck" className="mt-6">
              <RugCheckTab settings={settings} updateSetting={updateSetting} />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Footer */}
        <div className="bg-card p-4 border-t border-border flex justify-between sticky bottom-0">
          {/* Left side */}
          <div className="flex items-center">
            <Button 
              variant="outline" 
              onClick={resetToDefault}
              disabled={isResetting}
              className="text-destructive border-destructive hover:bg-destructive/10"
            >
              {isResetting ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Resetting...
                </>
              ) : 'Reset to Default'}
            </Button>
          </div>
          
          {/* Right side */}
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <span className="text-xs text-amber-500 mr-2">Unsaved changes</span>
            )}
            
            <Button 
              variant="outline" 
              onClick={cancelChanges}
              disabled={isSaving || !hasChanges}
            >
              Cancel
            </Button>
            
            <Button 
              onClick={saveChanges}
              disabled={isSaving || !hasChanges}
              className={isSaving ? 'opacity-50 cursor-not-allowed' : ''}
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
    </div>
  );
}
