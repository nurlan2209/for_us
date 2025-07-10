// frontend/src/components/admin/ProjectForm.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from 'react-query';
import { projectsAPI, uploadAPI } from '../../utils/api';
import { MiniSpinner } from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

// Project validation schema
const projectSchema = z.object({
  title: z.string().min(1, 'Название обязательно').max(100, 'Название слишком длинное'),
  description: z.string().min(1, 'Описание обязательно').max(1000, 'Описание слишком длинное'),
  technologies: z.string().min(1, 'Технологии обязательны').max(200, 'Список технологий слишком длинный'),
  projectUrl: z.string().url('Некорректный URL').optional().or(z.literal('')),
  githubUrl: z.string().url('Некорректный URL').optional().or(z.literal('')),
  featured: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  sortOrder: z.number().int().min(0).default(0),
});

const ProjectForm = ({ project, onClose, onSuccess }) => {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(project?.imageUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const isEditing = !!project?.id;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      description: '',
      technologies: '',
      projectUrl: '',
      githubUrl: '',
      featured: false,
      status: 'draft',
      sortOrder: 0,
      ...project,
    },
  });

  // Load project data when editing
  useEffect(() => {
    if (project) {
      reset({
        title: project.title || '',
        description: project.description || '',
        technologies: project.technologies || '',
        projectUrl: project.projectUrl || '',
        githubUrl: project.githubUrl || '',
        featured: project.featured || false,
        status: project.status || 'draft',
        sortOrder: project.sortOrder || 0,
      });
      setImagePreview(project.imageUrl || '');
    }
  }, [project, reset]);

  // Create/Update mutations
  const createMutation = useMutation(
    (data) => projectsAPI.create(data),
    {
      onSuccess: () => {
        toast.success('Проект создан');
        queryClient.invalidateQueries('admin-projects');
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Ошибка создания');
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => projectsAPI.update(id, data),
    {
      onSuccess: () => {
        toast.success('Проект обновлен');
        queryClient.invalidateQueries('admin-projects');
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Ошибка обновления');
      },
    }
  );

  // Handle image upload
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Можно загружать только изображения');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 10MB');
      return;
    }

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Upload image
  const uploadImage = async () => {
    if (!imageFile) return imagePreview;

    setIsUploading(true);
    try {
      const response = await uploadAPI.uploadImage(imageFile);
      return response.data.file.url;
    } catch (error) {
      toast.error('Ошибка загрузки изображения');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Form submission
  const onSubmit = async (data) => {
    try {
      // Upload image if new file selected
      let imageUrl = imagePreview;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const projectData = {
        ...data,
        imageUrl,
      };

      if (isEditing) {
        updateMutation.mutate({ id: project.id, data: projectData });
      } else {
        createMutation.mutate(projectData);
      }
    } catch (error) {
      // Error handled in upload function
    }
  };

  const isLoading = isSubmitting || isUploading || createMutation.isLoading || updateMutation.isLoading;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">
            {isEditing ? 'Редактировать проект' : 'Создать проект'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Title */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Название проекта *
                </label>
                <input
                  {...register('title')}
                  type="text"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="Название проекта"
                />
                {errors.title && (
                  <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              {/* Technologies */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Технологии *
                </label>
                <input
                  {...register('technologies')}
                  type="text"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="React, Three.js, Node.js"
                />
                <p className="text-gray-400 text-xs mt-1">Разделяйте запятыми</p>
                {errors.technologies && (
                  <p className="text-red-400 text-sm mt-1">{errors.technologies.message}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-white font-medium mb-2">
                Описание *
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors resize-vertical"
                placeholder="Подробное описание проекта..."
              />
              {errors.description && (
                <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* URLs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-medium mb-2">
                  URL проекта
                </label>
                <input
                  {...register('projectUrl')}
                  type="url"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="https://example.com"
                />
                {errors.projectUrl && (
                  <p className="text-red-400 text-sm mt-1">{errors.projectUrl.message}</p>
                )}
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  GitHub URL
                </label>
                <input
                  {...register('githubUrl')}
                  type="url"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="https://github.com/user/repo"
                />
                {errors.githubUrl && (
                  <p className="text-red-400 text-sm mt-1">{errors.githubUrl.message}</p>
                )}
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-white font-medium mb-2">
                Изображение проекта
              </label>
              <div className="space-y-4">
                {/* Upload button */}
                <div className="flex items-center space-x-4">
                  <label className="cursor-pointer bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Выбрать изображение
                    </span>
                  </label>
                  {imageFile && (
                    <span className="text-sm text-gray-400">
                      {imageFile.name}
                    </span>
                  )}
                </div>

                {/* Image preview */}
                {imagePreview && (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        setImageFile(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition-colors"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Status */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Статус
                </label>
                <select
                  {...register('status')}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors"
                >
                  <option value="draft">Черновик</option>
                  <option value="published">Опубликован</option>
                  <option value="archived">Архив</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Порядок сортировки
                </label>
                <input
                  {...register('sortOrder', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="0"
                />
                <p className="text-gray-400 text-xs mt-1">Меньше = выше в списке</p>
              </div>

              {/* Featured */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Настройки
                </label>
                <label className="flex items-center space-x-3 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-700 transition-colors">
                  <input
                    {...register('featured')}
                    type="checkbox"
                    className="w-4 h-4 text-primary-500 bg-gray-700 border-gray-600 rounded focus:ring-primary-500 focus:ring-2"
                  />
                  <span className="text-white">
                    Избранный проект
                  </span>
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-400 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition-colors"
                disabled={isLoading}
              >
                Отмена
              </button>
              
              <button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl disabled:shadow-none"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <MiniSpinner />
                    <span>
                      {isUploading ? 'Загрузка...' : 
                       isEditing ? 'Обновление...' : 'Создание...'}
                    </span>
                  </div>
                ) : (
                  isEditing ? 'Обновить проект' : 'Создать проект'
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProjectForm;