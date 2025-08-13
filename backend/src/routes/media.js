// backend/src/routes/media.js - ДЛЯ NGINX (упрощенная версия)
import express from 'express';
import { getMinioClient } from '../services/minio.js';

const router = express.Router();

/**
 * GET /api/media/info/*
 * Информация о медиафайле (так как nginx отдает сами файлы напрямую)
 */
router.get('/info/*', async (req, res) => {
  try {
    // Парсим путь: /api/media/info/portfolio-files/videos/filename.mp4
    const fullPath = req.params[0]; // portfolio-files/videos/filename.mp4
    const [bucket, ...pathParts] = fullPath.split('/');
    const filePath = pathParts.join('/'); // videos/filename.mp4
    
    console.log(`📁 Getting info for: ${bucket}/${filePath}`);
    
    const client = getMinioClient();
    const stat = await client.statObject(bucket, filePath);
    
    res.json({
      bucket,
      filePath,
      size: stat.size,
      contentType: stat.metaData['content-type'],
      lastModified: stat.lastModified,
      etag: stat.etag,
      url: `https://kartofan.online/media/${bucket}/${filePath}`
    });
    
  } catch (error) {
    console.error('❌ Media info error:', error);
    res.status(404).json({ 
      error: 'File not found',
      message: error.message 
    });
  }
});

/**
 * GET /api/media/list/*
 * Список файлов в папке
 */
router.get('/list/*', async (req, res) => {
  try {
    const fullPath = req.params[0] || '';
    const [bucket, ...pathParts] = fullPath.split('/');
    const prefix = pathParts.join('/');
    
    console.log(`📂 Listing files in: ${bucket}/${prefix}`);
    
    const client = getMinioClient();
    const objectsStream = client.listObjects(bucket, prefix, true);
    
    const files = [];
    
    objectsStream.on('data', (obj) => {
      files.push({
        name: obj.name,
        size: obj.size,
        lastModified: obj.lastModified,
        url: `https://kartofan.online/media/${bucket}/${obj.name}`
      });
    });
    
    objectsStream.on('end', () => {
      res.json({ files });
    });
    
    objectsStream.on('error', (error) => {
      throw error;
    });
    
  } catch (error) {
    console.error('❌ Media list error:', error);
    res.status(500).json({ 
      error: 'Failed to list files',
      message: error.message 
    });
  }
});

/**
 * INFO: Прямые медиафайлы теперь отдает nginx
 * nginx проксирует /media/* -> MinIO напрямую
 * Этот роут оставлен только для API функций
 */

export default router;