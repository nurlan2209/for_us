// backend/src/routes/upload.js - Обновленная версия с поддержкой видео и GIF

import express from 'express';
import multer from 'multer';
import mime from 'mime-types';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { uploadFile, deleteFile, getFileUrl } from '../services/minio.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter with expanded support
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    // Images
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Videos
    'video/mp4',
    'video/webm',
    'video/mov',
    'video/avi',
    'video/quicktime',
    // Documents
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

// Configure multer with increased limits
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for videos
    files: 10 // Max 10 files at once
  }
});

/**
 * POST /api/upload/image
 * Upload image file (admin only) - now supports videos too
 */
router.post('/image', verifyToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'Please select a file to upload'
      });
    }

    // Determine file type and folder
    let folder = 'images';
    const fileType = req.file.mimetype;
    
    if (fileType.startsWith('video/')) {
      folder = 'videos';
    } else if (fileType.startsWith('image/')) {
      folder = 'images';
    } else {
      folder = 'documents';
    }

    // Upload to MinIO
    const result = await uploadFile(req.file, folder);

    // Add additional metadata for videos and GIFs
    const fileMetadata = {
      ...result,
      type: getFileTypeFromMime(fileType),
      isVideo: fileType.startsWith('video/'),
      isGif: fileType === 'image/gif',
      duration: null, // Could be extracted with ffprobe in production
    };

    res.json({
      message: 'File uploaded successfully',
      file: fileMetadata
    });

  } catch (error) {
    console.error('File upload error:', error);
    
    if (error.message.includes('File too large')) {
      return res.status(413).json({
        error: 'File too large',
        message: 'File must be smaller than 50MB'
      });
    }
    
    res.status(500).json({
      error: 'Upload failed',
      message: 'Failed to upload file'
    });
  }
});

/**
 * POST /api/upload/video
 * Upload video file specifically (admin only)
 */
router.post('/video', verifyToken, requireAdmin, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'Please select a video file to upload'
      });
    }

    // Validate video file type
    if (!req.file.mimetype.startsWith('video/')) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only video files are allowed'
      });
    }

    // Upload to MinIO videos folder
    const result = await uploadFile(req.file, 'videos');

    const videoMetadata = {
      ...result,
      type: 'video',
      isVideo: true,
      duration: null, // Could be extracted with ffprobe in production
    };

    res.json({
      message: 'Video uploaded successfully',
      file: videoMetadata
    });

  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: 'Failed to upload video'
    });
  }
});

/**
 * POST /api/upload/document
 * Upload document file (admin only)
 */
router.post('/document', verifyToken, requireAdmin, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'Please select a document to upload'
      });
    }

    // Upload to MinIO documents folder
    const result = await uploadFile(req.file, 'documents');

    res.json({
      message: 'Document uploaded successfully',
      file: result
    });

  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: 'Failed to upload document'
    });
  }
});

/**
 * POST /api/upload/multiple
 * Upload multiple files (admin only)
 */
router.post('/multiple', verifyToken, requireAdmin, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files provided',
        message: 'Please select files to upload'
      });
    }

    const uploadPromises = req.files.map(file => {
      let folder = 'documents';
      
      if (file.mimetype.startsWith('image/')) {
        folder = 'images';
      } else if (file.mimetype.startsWith('video/')) {
        folder = 'videos';
      }
      
      return uploadFile(file, folder).then(result => ({
        ...result,
        type: getFileTypeFromMime(file.mimetype),
        isVideo: file.mimetype.startsWith('video/'),
        isGif: file.mimetype === 'image/gif',
      }));
    });

    const results = await Promise.all(uploadPromises);

    res.json({
      message: `${results.length} files uploaded successfully`,
      files: results
    });

  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: 'Failed to upload files'
    });
  }
});

/**
 * DELETE /api/upload/:fileName
 * Delete uploaded file (admin only)
 */
router.delete('/:fileName', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { fileName } = req.params;
    
    if (!fileName) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'File name is required'
      });
    }

    // Try to delete from different folders
    const possiblePaths = [
      fileName,
      `images/${fileName}`,
      `videos/${fileName}`,
      `documents/${fileName}`
    ];

    let deleted = false;
    let deletedPath = '';

    for (const path of possiblePaths) {
      try {
        await deleteFile(path);
        deleted = true;
        deletedPath = path;
        break;
      } catch (error) {
        // Continue trying other paths
        continue;
      }
    }

    if (!deleted) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The specified file does not exist'
      });
    }

    res.json({
      message: 'File deleted successfully',
      fileName: deletedPath
    });

  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({
      error: 'Deletion failed',
      message: 'Failed to delete file'
    });
  }
});

/**
 * GET /api/upload/url/:fileName
 * Get file URL (public for images, signed for documents)
 */
router.get('/url/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    const { expiry = 3600 } = req.query; // Default 1 hour

    if (!fileName) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'File name is required'
      });
    }

    const url = await getFileUrl(fileName, parseInt(expiry));

    res.json({
      url,
      fileName,
      expiresIn: fileName.startsWith('images/') ? null : parseInt(expiry)
    });

  } catch (error) {
    console.error('Get file URL error:', error);
    res.status(500).json({
      error: 'Failed to generate URL',
      message: 'Could not generate file URL'
    });
  }
});

/**
 * GET /api/upload/metadata/:fileName
 * Get file metadata (admin only)
 */
router.get('/metadata/:fileName', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { fileName } = req.params;
    
    if (!fileName) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'File name is required'
      });
    }

    // This would typically involve getting file stats from MinIO
    // For now, return basic metadata
    res.json({
      fileName,
      type: getFileTypeFromPath(fileName),
      url: await getFileUrl(fileName),
    });

  } catch (error) {
    console.error('Get file metadata error:', error);
    res.status(500).json({
      error: 'Failed to get metadata',
      message: 'Could not retrieve file metadata'
    });
  }
});

// Helper functions
function getFileTypeFromMime(mimeType) {
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'image/gif') return 'gif';
  if (mimeType.startsWith('image/')) return 'image';
  return 'document';
}

function getFileTypeFromPath(filePath) {
  const extension = filePath.split('.').pop().toLowerCase();
  
  if (['mp4', 'webm', 'mov', 'avi'].includes(extension)) return 'video';
  if (extension === 'gif') return 'gif';
  if (['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(extension)) return 'image';
  return 'document';
}

/**
 * Error handler for multer
 */
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File too large',
        message: 'File must be smaller than 50MB'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'Maximum 10 files allowed'
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected file',
        message: 'Unexpected file field'
      });
    }
  }
  
  if (error.message.includes('not allowed')) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: error.message
    });
  }
  
  next(error);
});

export default router;