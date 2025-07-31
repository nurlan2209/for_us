// backend/src/services/minio.js - ИСПРАВЛЕННАЯ ВЕРСИЯ с CORS
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

let minioClient = null;

/**
 * Initialize MinIO client and create bucket
 */
async function initializeMinio() {
  try {
    console.log('🚀 Initializing MinIO...');
    
    minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT) || 9000,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123'
    });

    const bucketName = process.env.MINIO_BUCKET_NAME || 'portfolio-files';
    
    // Check if bucket exists, create if not
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`✅ Bucket '${bucketName}' created successfully`);
    } else {
      console.log(`✅ Bucket '${bucketName}' already exists`);
    }
    
    // ✅ ИСПРАВЛЕНИЕ 1: Установка правильной CORS политики
    const corsConfig = {
      CORSRules: [
        {
          ID: 'AllowAll',
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
          AllowedOrigins: [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:8080',
            'http://127.0.0.1:8080',
            '*'  // Для разработки - в продакшене укажите конкретные домены
          ],
          ExposeHeaders: [
            'ETag',
            'Content-Range',
            'Content-Length',
            'Content-Type',
            'Last-Modified'
          ],
          MaxAgeSeconds: 3600
        }
      ]
    };

    try {
      await minioClient.setBucketCors(bucketName, corsConfig);
      console.log('✅ CORS policy set successfully');
    } catch (corsError) {
      console.error('⚠️  CORS policy error:', corsError.message);
    }
    
    // ✅ ИСПРАВЛЕНИЕ 2: Установка правильной bucket policy для публичного доступа
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [
            `arn:aws:s3:::${bucketName}/images/*`,
            `arn:aws:s3:::${bucketName}/videos/*`,  // ✅ Добавляем видео
            `arn:aws:s3:::${bucketName}/documents/*`
          ]
        },
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:ListBucket'],
          Resource: [`arn:aws:s3:::${bucketName}`]
        }
      ]
    };
    
    try {
      await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
      console.log('✅ Bucket policy set for public access');
    } catch (policyError) {
      console.error('⚠️  Bucket policy error:', policyError.message);
    }
    
    console.log('✅ MinIO initialized successfully');
    return minioClient;
    
  } catch (error) {
    console.error('❌ Error initializing MinIO:', error);
    throw error;
  }
}

/**
 * Get MinIO client instance
 */
function getMinioClient() {
  if (!minioClient) {
    throw new Error('MinIO not initialized. Call initializeMinio() first.');
  }
  return minioClient;
}

/**
 * Upload file to MinIO
 */
async function uploadFile(file, folder = 'uploads') {
  try {
    const client = getMinioClient();
    const bucketName = process.env.MINIO_BUCKET_NAME || 'portfolio-files';
    
    // Generate unique filename
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${folder}/${uuidv4()}.${fileExtension}`;
    
    // ✅ ИСПРАВЛЕНИЕ 3: Улучшенные метаданные с правильным Content-Type
    const metaData = {
      'Content-Type': file.mimetype,
      'X-Original-Name': file.originalname,
      'X-Upload-Date': new Date().toISOString(),
      'Cache-Control': 'public, max-age=31536000', // 1 год для кеширования
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, HEAD',
      'Access-Control-Allow-Headers': '*'
    };
    
    // Upload file
    await client.putObject(bucketName, fileName, file.buffer, file.size, metaData);
    
    // ✅ ИСПРАВЛЕНИЕ 4: URL через прокси бэкенда
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    const fileUrl = `${backendUrl}/api/media/${bucketName}/${fileName}`;
    
    console.log('🔗 Generated proxy URL:', fileUrl);
    
    // ✅ ИСПРАВЛЕНИЕ 5: Тестируем доступность файла
    try {
      const response = await fetch(fileUrl, { method: 'HEAD' });
      if (response.ok) {
        console.log('✅ File is accessible via URL');
      } else {
        console.warn('⚠️  File upload successful but not accessible via public URL');
      }
    } catch (testError) {
      console.warn('⚠️  Could not test file accessibility:', testError.message);
    }
    
    return {
      fileName,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: fileUrl,
      bucket: bucketName
    };
    
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Delete file from MinIO
 */
async function deleteFile(fileName) {
  try {
    const client = getMinioClient();
    const bucketName = process.env.MINIO_BUCKET_NAME || 'portfolio-files';
    
    await client.removeObject(bucketName, fileName);
    return { success: true, fileName };
    
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

/**
 * Get file URL
 */
async function getFileUrl(fileName, expiry = 24 * 60 * 60) {
  try {
    const client = getMinioClient();
    const bucketName = process.env.MINIO_BUCKET_NAME || 'portfolio-files';
    
    // ✅ ИСПРАВЛЕНИЕ 6: Для всех медиафайлов возвращаем прямую ссылку
    const minioPublicUrl = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';
    return `${minioPublicUrl}/${bucketName}/${fileName}`;
    
  } catch (error) {
    console.error('Error generating file URL:', error);
    throw error;
  }
}

/**
 * List files in folder
 */
async function listFiles(folder = '', recursive = false) {
  try {
    const client = getMinioClient();
    const bucketName = process.env.MINIO_BUCKET_NAME || 'portfolio-files';
    
    const files = [];
    const stream = client.listObjects(bucketName, folder, recursive);
    
    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => files.push(obj));
      stream.on('error', reject);
      stream.on('end', () => resolve(files));
    });
    
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
}

/**
 * Get file statistics
 */
async function getFileStats(fileName) {
  try {
    const client = getMinioClient();
    const bucketName = process.env.MINIO_BUCKET_NAME || 'portfolio-files';
    
    const stats = await client.statObject(bucketName, fileName);
    return stats;
    
  } catch (error) {
    console.error('Error getting file stats:', error);
    throw error;
  }
}

export {
  initializeMinio,
  getMinioClient,
  uploadFile,
  deleteFile,
  getFileUrl,
  listFiles,
  getFileStats
};