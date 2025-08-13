// backend/src/app.js - ПОЛНАЯ ВЕРСИЯ для nginx proxy
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
const PORT = process.env.PORT || process.env.API_PORT || 8100;

console.log('🚀 Starting Portfolio Backend for nginx proxy...');
console.log(`📦 Environment: ${process.env.NODE_ENV}`);
console.log(`🌍 Domain: kartofan.online`);
console.log(`🔌 Port: ${PORT}`);

// ✅ nginx: Trust proxy для правильной работы с nginx
app.set('trust proxy', 1);

// ✅ nginx: Обновленный Helmet конфиг для nginx proxy
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-eval'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "*", "blob:"],
      mediaSrc: ["'self'", "data:", "https:", "*", "blob:"],
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

// ✅ nginx: Rate limiting для продакшена
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: process.env.NODE_ENV === 'production' ? 200 : 1000, // Увеличено для nginx
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true, // Важно для nginx
});
app.use('/api/', limiter);

// Логирование
if (process.env.NODE_ENV !== 'test') {
  const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
  app.use(morgan(logFormat));
}

// ✅ nginx: CORS конфигурация для nginx proxy
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://kartofan.online',
      'https://www.kartofan.online',
      'http://localhost:3100',
      'http://127.0.0.1:3100'
    ].filter(Boolean);
    
    console.log('🌐 CORS Origin:', origin);
    
    // Разрешаем запросы без origin (nginx proxy, мобильные приложения)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked origin: ${origin}`);
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

// ✅ ОТЛАДКА: Логирование всех запросов
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const userAgent = req.get('User-Agent')?.substring(0, 30) || 'Unknown';
  console.log(`🌐 ${timestamp} - ${req.method} ${req.path} - Origin: ${req.get('Origin') || 'none'} - UA: ${userAgent}`);
  next();
});

// ✅ nginx: Тест роут для проверки работы backend
app.get('/test', (req, res) => {
  res.send(`
    <h1>✅ Backend Works!</h1>
    <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
    <p><strong>Domain:</strong> kartofan.online</p>
    <p><strong>Port:</strong> ${PORT}</p>
    <p><strong>Time:</strong> ${new Date().toISOString()}</p>
    <p><strong>Nginx Proxy:</strong> Enabled</p>
    <hr>
    <h3>Available Endpoints:</h3>
    <ul>
      <li><a href="/api/health">Health Check</a></li>
      <li><a href="/api/projects">Projects API</a></li>
      <li><a href="/api/projects/categories">Categories API</a></li>
      <li><a href="/api/settings/studio">Studio Settings</a></li>
      <li><a href="/api/settings/contact">Contact Settings</a></li>
    </ul>
    <hr>
    <h3>External URLs (via nginx):</h3>
    <ul>
      <li><a href="https://kartofan.online">Frontend</a></li>
      <li><a href="https://kartofan.online/api/health">API Health</a></li>
      <li><a href="https://kartofan.online/admin/login">Admin Login</a></li>
    </ul>
  `);
});

// ✅ OPTIONS preflight для всех API маршрутов
app.options('/api/*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/media', mediaRoutes);

// Health check для nginx и мониторинга
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    port: PORT,
    domain: 'kartofan.online',
    proxy: 'nginx',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {
      database: 'OK',
      minio: 'OK',
      nginx: 'proxy'
    }
  });
});

// Подробная информация о системе (только для разработки)
app.get('/api/info', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  res.json({
    node_version: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    cwd: process.cwd(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      CORS_ORIGIN: process.env.CORS_ORIGIN,
      MINIO_PUBLIC_URL: process.env.MINIO_PUBLIC_URL
    },
    headers: req.headers,
    nginx_proxy: true
  });
});

// ✅ nginx: НЕ ОТДАЕМ СТАТИКУ - это делает nginx для frontend
// Frontend статику отдает nginx напрямую из контейнера на порту 3100

// 404 для API эндпоинтов
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: `The endpoint ${req.originalUrl} does not exist.`,
    available_endpoints: [
      '/api/health',
      '/api/projects',
      '/api/projects/categories',
      '/api/auth/login',
      '/api/settings/studio',
      '/api/settings/contact',
      '/api/upload/image'
    ]
  });
});

// ✅ nginx: Продакшен error handler
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`❌ ${timestamp} - Error:`, err);
  
  // Не показываем стек трейс в продакшене
  const isDev = process.env.NODE_ENV !== 'production';
  
  // Обработка различных типов ошибок
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      timestamp,
      ...(isDev && { details: err.errors }),
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token',
      timestamp,
    });
  }
  
  if (err.code === 'ENOENT') {
    return res.status(404).json({
      error: 'File Not Found',
      message: 'The requested file does not exist',
      timestamp,
    });
  }
  
  // CORS ошибки
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Cross-origin request blocked',
      timestamp,
    });
  }
  
  // Общая ошибка сервера
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: isDev ? err.message : 'Something went wrong!',
    timestamp,
    ...(isDev && { stack: err.stack }),
  });
});

// ✅ nginx: Startup function
async function startServer() {
  try {
    console.log('🌐 Starting Portfolio Backend for nginx deployment...');
    console.log(`📦 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌍 Domain: kartofan.online`);
    console.log(`🔌 Port: ${PORT}`);
    console.log(`🔧 Nginx Proxy: Enabled`);
    
    // Инициализируем базу данных
    await initializeDatabase();
    console.log('✅ Database initialized');
    
    // Инициализируем MinIO для nginx конфигурации
    try {
      await initializeMinio();
      console.log('✅ MinIO initialized for nginx proxy');
    } catch (error) {
      console.warn('⚠️ MinIO initialization failed, continuing without MinIO:', error.message);
      console.warn('⚠️ File uploads will not work until MinIO is running');
    }
    
    // Запускаем сервер
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('🌟 Backend server running successfully!');
      console.log('');
      console.log('📊 Server Info:');
      console.log(`   Port: ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV}`);
      console.log(`   Nginx Proxy: Enabled`);
      console.log('');
      console.log('🔗 Internal URLs (docker network):');
      console.log(`   Health: http://localhost:${PORT}/api/health`);
      console.log(`   Test: http://localhost:${PORT}/test`);
      console.log('');
      console.log('🌍 Public URLs (via nginx):');
      console.log('   Website: https://kartofan.online');
      console.log('   API Health: https://kartofan.online/api/health');
      console.log('   Admin: https://kartofan.online/admin/login');
      console.log('   Media: https://kartofan.online/media/');
      console.log('');
      console.log('✅ Ready to accept requests!');
    });
    
    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n👋 ${signal} received, shutting down gracefully...`);
      server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
      });
      
      // Форсированное завершение через 10 секунд
      setTimeout(() => {
        console.log('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// ✅ nginx: Unhandled rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise);
  console.error('🚨 Reason:', reason);
  // Не завершаем процесс в продакшене, просто логируем
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  // Завершаем процесс при uncaught exception
  process.exit(1);
});

// Запуск сервера
startServer();

export default app;