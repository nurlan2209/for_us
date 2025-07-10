// frontend/src/hooks/useUpload.js
import { useState } from 'react';
import { useMutation } from 'react-query';
import { uploadAPI } from '../utils/api';
import toast from 'react-hot-toast';

// Загрузка изображения
export const useUploadImage = () => {
  const [uploadProgress, setUploadProgress] = useState(0);

  const mutation = useMutation(
    (file) => uploadAPI.uploadImage(file, (progressEvent) => {
      const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      setUploadProgress(progress);
    }),
    {
      onSuccess: (response) => {
        setUploadProgress(0);
        toast.success('Изображение загружено успешно!');
        return response.data.file;
      },
      onError: (error) => {
        setUploadProgress(0);
        const message = error.response?.data?.message || 'Ошибка при загрузке изображения';
        toast.error(message);
      },
    }
  );

  return {
    ...mutation,
    uploadProgress,
  };
};

// Загрузка документа
export const useUploadDocument = () => {
  const [uploadProgress, setUploadProgress] = useState(0);

  const mutation = useMutation(
    (file) => uploadAPI.uploadDocument(file, (progressEvent) => {
      const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      setUploadProgress(progress);
    }),
    {
      onSuccess: (response) => {
        setUploadProgress(0);
        toast.success('Документ загружен успешно!');
        return response.data.file;
      },
      onError: (error) => {
        setUploadProgress(0);
        const message = error.response?.data?.message || 'Ошибка при загрузке документа';
        toast.error(message);
      },
    }
  );

  return {
    ...mutation,
    uploadProgress,
  };
};

// Множественная загрузка
export const useUploadMultiple = () => {
  const [uploadProgress, setUploadProgress] = useState(0);

  const mutation = useMutation(
    (files) => uploadAPI.uploadMultiple(files, (progressEvent) => {
      const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      setUploadProgress(progress);
    }),
    {
      onSuccess: (response) => {
        setUploadProgress(0);
        toast.success(`${response.data.files.length} файлов загружено успешно!`);
        return response.data.files;
      },
      onError: (error) => {
        setUploadProgress(0);
        const message = error.response?.data?.message || 'Ошибка при загрузке файлов';
        toast.error(message);
      },
    }
  );

  return {
    ...mutation,
    uploadProgress,
  };
};

// Удаление файла
export const useDeleteFile = () => {
  return useMutation(
    (fileName) => uploadAPI.deleteFile(fileName),
    {
      onSuccess: () => {
        toast.success('Файл удален успешно!');
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Ошибка при удалении файла';
        toast.error(message);
      },
    }
  );
};

// Кастомный хук для drag & drop загрузки
export const useDragAndDrop = (onFileDrop, acceptedTypes = ['image/*']) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => 
      acceptedTypes.some(type => file.type.match(type.replace('*', '.*')))
    );

    if (validFiles.length !== files.length) {
      toast.error('Некоторые файлы имеют неподдерживаемый формат');
    }

    if (validFiles.length > 0) {
      onFileDrop(validFiles);
    }
  };

  return {
    isDragging,
    dragProps: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
  };
};