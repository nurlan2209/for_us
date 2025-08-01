// backend/src/app.js - RAILWAY VERSION
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import uploadRoutes from './routes/upload.js';
import settingsRoutes from './routes/settings.js';
import mediaRoutes from './routes/media.js';

// Import services
import { initializeDatabase } from './services/database.js';
import { initializeMinio } from './services/minio.js';

const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 8080;

// ✅ RAILWAY: Trust proxy для HTTPS
app.set('trust proxy', 1);

// ✅ RAILWAY: Обновленный Helmet для продакшена
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-eval'"], // Для React
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "*"],
      mediaSrc: ["'self'", "data:", "https:", "*"],
      connectSrc: ["'self'", "https:", "wss:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// ✅ RAILWAY: Продакшен rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Логирование
if (process.env.NODE_ENV !== 'test') {
  const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
  app.use(morgan(logFormat));
}

// ✅ RAILWAY: Продакшен CORS
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CORS_ORIGIN,
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ].filter(Boolean);
    
    // Разрешаем запросы без origin (мобильные приложения, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'Accept-Ranges'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length']
};

app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ RAILWAY: Статические файлы фронтенда
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, '../public');
  app.use(express.static(publicPath));
  
  console.log(`📁 Serving static files from: ${publicPath}`);
}

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/media', mediaRoutes);

// Health check для Railway
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    port: PORT,
    railway: process.env.RAILWAY_ENVIRONMENT_NAME || 'local'
  });
});

// ✅ RAILWAY: Catch-all для React Router
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    // Исключаем API роуты
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({
        error: 'API endpoint not found',
        message: `The endpoint ${req.path} does not exist.`,
      });
    }
    
    // Отдаем index.html для React Router
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
}

// 404 для API
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: `The endpoint ${req.originalUrl} does not exist.`,
  });
});

// ✅ RAILWAY: Продакшен error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Не показываем стек трейс в продакшене
  const isDev = process.env.NODE_ENV !== 'production';
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      ...(isDev && { details: err.errors }),
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token',
    });
  }
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: isDev ? err.message : 'Something went wrong!',
    ...(isDev && { stack: err.stack }),
  });
});

// ✅ RAILWAY: Startup function
async function startServer() {
  try {
    console.log('🚂 Starting Portfolio on Railway...');
    console.log(`📦 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌍 Railway Environment: ${process.env.RAILWAY_ENVIRONMENT_NAME || 'local'}`);
    
    await initializeDatabase();
    console.log('✅ Database initialized');
    
    // ✅ MinIO только в development или если явно включен
    if (process.env.NODE_ENV === 'development' || process.env.ENABLE_MINIO === 'true') {
      try {
        await initializeMinio();
        console.log('✅ MinIO initialized');
      } catch (error) {
        console.warn('⚠️  MinIO initialization failed, continuing without MinIO:', error.message);
      }
    } else {
      console.log('ℹ️  Skipping MinIO in production mode');
    }
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🌟 Server running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      
      if (process.env.RAILWAY_ENVIRONMENT_NAME) {
        console.log(`🚂 Railway URL: https://${process.env.RAILWAY_ENVIRONMENT_NAME}.railway.app`);
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// ✅ RAILWAY: Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`👋 ${signal} received, shutting down gracefully`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ✅ RAILWAY: Unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();

export default app;