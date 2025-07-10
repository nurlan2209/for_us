// backend/src/routes/upload.js
import express from 'express';
import multer from 'multer';
import mime from 'mime-types';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { uploadFile, deleteFile, getFileUrl } from '../services/minio.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
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

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files at once
  }
});

/**
 * POST /api/upload/image
 * Upload image file (admin only)
 */
router.post('/image', verifyToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'Please select an image file to upload'
      });
    }

    // Validate file type
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only image files are allowed'
      });
    }

    // Upload to MinIO
    const result = await uploadFile(req.file, 'images');

    res.json({
      message: 'Image uploaded successfully',
      file: result
    });

  } catch (error) {
    console.error('Image upload error:', error);
    
    if (error.message.includes('File too large')) {
      return res.status(413).json({
        error: 'File too large',
        message: 'Image must be smaller than 10MB'
      });
    }
    
    res.status(500).json({
      error: 'Upload failed',
      message: 'Failed to upload image'
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

    // Upload to MinIO
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
router.post('/multiple', verifyToken, requireAdmin, upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files provided',
        message: 'Please select files to upload'
      });
    }

    const uploadPromises = req.files.map(file => {
      const folder = file.mimetype.startsWith('image/') ? 'images' : 'documents';
      return uploadFile(file, folder);
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

    // Delete from MinIO
    await deleteFile(fileName);

    res.json({
      message: 'File deleted successfully',
      fileName
    });

  } catch (error) {
    console.error('File deletion error:', error);
    
    if (error.code === 'NoSuchKey') {
      return res.status(404).json({
        error: 'File not found',
        message: 'The specified file does not exist'
      });
    }
    
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
 * Error handler for multer
 */
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File too large',
        message: 'File must be smaller than 10MB'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'Maximum 5 files allowed'
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