// backend/src/routes/media.js
import express from 'express';
import { getMinioClient } from '../services/minio.js';

const router = express.Router();

/**
 * GET /api/media/*
 * Прокси для всех медиафайлов
 */
router.get('/*', async (req, res) => {
  try {
    // Парсим путь: /api/media/portfolio-files/videos/filename.mp4
    const fullPath = req.params[0]; // portfolio-files/videos/filename.mp4
    const [bucket, ...pathParts] = fullPath.split('/');
    const filePath = pathParts.join('/'); // videos/filename.mp4
    
    console.log(`📁 Proxying: ${bucket}/${filePath}`);
    
    const client = getMinioClient();
    const stat = await client.statObject(bucket, filePath);
    
    // Устанавливаем CORS заголовки
    res.set({
      'Content-Type': stat.metaData['content-type'] || 'video/mp4',
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Cache-Control': 'public, max-age=31536000'
    });
    
    // Обработка Range запросов для видео
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      
      res.status(206);
      res.set('Content-Range', `bytes ${start}-${end}/${stat.size}`);
      
      const stream = await client.getPartialObject(bucket, filePath, start, (end - start) + 1);
      stream.pipe(res);
    } else {
      const stream = await client.getObject(bucket, filePath);
      stream.pipe(res);
    }
    
  } catch (error) {
    console.error('❌ Media proxy error:', error);
    res.status(404).json({ error: 'File not found' });
  }
});

export default router;