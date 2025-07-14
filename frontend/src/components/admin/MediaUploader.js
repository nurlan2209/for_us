// frontend/src/components/admin/MediaUploader.js - Обновленная версия
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { uploadAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const MediaUploader = ({ onFilesUploaded, existingFiles = [], onFilesReorder }) => {
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [draggedIndex, setDraggedIndex] = useState(null);

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
      video.currentTime = 1;

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

  // Drag & Drop для загрузки
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

  // Drag & Drop для сортировки медиафайлов
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newFiles = [...existingFiles];
    const draggedFile = newFiles[draggedIndex];
    
    // Удаляем из старой позиции
    newFiles.splice(draggedIndex, 1);
    // Вставляем в новую позицию
    newFiles.splice(dropIndex, 0, draggedFile);
    
    onFilesReorder(newFiles);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Удаление медиафайла
  const handleRemoveMedia = (index) => {
    const newFiles = existingFiles.filter((_, i) => i !== index);
    onFilesReorder(newFiles);
  };

  // Проверка что первый файл - изображение
  const isFirstFileImage = existingFiles.length === 0 || existingFiles[0]?.type === 'image';

  return (
    <div className="space-y-6">
      
      {/* Предупреждение о обложке */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900">Cover Image Requirements</h4>
            <div className="mt-1 text-sm text-blue-700">
              <p>• First media file will be used as project cover</p>
              <p>• Cover must be an image (JPG, PNG, WebP, GIF)</p>
              <p>• Videos can only be added after the cover image</p>
              <p>• Drag & drop to reorder media files</p>
            </div>
          </div>
        </div>
      </div>

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
              Drag & drop or click to select images and videos
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

      {/* Existing Files with Drag & Drop Sorting */}
      {existingFiles.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-neutral-900">
              Project Media ({existingFiles.length})
            </h4>
            {!isFirstFileImage && (
              <div className="flex items-center space-x-2 text-amber-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-medium">First file must be an image!</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {existingFiles.map((file, index) => (
              <motion.div
                key={file.id || index}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`relative group cursor-move border-2 rounded-lg overflow-hidden transition-all ${
                  index === 0 
                    ? (file.type === 'image' ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50')
                    : 'border-neutral-200 hover:border-neutral-300'
                } ${draggedIndex === index ? 'opacity-50 transform rotate-3' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                {/* Cover indicator */}
                {index === 0 && (
                  <div className={`absolute top-2 left-2 z-10 px-2 py-1 rounded text-xs font-medium ${
                    file.type === 'image' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}>
                    {file.type === 'image' ? 'COVER' : 'INVALID COVER!'}
                  </div>
                )}

                {/* File preview */}
                <div className="aspect-square bg-neutral-100 flex items-center justify-center">
                  {file.type === 'video' ? (
                    <div className="relative w-full h-full">
                      <img
                        src={file.thumbnail || '/placeholder-video.jpg'}
                        alt={file.alt || `Media ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
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
                      <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-1 rounded">
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

                {/* File info */}
                <div className="p-2 bg-white">
                  <p className="text-xs font-medium text-neutral-900 truncate">
                    {file.name || `Media ${index + 1}`}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {file.type.toUpperCase()} • {(file.size / 1024 / 1024).toFixed(1)}MB
                  </p>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemoveMedia(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Drag handle */}
                <div className="absolute bottom-2 right-2 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Drag instructions */}
          <div className="mt-4 text-xs text-neutral-500 text-center">
            💡 Drag files to reorder • First file is always the project cover
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Tips:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• First media file becomes the project cover (must be image)</li>
          <li>• Use high-quality images for best results</li>
          <li>• GIFs will auto-play in the gallery</li>
          <li>• Videos will generate automatic thumbnails</li>
          <li>• Drag & drop files to change their order</li>
          <li>• Optimal aspect ratio is 16:9 for videos</li>
        </ul>
      </div>
    </div>
  );
};

export default MediaUploader;