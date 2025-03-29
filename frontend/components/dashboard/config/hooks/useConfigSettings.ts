'use client'

import { useState, useEffect } from 'react'
import { ConfigSettings, defaultSettings } from '@/components/dashboard/types/config'

export interface UseConfigSettingsReturn {
  settings: ConfigSettings;
  originalSettings: ConfigSettings;
  isLoading: boolean;
  error: string | null;
  isSaving: boolean;
  saveError: string | null;
  hasChanges: boolean;
  isResetting: boolean;
  isRestarting: boolean;
  restartError: string | null;
  showRestartNotice: boolean;
  restartMessage: string;
  updateSetting: (category: keyof ConfigSettings, key: string, value: string | number | boolean | string[]) => void;
  saveChanges: () => Promise<void>;
  cancelChanges: () => void;
  resetToDefault: () => Promise<void>;
  restartServer: () => Promise<void>;
  setShowRestartNotice: (show: boolean) => void;
  setSaveError: (error: string | null) => void;
}

export function useConfigSettings(isOpen: boolean, onClose: () => void): UseConfigSettingsReturn {
  // State for settings
  const [settings, setSettings] = useState<ConfigSettings>(defaultSettings);
  const [originalSettings, setOriginalSettings] = useState<ConfigSettings>({...defaultSettings});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  // State for restart notification
  const [showRestartNotice, setShowRestartNotice] = useState(false);
  const [restartMessage, setRestartMessage] = useState('');
  const [isRestarting, setIsRestarting] = useState(false);
  const [restartError, setRestartError] = useState<string | null>(null);

  // Fetch settings from API
  useEffect(() => {
    let mounted = true;
    
    const fetchSettings = async (): Promise<void> => {
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

  // Check for changes when settings are updated
  useEffect(() => {
    const checkChanges = (): void => {
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
    value: string | number | boolean | string[]
  ): void => {
    // Ensure numeric values are valid numbers
    if (typeof value === 'number' && isNaN(value)) {
      value = 0; // Default to 0 for NaN values
    }
    
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  // Handle saving changes
  const saveChanges = async (): Promise<void> => {
    setIsSaving(true);
    setSaveError(null);
    
    try {
      // Create a sanitized copy of settings to ensure no NaN values
      const sanitizedSettings = JSON.parse(JSON.stringify(settings, (_, value) => {
        // Replace any NaN values with 0
        if (typeof value === 'number' && isNaN(value)) {
          return 0;
        }
        return value;
      }));
      
      // Send sanitized settings to the API
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedSettings),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save settings: ${response.status} ${response.statusText}`);
      }
      
      // Get the response data
      const data = await response.json();
      console.log('Settings saved successfully:', data);
      
      // Update original settings to match current settings
      setOriginalSettings({...sanitizedSettings});
      setSettings({...sanitizedSettings});
      setHasChanges(false);
      
      // Check if restart is required
      if (data.requiresRestart) {
        setRestartMessage(data.message || 'Please restart the bot for changes to take effect.');
        setShowRestartNotice(true);
      } else {
        // Close the modal
        onClose();
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setSaveError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle canceling changes
  const cancelChanges = (): void => {
    // Reset settings to original values
    setSettings({...originalSettings});
    onClose();
  };

  // Handle resetting to default values
  const resetToDefault = async (): Promise<void> => {
    if (!confirm('Are you sure you want to reset all settings to default values? This cannot be undone.')) {
      return;
    }
    
    setIsResetting(true);
    setSaveError(null);
    
    try {
      // Call the reset API endpoint
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to reset settings: ${response.status} ${response.statusText}`);
      }
      
      // Get the response data
      const data = await response.json();
      console.log('Settings reset successfully:', data);
      
      // Update settings with the reset values
      if (data.settings) {
        setSettings({...data.settings});
        setOriginalSettings({...data.settings});
        setHasChanges(false);
      }
      
      // Show success message
      alert('Settings have been reset to default values.');
      
      // Check if restart is required
      if (data.requiresRestart) {
        setRestartMessage(data.message || 'Please restart the bot for changes to take effect.');
        setShowRestartNotice(true);
      }
    } catch (err) {
      console.error('Error resetting settings:', err);
      setSaveError('Failed to reset settings. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  // Function to restart the server
  const restartServer = async (): Promise<void> => {
    setIsRestarting(true);
    setRestartError(null);
    
    try {
      // Call the frontend API endpoint which will proxy to the backend
      // Use a timeout to handle the case where the server exits before responding
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        const response = await fetch('/api/restart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to restart server: ${response.status} ${response.statusText}`);
        }
        
        // Successfully sent the restart request
        console.log('Restart request sent successfully');
      } catch (error) {
        // If the error is an AbortError or a network error, it might be because
        // the server is already restarting, which is actually what we want
        if (
          error && 
          typeof error === 'object' && 
          (
            ('name' in error && error.name === 'AbortError') || 
            error instanceof TypeError
          )
        ) {
          console.log('Server connection closed - this is expected during restart');
          // Continue with the restart process
        } else {
          // For other errors, rethrow
          throw error;
        }
      }
      
      // Server should be restarting now, show a message
      setRestartMessage('Server restart initiated. Please wait a moment...');
      
      // Close the modal after a delay
      setTimeout(() => {
        setShowRestartNotice(false);
        onClose();
        // Reload the page after a delay to connect to the restarted server
        setTimeout(() => {
          window.location.reload();
        }, 8000); // Increased delay to give server more time to restart
      }, 2000);
      
    } catch (err) {
      console.error('Error restarting server:', err);
      setRestartError('Failed to restart server. Please try again later.');
    } finally {
      setIsRestarting(false);
    }
    
    return;
  };

  // Return all the state and functions
  return {
    settings,
    originalSettings,
    isLoading,
    error,
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
  };
}