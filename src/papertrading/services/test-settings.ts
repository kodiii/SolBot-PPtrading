/**
 * Manual integration test for the SettingsService
 * 
 * This script demonstrates how the SettingsService works with the database.
 * Run it with: npx ts-node src/papertrading/services/test-settings.ts
 */

import { SettingsService, defaultSettings } from './settings-service';
import path from 'path';
import fs from 'fs';

// Use a test database file
const TEST_DB_PATH = path.resolve(__dirname, './test-settings.db');

// Delete the test database if it exists
if (fs.existsSync(TEST_DB_PATH)) {
  console.log('Removing existing test database...');
  fs.unlinkSync(TEST_DB_PATH);
}

async function runTest() {
  console.log('Starting SettingsService integration test...');
  
  // Initialize the service with the test database
  console.log('Initializing SettingsService...');
  const settingsService = SettingsService.getInstance(TEST_DB_PATH);
  await settingsService.initialize();
  
  // Get default settings
  console.log('Getting default settings...');
  const initialSettings = await settingsService.getSettings();
  console.log('Initial settings:', JSON.stringify(initialSettings.paperTrading, null, 2));
  
  // Update some settings
  console.log('\nUpdating settings...');
  await settingsService.updateSettings({
    paperTrading: {
      ...initialSettings.paperTrading,
      initialBalance: 10,
      dashboardRefresh: 5000
    },
    rugCheck: {
      ...initialSettings.rugCheck,
      blockSymbols: ['TEST1', 'TEST2'],
      maxScore: 50000
    }
  });
  
  // Get updated settings
  console.log('Getting updated settings...');
  const updatedSettings = await settingsService.getSettings();
  console.log('Updated paperTrading settings:', JSON.stringify(updatedSettings.paperTrading, null, 2));
  console.log('Updated rugCheck.blockSymbols:', updatedSettings.rugCheck.blockSymbols);
  console.log('Updated rugCheck.maxScore:', updatedSettings.rugCheck.maxScore);
  
  // Verify other settings remained unchanged
  console.log('\nVerifying other settings remained unchanged...');
  console.log('priceValidation settings unchanged:', 
    JSON.stringify(updatedSettings.priceValidation) === JSON.stringify(initialSettings.priceValidation));
  
  // Clean up
  console.log('\nCleaning up...');
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
  
  console.log('Test completed successfully!');
}

// Run the test
runTest().catch(error => {
  console.error('Test failed:', error);
  // Clean up on error
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
});
