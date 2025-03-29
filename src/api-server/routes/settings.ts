import express from 'express';
import { SettingsService } from '../../papertrading/services/settings-service';

const router = express.Router();

// Get settings
router.get('/', async (req, res, next) => {
  try {
    const settingsService = SettingsService.getInstance();
    const settings = await settingsService.getSettings();
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// Save settings
router.post('/', async (req, res, next) => {
  try {
    const settingsService = SettingsService.getInstance();
    await settingsService.saveSettings(req.body);
    res.json({ 
      success: true, 
      message: 'Settings saved successfully. Please restart the bot for changes to take effect.',
      requiresRestart: true
    });
  } catch (error) {
    next(error);
  }
});

// Reset settings to default
router.post('/reset', async (req, res, next) => {
  try {
    const settingsService = SettingsService.getInstance();
    await settingsService.resetSettings();
    const settings = await settingsService.getSettings();
    res.json({ 
      success: true, 
      message: 'Settings reset to default values successfully.',
      requiresRestart: true,
      settings
    });
  } catch (error) {
    next(error);
  }
});

export const setupSettingsRoutes = (app: express.Express): void => {
  app.use('/api/settings', router);
};
