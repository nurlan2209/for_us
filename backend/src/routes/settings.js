// backend/src/routes/settings.js
import express from 'express';
import { z } from 'zod';
import { getSettings, updateSettings } from '../services/database.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Validation schema for studio settings
const studioSettingsSchema = z.object({
  aboutText: z.string().min(1, 'About text is required').max(2000, 'About text too long'),
  clients: z.array(z.string().min(1, 'Client name required')).max(50, 'Too many clients'),
  services: z.array(z.string().min(1, 'Service name required')).max(20, 'Too many services'),
  recognitions: z.array(z.string().min(1, 'Recognition required')).max(10, 'Too many recognitions').optional(),
});

/**
 * GET /api/settings
 * Get all settings (public endpoint)
 */
router.get('/', (req, res) => {
  try {
    const settings = getSettings();
    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch settings'
    });
  }
});

/**
 * GET /api/settings/studio
 * Get studio settings (public endpoint)
 */
router.get('/studio', (req, res) => {
  try {
    const settings = getSettings();
    const studioSettings = {
      aboutText: settings.studio?.aboutText || '',
      clients: settings.studio?.clients || [],
      services: settings.studio?.services || [],
      recognitions: settings.studio?.recognitions || []
    };
    res.json({ studio: studioSettings });
  } catch (error) {
    console.error('Get studio settings error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch studio settings'
    });
  }
});

/**
 * PUT /api/settings/studio
 * Update studio settings (admin only)
 */
router.put('/studio', verifyToken, requireAdmin, async (req, res) => {
  try {
    // Validate request body
    const validationResult = studioSettingsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid studio settings data',
        details: validationResult.error.errors
      });
    }

    const studioData = validationResult.data;

    // Get current settings
    const currentSettings = getSettings();
    
    // Update studio settings
    const updatedSettings = await updateSettings({
      ...currentSettings,
      studio: {
        ...currentSettings.studio,
        ...studioData
      }
    });

    res.json({
      message: 'Studio settings updated successfully',
      studio: updatedSettings.studio
    });

  } catch (error) {
    console.error('Update studio settings error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update studio settings'
    });
  }
});

/**
 * PUT /api/settings
 * Update general settings (admin only)
 */
router.put('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const currentSettings = getSettings();
    const updatedSettings = await updateSettings({
      ...currentSettings,
      ...req.body
    });

    res.json({
      message: 'Settings updated successfully',
      settings: updatedSettings
    });

  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update settings'
    });
  }
});

export default router;