import express from 'express';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Create a restart flag file
const createRestartFlag = () => {
  const flagPath = path.join(__dirname, '..', 'restart.flag');
  fs.writeFileSync(flagPath, Date.now().toString(), 'utf8');
  console.log(`Created restart flag at ${flagPath}`);
};

// Restart the server
router.post('/', async (req, res) => {
  try {
    // Send a success response before restarting
    res.json({ 
      success: true, 
      message: 'Server restart initiated'
    });

    console.log('Restart requested via API');
    
    // Create a restart flag file
    createRestartFlag();
    
    // Simply exit the process - the parent process (dev.sh) should restart it
    setTimeout(() => {
      console.log('Exiting process for restart...');
      process.exit(0);
    }, 500);
  } catch (error) {
    console.error('Error restarting server:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to restart server'
    });
  }
});

export const setupRestartRoutes = (app: express.Express): void => {
  app.use('/api/restart', router);
};
