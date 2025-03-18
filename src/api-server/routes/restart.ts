import express from 'express';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Create a restart flag file
const createRestartFlag = () => {
  try {
    // Create the flag in the current working directory
    const flagPath = 'restart.flag';
    fs.writeFileSync(flagPath, Date.now().toString(), 'utf8');
    console.log(`Created restart flag at ${flagPath}`);
    console.log(`Current working directory: ${process.cwd()}`);
    return true;
  } catch (error) {
    console.error('Error creating restart flag:', error);
    return false;
  }
};

// Restart the server
router.post('/', async (req, res) => {
  try {
    console.log('Restart requested via API');
    
    // Create a restart flag file
    const flagCreated = createRestartFlag();
    
    if (!flagCreated) {
      // If flag creation failed, send error response
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create restart flag'
      });
    }
    
    // Send a success response before restarting
    res.json({ 
      success: true, 
      message: 'Server restart initiated'
    });
    
    // Simply exit the process - the parent process (dev.sh) should restart it
    setTimeout(() => {
      console.log('Exiting process for restart...');
      process.exit(0);
    }, 500);
  } catch (error) {
    console.error('Error restarting server:', error);
    // Only try to send response if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to restart server'
      });
    }
  }
});

export const setupRestartRoutes = (app: express.Express): void => {
  app.use('/api/restart', router);
};
