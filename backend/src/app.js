// backend/src/app.js - ПОЛНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ для Railway
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
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

// ✅ Railway: Trust proxy для HTTPS
app.set('trust proxy', 1);

// ✅ Railway: Обновленный Helmet для продакшена
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-eval'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "*", "blob:"], // ✅ ДОБАВИЛИ blob:
      mediaSrc: ["'self'", "data:", "https:", "*", "blob:"], // ✅ ДОБАВИЛИ blob:
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

// ✅ Railway: Продакшен rate limiting
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

// ✅ Railway: Продакшен CORS
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CORS_ORIGIN,
      process.env.FRONTEND_URL,
      'http://localhost:3100',
      'http://127.0.0.1:3100'
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

// ✅ ИСПРАВЛЕНИЕ: Статические файлы фронтенда для Railway
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, '../public');
  
  // Проверяем что директория существует
  if (fs.existsSync(publicPath)) {
    console.log(`📁 Serving static files from: ${publicPath}`);
    
    // Проверяем содержимое директории
    try {
      const files = fs.readdirSync(publicPath);
      console.log(`📂 Files in public directory: ${files.join(', ')}`);
      
      // Проверяем наличие index.html
      const indexExists = fs.existsSync(path.join(publicPath, 'index.html'));
      console.log(`📄 index.html exists: ${indexExists}`);
      
    } catch (err) {
      console.error(`❌ Error reading public directory:`, err);
    }
    
    // Отдаем статические файлы с правильными заголовками
    app.use(express.static(publicPath, {
      maxAge: '1y',
      etag: false,
      lastModified: false,
      index: false  // НЕ отдаем index.html автоматически
    }));
    
  } else {
    console.error(`❌ Public directory not found: ${publicPath}`);
  }
}

// ✅ ОТЛАДКА: Логирование всех запросов
app.use((req, res, next) => {
  console.log(`🌐 Request: ${req.method} ${req.path} - Origin: ${req.get('Origin')} - User-Agent: ${req.get('User-Agent')?.substring(0, 30)}`);
  next();
});

// ✅ ТЕСТ: Простой роут для проверки
app.get('/test', (req, res) => {
  res.send(`
    <h1>✅ Railway App Works!</h1>
    <p>Environment: ${process.env.NODE_ENV}</p>
    <p>Railway Domain: ${process.env.RAILWAY_DOMAIN}</p>
    <p>Static files directory exists: ${fs.existsSync(path.join(__dirname, '../public'))}</p>
    <p>Index.html exists: ${fs.existsSync(path.join(__dirname, '../public/index.html'))}</p>
    <a href="/api/health">Health Check</a>
  `);
});

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

// ✅ ИСПРАВЛЕНИЕ: Catch-all для React Router (ТОЛЬКО в продакшене)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    // Исключаем API роуты
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({
        error: 'API endpoint not found',
        message: `The endpoint ${req.path} does not exist.`,
      });
    }
    
    // ✅ Отдаем index.html для React Router
    const indexPath = path.join(__dirname, '../public/index.html');
    if (fs.existsSync(indexPath)) {
      console.log(`📄 Serving React app for: ${req.path}`);
      res.sendFile(indexPath);
    } else {
      console.error(`❌ index.html not found at: ${indexPath}`);
      res.status(500).json({
        error: 'React app not found',
        message: 'Frontend build files are missing'
      });
    }
  });
}

// 404 для API (только если не в продакшене или если путь начинается с /api/)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: `The endpoint ${req.originalUrl} does not exist.`,
  });
});

// ✅ Railway: Продакшен error handler
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

// ✅ Railway: Startup function
async function startServer() {
  try {
    console.log('🚂 Starting Portfolio on Railway...');
    console.log(`📦 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌍 Railway Environment: ${process.env.RAILWAY_ENVIRONMENT_NAME || 'local'}`);
    
    await initializeDatabase();
    console.log('✅ Database initialized');
    
    // ✅ MinIO для Railway
    if (process.env.RAILWAY_ENVIRONMENT_NAME || process.env.ENABLE_MINIO === 'true') {
      try {
        await initializeMinio();
        console.log('✅ MinIO initialized');
      } catch (error) {
        console.warn('⚠️ MinIO initialization failed, continuing without MinIO:', error.message);
      }
    } else if (process.env.NODE_ENV === 'development') {
      try {
        await initializeMinio();
        console.log('✅ MinIO initialized');
      } catch (error) {
        console.warn('⚠️ MinIO initialization failed, continuing without MinIO:', error.message);
      }
    } else {
      console.log('ℹ️ Skipping MinIO in production mode');
    }
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🌟 Server running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      
      if (process.env.RAILWAY_ENVIRONMENT_NAME) {
        console.log(`🚂 Railway URL: https://${process.env.RAILWAY_DOMAIN || 'production.railway.app'}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// ✅ Railway: Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`👋 ${signal} received, shutting down gracefully`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ✅ Railway: Unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();

export default app;