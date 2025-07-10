// backend/src/routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getUserByUsername, getUserById } from '../services/database.js';
import { 
  generateToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  verifyToken 
} from '../middleware/auth.js';

const router = express.Router();

// Validation schemas
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

/**
 * POST /api/auth/login
 * Login user and return JWT tokens
 */
router.post('/login', async (req, res) => {
  try {
    // Validate request body
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid input data',
        details: validationResult.error.errors
      });
    }

    const { username, password } = validationResult.data;

    // Find user by username
    const user = getUserByUsername(username);
    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid username or password'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid username or password'
      });
    }

    // Generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Return user data and tokens
    const userResponse = {
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt
    };

    res.json({
      message: 'Login successful',
      user: userResponse,
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRATION || '24h'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Login failed'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    // Validate request body
    const validationResult = refreshTokenSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Refresh token is required',
        details: validationResult.error.errors
      });
    }

    const { refreshToken } = validationResult.data;

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Get user from database
    const user = getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'User not found'
      });
    }

    // Generate new access token
    const newAccessToken = generateToken(user);

    res.json({
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
      expiresIn: process.env.JWT_EXPIRATION || '24h'
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid or expired refresh token'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get('/me', verifyToken, (req, res) => {
  try {
    // Get user from database (to ensure fresh data)
    const user = getUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account no longer exists'
      });
    }

    // Return user data (without password)
    const userResponse = {
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      user: userResponse
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get user information'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', verifyToken, (req, res) => {
  // In a real application, you might want to blacklist the token
  // For now, we just return success as the client will remove the token
  res.json({
    message: 'Logout successful'
  });
});

/**
 * GET /api/auth/verify
 * Verify if token is valid
 */
router.get('/verify', verifyToken, (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user.id,       
      username: req.user.username,
      role: req.user.role
    }
  });
});

export default router;