// backend/src/services/minio.js
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
      
      // Set bucket policy for public read access to images
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucketName}/images/*`]
          }
        ]
      };
      
      try {
        await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
        console.log('✅ Bucket policy set for public image access');
      } catch (policyError) {
        console.log('⚠️  Could not set bucket policy (not critical):', policyError.message);
      }
    } else {
      console.log(`✅ Bucket '${bucketName}' already exists`);
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
    
    // Set metadata
    const metaData = {
      'Content-Type': file.mimetype,
      'X-Original-Name': file.originalname,
      'X-Upload-Date': new Date().toISOString()
    };
    
    // Upload file
    await client.putObject(bucketName, fileName, file.buffer, file.size, metaData);
    
    // ✅ Генерируем правильный URL для браузера
    const minioPublicUrl = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';
    const fileUrl = `${minioPublicUrl}/${bucketName}/${fileName}`;
    
    console.log('🔗 Generated file URL:', fileUrl);
    
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
    
    // For public files (images), return direct URL
    if (fileName.startsWith('images/')) {
      const minioPublicUrl = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';
      return `${minioPublicUrl}/${bucketName}/${fileName}`;
    }
    
    // For private files, generate presigned URL
    const url = await client.presignedGetObject(bucketName, fileName, expiry);
    return url;
    
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