// backend/src/services/minio.js - ИСПРАВЛЕННАЯ ВЕРСИЯ ДЛЯ NGINX
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

let minioClient = null;

/**
 * Initialize MinIO client for nginx proxy setup
 */
async function initializeMinio() {
  try {
    console.log('🚀 Initializing MinIO for nginx proxy...');
    
    // MinIO подключение - внутреннее соединение
    minioClient = new Minio.Client({
      endPoint: 'localhost', // Локальное подключение внутри сервера
      port: 9000,
      useSSL: false, // nginx терминирует SSL
      accessKey: process.env.MINIO_ACCESS_KEY || 'prodportfolioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'prod-portfolio-secret-key-2025'
    });

    const bucketName = process.env.MINIO_BUCKET_NAME || 'portfolio-files';
    
    // Проверяем соединение с MinIO
    let retries = 10;
    while (retries > 0) {
      try {
        await minioClient.listBuckets();
        console.log('✅ Connected to MinIO');
        break;
      } catch (error) {
        console.log(`⏳ Waiting for MinIO... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        retries--;
        if (retries === 0) throw error;
      }
    }
    
    // Создаем bucket если не существует
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`✅ Bucket '${bucketName}' created`);
    } else {
      console.log(`✅ Bucket '${bucketName}' exists`);
    }
    
    // CORS для работы через nginx
    const corsConfig = {
      CORSRules: [
        {
          ID: 'NginxProxy',
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
          AllowedOrigins: [
            'https://kartofan.online',
            'https://www.kartofan.online',
            'http://localhost:3100' // для разработки
          ],
          ExposeHeaders: ['ETag', 'Content-Length', 'Content-Type'],
          MaxAgeSeconds: 3600
        }
      ]
    };

    try {
      await minioClient.setBucketCors(bucketName, corsConfig);
      console.log('✅ CORS configured for nginx proxy');
    } catch (corsError) {
      console.warn('⚠️ CORS config failed:', corsError.message);
    }
    
    // Публичная политика для чтения через nginx /media/
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [
            `arn:aws:s3:::${bucketName}/*`
          ]
        }
      ]
    };
    
    try {
      await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
      console.log('✅ Bucket policy set for public access');
    } catch (policyError) {
      console.warn('⚠️ Bucket policy failed:', policyError.message);
    }
    
    console.log('✅ MinIO initialized for nginx proxy');
    return minioClient;
    
  } catch (error) {
    console.error('❌ MinIO initialization failed:', error);
    throw error;
  }
}

/**
 * Upload file to MinIO
 */
async function uploadFile(file, folder = 'uploads') {
  try {
    const client = getMinioClient();
    const bucketName = process.env.MINIO_BUCKET_NAME || 'portfolio-files';
    
    // Генерируем уникальное имя файла
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${folder}/${uuidv4()}.${fileExtension}`;
    
    const metaData = {
      'Content-Type': file.mimetype,
      'X-Original-Name': file.originalname,
      'X-Upload-Date': new Date().toISOString(),
      'Cache-Control': 'public, max-age=31536000',
    };
    
    // Загружаем файл в MinIO
    await client.putObject(bucketName, fileName, file.buffer, file.size, metaData);
    
    // ✅ ВАЖНО: URL через nginx proxy
    const fileUrl = `https://kartofan.online/media/${bucketName}/${fileName}`;
    
    console.log('📤 File uploaded:', fileName);
    console.log('🔗 Public URL:', fileUrl);
    
    return {
      fileName,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: fileUrl, // URL через nginx
      bucket: bucketName
    };
    
  } catch (error) {
    console.error('❌ Upload error:', error);
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
 * Delete file from MinIO
 */
async function deleteFile(fileName) {
  try {
    const client = getMinioClient();
    const bucketName = process.env.MINIO_BUCKET_NAME || 'portfolio-files';
    
    await client.removeObject(bucketName, fileName);
    console.log('🗑️ File deleted:', fileName);
    
    return { success: true, fileName };
    
  } catch (error) {
    console.error('❌ Delete error:', error);
    throw error;
  }
}

/**
 * Get file URL - через nginx proxy
 */
async function getFileUrl(fileName, expiry = 24 * 60 * 60) {
  try {
    const bucketName = process.env.MINIO_BUCKET_NAME || 'portfolio-files';
    
    // Для публичных файлов через nginx не нужны signed URLs
    return `https://kartofan.online/media/${bucketName}/${fileName}`;
    
  } catch (error) {
    console.error('❌ URL generation error:', error);
    throw error;
  }
}

export {
  initializeMinio,
  getMinioClient,
  uploadFile,
  deleteFile,
  getFileUrl
};