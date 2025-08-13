// backend/src/services/minio.js - КОНФИГУРАЦИЯ ДЛЯ NGINX
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

let minioClient = null;

/**
 * Initialize MinIO client and create bucket
 */
async function initializeMinio() {
  try {
    console.log('🚀 Initializing MinIO for nginx...');
    
    // ✅ nginx: MinIO подключение через localhost (внутри Docker)
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    
    minioClient = new Minio.Client({
      endPoint: endpoint,
      port: parseInt(process.env.MINIO_PORT) || 9000,
      useSSL: false, // nginx терминирует SSL
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123'
    });

    const bucketName = process.env.MINIO_BUCKET_NAME || 'portfolio-files';
    
    // ✅ Ждем MinIO
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
    
    // ✅ nginx: CORS политика для работы через nginx proxy
    const corsConfig = {
      CORSRules: [
        {
          ID: 'AllowNginxProxy',
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
          AllowedOrigins: [
            'https://kartofan.online',
            'http://localhost:3100',
            '*'  // Для разработки
          ],
          ExposeHeaders: [
            'ETag',
            'Content-Range', 
            'Content-Length',
            'Content-Type',
            'Last-Modified',
            'Accept-Ranges'
          ],
          MaxAgeSeconds: 3600
        }
      ]
    };

    try {
      await minioClient.setBucketCors(bucketName, corsConfig);
      console.log('✅ CORS policy set for nginx proxy');
    } catch (corsError) {
      console.error('⚠️ CORS policy error:', corsError.message);
    }
    
    // ✅ nginx: bucket policy для публичного доступа через /media/
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
      console.log('✅ Bucket policy set for public access via nginx');
    } catch (policyError) {
      console.error('⚠️ Bucket policy error:', policyError.message);
    }
    
    console.log('✅ MinIO initialized successfully for nginx proxy');
    return minioClient;
    
  } catch (error) {
    console.error('❌ Error initializing MinIO:', error);
    throw error;
  }
}

/**
 * Upload file to MinIO - для nginx
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
    
    // ✅ nginx: URL через nginx proxy /media/
    const fileUrl = `https://kartofan.online/media/${bucketName}/${fileName}`;
    
    console.log('🔗 Generated URL via nginx:', fileUrl);
    
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
 * Get file URL - через nginx proxy
 */
async function getFileUrl(fileName, expiry = 24 * 60 * 60) {
  try {
    const bucketName = process.env.MINIO_BUCKET_NAME || 'portfolio-files';
    
    // ✅ nginx: возвращаем прямую ссылку через nginx proxy
    return `https://kartofan.online/media/${bucketName}/${fileName}`;
    
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