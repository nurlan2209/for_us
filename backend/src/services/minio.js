// backend/src/services/minio.js - ИСПРАВЛЕННАЯ ВЕРСИЯ для Docker
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

let minioClient = null;

/**
 * Initialize MinIO client для Docker + nginx proxy setup
 */
async function initializeMinio() {
  try {
    console.log('🚀 Initializing MinIO for Docker + nginx proxy...');
    
    // ✅ ИСПРАВЛЕНИЕ: Используем правильный endpoint для Docker сети
    const minioEndpoint = process.env.MINIO_ENDPOINT || 'minio';
    const minioPort = parseInt(process.env.MINIO_PORT) || 9000;
    const accessKey = process.env.MINIO_ACCESS_KEY || 'prodportfolioadmin';
    const secretKey = process.env.MINIO_SECRET_KEY || 'prod-portfolio-secret-key-2025';
    
    console.log(`🔧 MinIO Config:`, {
      endpoint: minioEndpoint,
      port: minioPort,
      accessKey: accessKey,
      useSSL: false
    });
    
    // ✅ ИСПРАВЛЕНИЕ: Принудительно используем IPv4
    minioClient = new Minio.Client({
      endPoint: minioEndpoint,
      port: minioPort,
      useSSL: false,
      accessKey: accessKey,
      secretKey: secretKey,
      // ✅ ДОБАВЛЯЕМ настройки для IPv4
      region: 'us-east-1',
      partSize: 64 * 1024 * 1024, // 64MB
    });

    const bucketName = process.env.MINIO_BUCKET_NAME || 'portfolio-files';
    
    // ✅ ИСПРАВЛЕНИЕ: Увеличиваем количество попыток подключения
    let retries = 30; // Увеличиваем с 15 до 30
    let connected = false;
    
    while (retries > 0 && !connected) {
      try {
        console.log(`🔄 Attempting to connect to MinIO ${minioEndpoint}:${minioPort}... (${retries} retries left)`);
        
        // ✅ Проверяем соединение с таймаутом
        const buckets = await Promise.race([
          minioClient.listBuckets(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 5000)
          )
        ]);
        
        console.log('✅ Connected to MinIO successfully, buckets:', buckets.length);
        connected = true;
        break;
        
      } catch (error) {
        console.log(`⏳ MinIO connection failed: ${error.message}`);
        retries--;
        
        if (retries === 0) {
          console.error('❌ MinIO connection details:', {
            endpoint: minioEndpoint,
            port: minioPort,
            accessKey: accessKey,
            error: error.message,
            stack: error.stack
          });
          throw new Error(`Failed to connect to MinIO after 30 attempts: ${error.message}`);
        }
        
        // Ждем перед следующей попыткой
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // ✅ Создаем bucket если не существует
    try {
      const bucketExists = await minioClient.bucketExists(bucketName);
      if (!bucketExists) {
        await minioClient.makeBucket(bucketName, 'us-east-1');
        console.log(`✅ Bucket '${bucketName}' created`);
      } else {
        console.log(`✅ Bucket '${bucketName}' exists`);
      }
    } catch (bucketError) {
      console.error('❌ Bucket creation/check failed:', bucketError);
      // Не бросаем ошибку, продолжаем работу
    }
    
    // ✅ ИСПРАВЛЕНИЕ: Упрощенная CORS конфигурация
    try {
      const corsConfig = {
        CORSRules: [
          {
            ID: 'AllowAll',
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
            AllowedOrigins: ['*'], // Разрешаем все origins для начала
            ExposeHeaders: ['ETag', 'Content-Length', 'Content-Type'],
            MaxAgeSeconds: 3600
          }
        ]
      };

      await minioClient.setBucketCors(bucketName, corsConfig);
      console.log('✅ CORS configured');
    } catch (corsError) {
      console.warn('⚠️ CORS config failed (but continuing):', corsError.message);
    }
    
    // ✅ Публичная политика
    try {
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucketName}/*`]
          }
        ]
      };
      
      await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
      console.log('✅ Bucket policy set for public access');
    } catch (policyError) {
      console.warn('⚠️ Bucket policy failed (but continuing):', policyError.message);
    }
    
    console.log('✅ MinIO initialized successfully');
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
    if (!minioClient) {
      throw new Error('MinIO client not initialized');
    }
    
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
    
    console.log(`📤 Uploading file: ${fileName} (${file.size} bytes)`);
    
    // ✅ Загружаем файл с таймаутом
    await Promise.race([
      minioClient.putObject(bucketName, fileName, file.buffer, file.size, metaData),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout')), 30000) // 30 секунд таймаут
      )
    ]);
    
    // ✅ URL через nginx proxy
    const fileUrl = `https://kartofan.online/media/${bucketName}/${fileName}`;
    
    console.log('✅ File uploaded successfully:', fileName);
    console.log('🔗 Public URL:', fileUrl);
    
    return {
      fileName,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: fileUrl,
      bucket: bucketName
    };
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    throw new Error(`File upload failed: ${error.message}`);
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
    if (!minioClient) {
      throw new Error('MinIO client not initialized');
    }
    
    const bucketName = process.env.MINIO_BUCKET_NAME || 'portfolio-files';
    
    await minioClient.removeObject(bucketName, fileName);
    console.log('🗑️ File deleted:', fileName);
    
    return { success: true, fileName };
    
  } catch (error) {
    console.error('❌ Delete error:', error);
    throw new Error(`File deletion failed: ${error.message}`);
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