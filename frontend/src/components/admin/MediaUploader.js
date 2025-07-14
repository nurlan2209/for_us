// frontend/src/components/admin/MediaUploader.js
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { uploadAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const MediaUploader = ({ onFilesUploaded, existingFiles = [] }) => {
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});

  // Определение типа файла
  const getFileType = (file) => {
    const type = file.type;
    if (type.startsWith('image/')) {
      return file.type === 'image/gif' ? 'gif' : 'image';
    }
    if (type.startsWith('video/')) return 'video';
    return 'unknown';
  };

  // Валидация файлов
  const validateFile = (file) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/mov', 'video/avi'
    ];

    if (!allowedTypes.includes(file.type)) {
      return 'Unsupported file type. Please use JPG, PNG, GIF, WebP, MP4, WebM, MOV, or AVI.';
    }

    if (file.size > maxSize) {
      return 'File too large. Maximum size is 50MB.';
    }

    return null;
  };

  // Загрузка файлов
  const uploadFiles = async (files) => {
    const validFiles = [];
    const errors = [];

    // Валидация всех файлов
    files.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    // Показать ошибки валидации
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
    }

    if (validFiles.length === 0) return;

    setUploadingFiles(validFiles);
    const uploadedFiles = [];

    try {
      for (const file of validFiles) {
        const fileId = `${file.name}-${Date.now()}`;
        
        try {
          setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

          // Создание превью для видео
          let thumbnail = null;
          if (getFileType(file) === 'video') {
            thumbnail = await generateVideoThumbnail(file);
          }

          // Загрузка файла
          const response = await uploadAPI.uploadImage(file, (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
          });

          const uploadedFile = {
            id: Date.now() + Math.random(),
            url: response.data.file.url,
            type: getFileType(file),
            name: file.name,
            size: file.size,
            caption: '',
            thumbnail: thumbnail || (getFileType(file) === 'image' ? response.data.file.url : null),
            alt: ''
          };

          uploadedFiles.push(uploadedFile);
          setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));

        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          toast.error(`Failed to upload ${file.name}`);
          setUploadProgress(prev => ({ ...prev, [fileId]: -1 }));
        }
      }

      if (uploadedFiles.length > 0) {
        onFilesUploaded(uploadedFiles);
        toast.success(`${uploadedFiles.length} file(s) uploaded successfully`);
      }

    } finally {
      setUploadingFiles([]);
      setUploadProgress({});
    }
  };

  // Генерация превью для видео
  const generateVideoThumbnail = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.currentTime = 1; // Кадр на 1 секунде

      video.onloadeddata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          const thumbnailFile = new File([blob], `${file.name}-thumb.jpg`, { type: 'image/jpeg' });
          uploadAPI.uploadImage(thumbnailFile)
            .then(response => resolve(response.data.file.url))
            .catch(() => resolve(null));
        }, 'image/jpeg', 0.8);
        
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve(null);
      };
    });
  };

  // Dropzone настройки
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      uploadFiles(acceptedFiles);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov', '.avi']
    },
    maxFiles: 10,
    multiple: true
  });

  return (
    <div className="space-y-6">
      
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50'
        }`}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <div>
            <p className="text-lg font-medium text-neutral-900 mb-2">
              {isDragActive ? 'Drop files here' : 'Upload media files'}
            </p>
            <p className="text-sm text-neutral-600">
              Drag & drop or click to select images, GIFs, and videos
            </p>
            <p className="text-xs text-neutral-500 mt-2">
              Supported: JPG, PNG, GIF, WebP, MP4, WebM, MOV, AVI (max 50MB each)
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      <AnimatePresence>
        {uploadingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-neutral-50 rounded-lg p-4"
          >
            <h4 className="text-sm font-medium text-neutral-900 mb-3">
              Uploading {uploadingFiles.length} file(s)...
            </h4>
            <div className="space-y-3">
              {uploadingFiles.map((file) => {
                const fileId = `${file.name}-${Date.now()}`;
                const progress = uploadProgress[fileId] || 0;
                const hasError = progress === -1;
                
                return (
                  <div key={fileId} className="flex items-center space-x-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-neutral-700 truncate">
                          {file.name}
                        </span>
                        <span className={`text-xs ${hasError ? 'text-red-600' : 'text-neutral-500'}`}>
                          {hasError ? 'Error' : `${progress}%`}
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            hasError ? 'bg-red-500' : 'bg-blue-500'
                          }`}
                          style={{ width: hasError ? '100%' : `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing Files Preview */}
      {existingFiles.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-neutral-900 mb-3">
            Current Media ({existingFiles.length})
          </h4>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {existingFiles.map((file, index) => (
              <div key={file.id || index} className="relative group">
                <div className="aspect-square bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200">
                  {file.type === 'video' ? (
                    <div className="relative w-full h-full">
                      <img
                        src={file.thumbnail || '/placeholder-video.jpg'}
                        alt={file.alt || `Media ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  ) : file.type === 'gif' ? (
                    <div className="relative w-full h-full">
                      <img
                        src={file.url}
                        alt={file.alt || `Media ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1 right-1 bg-purple-500 text-white text-xs px-1 rounded">
                        GIF
                      </div>
                    </div>
                  ) : (
                    <img
                      src={file.url}
                      alt={file.alt || `Media ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                
                {/* File Info */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-200 rounded-lg flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-center">
                    <p className="text-white text-xs font-medium mb-1">
                      {file.name || `Media ${index + 1}`}
                    </p>
                    <p className="text-white/80 text-xs">
                      {file.type.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Tips:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Use high-quality images for best results</li>
          <li>• GIFs will auto-play in the gallery</li>
          <li>• Videos will generate automatic thumbnails</li>
          <li>• Optimal aspect ratio is 16:9 for videos</li>
          <li>• Maximum file size: 50MB per file</li>
        </ul>
      </div>
    </div>
  );
};

export default MediaUploader;