import { SettingsService, AppSettings, defaultSettings } from '../settings-service';
import { ConnectionManager } from '../../db/connection_manager';
import fs from 'fs';
import path from 'path';

describe('SettingsService', () => {
  const TEST_DB_PATH = path.resolve(__dirname, './test_settings.db');
  let settingsService: SettingsService;
  let connectionManager: ConnectionManager;

  beforeAll(async () => {
    // Ensure test database directory exists
    const dbDir = path.dirname(TEST_DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Initialize connection manager first
    connectionManager = ConnectionManager.getInstance(TEST_DB_PATH);
    await connectionManager.initialize();
  });

  beforeEach(async () => {
    // Delete test database if it exists
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    // Reset the SettingsService instance
    SettingsService.resetInstance();
    
    // Create and initialize a new service instance
    settingsService = SettingsService.getInstance(TEST_DB_PATH);
    await settingsService.initialize();
  });

  afterEach(async () => {
    // Close all connections
    await connectionManager.closeAll();
  });

  afterAll(async () => {
    // Clean up the test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  describe('initialization', () => {
    it('should create database with default settings when initialized', async () => {
      const settings = await settingsService.getSettings();
      expect(settings).toEqual(defaultSettings);
    });
  });

  describe('saveSettings', () => {
    it('should save settings to database', async () => {
      // Create test settings by modifying default settings
      const testSettings: AppSettings = {
        ...defaultSettings,
        paperTrading: {
          ...defaultSettings.paperTrading,
          initialBalance: 10,
          dashboardRefresh: 5000
        }
      };

      // Save the settings
      await settingsService.saveSettings(testSettings);

      // Read settings back and verify
      const savedSettings = await settingsService.getSettings();
      expect(savedSettings).toEqual(testSettings);
      expect(savedSettings.paperTrading.initialBalance).toBe(10);
      expect(savedSettings.paperTrading.dashboardRefresh).toBe(5000);
    });
  });

  describe('updateSettings', () => {
    it('should update specific settings while preserving others', async () => {
      // First save some initial settings
      const initialSettings: AppSettings = {
        ...defaultSettings,
        paperTrading: {
          ...defaultSettings.paperTrading,
          initialBalance: 10,
          dashboardRefresh: 5000
        }
      };
      await settingsService.saveSettings(initialSettings);

      // Update only some settings
      await settingsService.updateSettings({
        paperTrading: {
          ...initialSettings.paperTrading,
          initialBalance: 15
        }
      });

      // Verify the update
      const updatedSettings = await settingsService.getSettings();
      expect(updatedSettings.paperTrading.initialBalance).toBe(15);
      expect(updatedSettings.paperTrading.dashboardRefresh).toBe(5000);
      expect(updatedSettings.paperTrading.recentTradesLimit).toBe(initialSettings.paperTrading.recentTradesLimit);
    });
  });

  describe('rugCheck settings', () => {
    it('should handle array settings correctly', async () => {
      // Create test settings with array modifications
      const testSettings: AppSettings = {
        ...defaultSettings,
        rugCheck: {
          ...defaultSettings.rugCheck,
          blockSymbols: ['TEST1', 'TEST2'],
          containString: ['VALID1', 'VALID2'],
          legacyNotAllowed: ['Check1', 'Check2']
        }
      };

      // Save the settings
      await settingsService.saveSettings(testSettings);

      // Read settings back and verify arrays
      const savedSettings = await settingsService.getSettings();
      expect(savedSettings.rugCheck.blockSymbols).toEqual(['TEST1', 'TEST2']);
      expect(savedSettings.rugCheck.containString).toEqual(['VALID1', 'VALID2']);
      expect(savedSettings.rugCheck.legacyNotAllowed).toEqual(['Check1', 'Check2']);
    });
  });

  describe('error handling', () => {
    it('should handle invalid settings gracefully', async () => {
      // Attempt to save invalid settings
      const invalidSettings = {
        paperTrading: {
          initialBalance: 'invalid' // This should be a number
        }
      };

      // Expect error to be thrown
      await expect(settingsService.saveSettings(invalidSettings as any))
        .rejects
        .toThrow();

      // Verify that database still contains valid settings
      const settings = await settingsService.getSettings();
      expect(settings).toEqual(defaultSettings);
    });
  });

  describe('full end-to-end test', () => {
    it('should simulate a full settings update cycle', async () => {
      // 1. Start with default settings
      const initialSettings = await settingsService.getSettings();
      expect(initialSettings).toEqual(defaultSettings);

      // 2. Update some settings
      const updates = {
        paperTrading: {
          ...defaultSettings.paperTrading,
          initialBalance: 20,
          dashboardRefresh: 3000
        },
        rugCheck: {
          ...defaultSettings.rugCheck,
          blockSymbols: ['TESTTOKEN'],
          maxScore: 50000
        }
      };

      await settingsService.updateSettings(updates);

      // 3. Verify updates
      const afterUpdate = await settingsService.getSettings();
      expect(afterUpdate.paperTrading.initialBalance).toBe(20);
      expect(afterUpdate.paperTrading.dashboardRefresh).toBe(3000);
      expect(afterUpdate.rugCheck.blockSymbols).toEqual(['TESTTOKEN']);
      expect(afterUpdate.rugCheck.maxScore).toBe(50000);

      // 4. Verify other settings remained unchanged
      expect(afterUpdate.paperTrading.recentTradesLimit).toBe(defaultSettings.paperTrading.recentTradesLimit);
      expect(afterUpdate.priceValidation).toEqual(defaultSettings.priceValidation);

      // 5. Update a nested setting
      await settingsService.updateSettings({
        priceValidation: {
          ...defaultSettings.priceValidation,
          maxDeviation: 0.1
        }
      });

      // 6. Verify the nested update
      const finalSettings = await settingsService.getSettings();
      expect(finalSettings.priceValidation.maxDeviation).toBe(0.1);
      expect(finalSettings.paperTrading.initialBalance).toBe(20); // Previous update preserved
      expect(finalSettings.rugCheck.blockSymbols).toEqual(['TESTTOKEN']); // Previous update preserved
    });
  });
});
