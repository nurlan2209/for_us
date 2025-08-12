// backend/src/services/minio.js - ИСПРАВЛЕННАЯ ВЕРСИЯ для Railway
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

let minioClient = null;

/**
 * Initialize MinIO client and create bucket
 */
async function initializeMinio() {
  try {
    console.log('🚀 Initializing MinIO...');
    
    // ✅ ИСПРАВЛЕНО: правильный endpoint для Railway
    const endpoint = process.env.RAILWAY_ENVIRONMENT_NAME ? 'localhost' : (process.env.MINIO_ENDPOINT || 'localhost');
    
    minioClient = new Minio.Client({
      endPoint: endpoint,
      port: parseInt(process.env.MINIO_PORT) || 9000,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123'
    });

    const bucketName = process.env.MINIO_BUCKET_NAME || 'portfolio-files';
    
    // ✅ Ждем чтобы MinIO точно запустился
    let retries = 10;
    while (retries > 0) {
      try {
        await minioClient.listBuckets();
        break;
      } catch (error) {
        console.log(`⏳ Waiting for MinIO... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        retries--;
        if (retries === 0) throw error;
      }
    }
    
    // Check if bucket exists, create if not
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`✅ Bucket '${bucketName}' created successfully`);
    } else {
      console.log(`✅ Bucket '${bucketName}' already exists`);
    }
    
    // ✅ ИСПРАВЛЕНИЕ: CORS политика для Railway
    const corsConfig = {
      CORSRules: [
        {
          ID: 'AllowAll',
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
          AllowedOrigins: [
            process.env.CORS_ORIGIN || 'https://production.railway.app',
            'http://localhost:3100',
            '*'  // Для разработки
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
      console.error('⚠️ CORS policy error:', corsError.message);
    }
    
    // ✅ ИСПРАВЛЕНИЕ: bucket policy для публичного доступа
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [
            `arn:aws:s3:::${bucketName}/images/*`,
            `arn:aws:s3:::${bucketName}/videos/*`,
            `arn:aws:s3:::${bucketName}/documents/*`
          ]
        }
      ]
    };
    
    try {
      await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
      console.log('✅ Bucket policy set for public access');
    } catch (policyError) {
      console.error('⚠️ Bucket policy error:', policyError.message);
    }
    
    console.log('✅ MinIO initialized successfully');
    return minioClient;
    
  } catch (error) {
    console.error('❌ Error initializing MinIO:', error);
    throw error;
  }
}

/**
 * Upload file to MinIO - ИСПРАВЛЕНО для Railway
 */
async function uploadFile(file, folder = 'uploads') {
  try {
    const client = getMinioClient();
    const bucketName = process.env.MINIO_BUCKET_NAME || 'portfolio-files';
    
    // Generate unique filename
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${folder}/${uuidv4()}.${fileExtension}`;
    
    const metaData = {
      'Content-Type': file.mimetype,
      'X-Original-Name': file.originalname,
      'X-Upload-Date': new Date().toISOString(),
      'Cache-Control': 'public, max-age=31536000',
    };
    
    // Upload file
    await client.putObject(bucketName, fileName, file.buffer, file.size, metaData);
    
    // ✅ ИСПРАВЛЕНО: правильный URL для Railway
    const baseUrl = process.env.RAILWAY_ENVIRONMENT_NAME 
      ? process.env.MINIO_PUBLIC_URL || `https://${process.env.RAILWAY_DOMAIN}`
      : process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';
    
    const fileUrl = `${baseUrl}/api/media/${bucketName}/${fileName}`;
    
    console.log('🔗 Generated URL:', fileUrl);
    
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
    
    // ✅ ИСПРАВЛЕНИЕ: возвращаем прямую ссылку через прокси
    const baseUrl = process.env.RAILWAY_ENVIRONMENT_NAME 
      ? process.env.MINIO_PUBLIC_URL || `https://${process.env.RAILWAY_DOMAIN}`
      : process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';
      
    return `${baseUrl}/api/media/${bucketName}/${fileName}`;
    
  } catch (error) {
    console.error('Error generating file URL:', error);
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