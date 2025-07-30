// frontend/src/components/admin/ProjectForm.js - Без featured + предзаполнение при редактировании
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from 'react-query';
import { projectsAPI } from '../../utils/api';
import MediaUploader from './MediaUploader';
import toast from 'react-hot-toast';

const projectSchema = z.object({
  title: z.string().min(1, 'Title required').max(100, 'Title too long'),
  description: z.string().min(1, 'Description required').max(1000, 'Description too long'),
  technologies: z.string().min(1, 'Technologies required').max(200, 'Technologies list too long'),
  category: z.string().min(1, 'Category required').max(50, 'Category name too long'),
  // ❌ УДАЛЕНО: featured: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  sortOrder: z.number().int().min(0).default(0),
  customButtons: z.array(z.object({
    text: z.string().min(1, 'Button text required'),
    url: z.string().url('Invalid URL')
  })).optional().default([]),
});

const ProjectForm = ({ project, onClose, onSuccess }) => {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [hasMediaValidationError, setHasMediaValidationError] = useState(false);
  const [categoryInput, setCategoryInput] = useState('');
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const queryClient = useQueryClient();

  const isEditing = !!project?.id;

  // Получаем существующие категории
  const { data: categoriesData } = useQuery(
    'project-categories',
    () => projectsAPI.getCategories(),
    {
      select: (response) => response.data.categories,
      staleTime: 5 * 60 * 1000,
    }
  );

  const existingCategories = categoriesData || [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      description: '',
      technologies: '',
      category: '',
      // ❌ УДАЛЕНО: featured: false,
      status: 'draft',
      sortOrder: 0,
      customButtons: [],
    },
  });

  const { fields: buttonFields, append: appendButton, remove: removeButton } = useFieldArray({
    control,
    name: 'customButtons'
  });

  const watchedCategory = watch('category');

  // ✅ ИСПРАВЛЕНО: Правильное предзаполнение формы при редактировании
  useEffect(() => {
    if (project && isEditing) {
      console.log('Заполняем форму данными проекта:', project);
      
      // Предзаполняем все поля
      reset({
        title: project.title || '',
        description: project.description || '',
        technologies: project.technologies || '',
        category: project.category || '',
        // ❌ УДАЛЕНО: featured: project.featured || false,
        status: project.status || 'published',
        sortOrder: project.sortOrder || 0,
        customButtons: project.customButtons || [],
      });
      
      // Предзаполняем медиафайлы
      setMediaFiles(project.mediaFiles || []);
      
      console.log('Форма заполнена:', {
        title: project.title,
        category: project.category,
        mediaFiles: project.mediaFiles?.length || 0
      });
    } else if (!isEditing) {
      // При создании нового проекта очищаем форму
      reset({
        title: '',
        description: '',
        technologies: '',
        category: '',
        status: 'draft',
        sortOrder: 0,
        customButtons: [],
      });
      setMediaFiles([]);
    }
  }, [project, reset, isEditing]);

  // Валидация медиафайлов
  useEffect(() => {
    const firstFileIsNotImage = mediaFiles.length > 0 && mediaFiles[0].type !== 'image';
    setHasMediaValidationError(firstFileIsNotImage);
  }, [mediaFiles]);

  const createMutation = useMutation(
    (data) => projectsAPI.create(data),
    {
      onSuccess: () => {
        toast.success('Project created');
        queryClient.invalidateQueries('admin-projects');
        queryClient.invalidateQueries('project-categories');
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Create error');
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => projectsAPI.update(id, data),
    {
      onSuccess: () => {
        toast.success('Project updated');
        queryClient.invalidateQueries('admin-projects');
        queryClient.invalidateQueries('project-categories');
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Update error');
      },
    }
  );

  const handleMediaFilesChange = (newFiles) => {
    setMediaFiles(prev => [...prev, ...newFiles]);
  };

  const handleMediaFilesReorder = (reorderedFiles) => {
    setMediaFiles(reorderedFiles);
  };

  const handleRemoveMedia = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleMediaCaptionChange = (index, caption) => {
    setMediaFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, caption } : file
    ));
  };

  // Обработка выбора категории
  const handleCategorySelect = (category) => {
    if (category === 'NEW_CATEGORY') {
      setShowCategoryInput(true);
      setCategoryInput('');
    } else {
      setValue('category', category);
      setShowCategoryInput(false);
    }
  };

  // Обработка создания новой категории
  const handleNewCategorySubmit = () => {
    if (categoryInput.trim()) {
      setValue('category', categoryInput.trim());
      setShowCategoryInput(false);
      setCategoryInput('');
    }
  };

  const onSubmit = async (data) => {
    // Валидация медиафайлов перед отправкой
    if (mediaFiles.length > 0 && mediaFiles[0].type !== 'image') {
      toast.error('First media file must be an image for project cover!');
      setActiveTab('media');
      return;
    }

    const projectData = {
      ...data,
      mediaFiles,
      // Убираем старые поля для совместимости
      imageUrl: mediaFiles.length > 0 ? mediaFiles[0].url : null,
    };

    console.log('Отправляем данные:', projectData);

    if (isEditing) {
      updateMutation.mutate({ id: project.id, data: projectData });
    } else {
      createMutation.mutate(projectData);
    }
  };

  const isLoading = isSubmitting || createMutation.isLoading || updateMutation.isLoading;

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: '📝' },
    { 
      id: 'media', 
      name: 'Media', 
      icon: '🖼️',
      hasError: hasMediaValidationError 
    },
    { id: 'buttons', name: 'Buttons', icon: '🔗' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/50" />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-light text-neutral-900">
            {isEditing ? `Edit: ${project?.title || 'Project'}` : 'New Project'}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-neutral-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-neutral-900 text-neutral-900'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                } ${tab.hasError ? 'text-red-600' : ''}`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
                {tab.hasError && (
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                {/* ✅ ОТЛАДОЧНАЯ ИНФОРМАЦИЯ (убрать в продакшене) */}
                {isEditing && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
                    <strong>Debug:</strong> Editing project "{project?.title}" (ID: {project?.id})
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Title *
                    </label>
                    <input
                      {...register('title')}
                      type="text"
                      className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:border-neutral-500 transition-colors"
                      placeholder="Project title"
                    />
                    {errors.title && (
                      <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>
                    )}
                  </div>

                  {/* Поле категории */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Category *
                    </label>
                    {!showCategoryInput ? (
                      <select
                        {...register('category')}
                        onChange={(e) => handleCategorySelect(e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:border-neutral-500 transition-colors"
                      >
                        <option value="">Select category</option>
                        {existingCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                        <option value="NEW_CATEGORY">+ Create New Category</option>
                      </select>
                    ) : (
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={categoryInput}
                          onChange={(e) => setCategoryInput(e.target.value)}
                          placeholder="Enter new category"
                          className="flex-1 px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:border-neutral-500 transition-colors"
                          onKeyPress={(e) => e.key === 'Enter' && handleNewCategorySubmit()}
                        />
                        <button
                          type="button"
                          onClick={handleNewCategorySubmit}
                          className="px-3 py-2 bg-neutral-900 text-white text-sm rounded hover:bg-neutral-800 transition-colors"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCategoryInput(false)}
                          className="px-3 py-2 border border-neutral-300 text-sm rounded hover:bg-neutral-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    {errors.category && (
                      <p className="text-xs text-red-600 mt-1">{errors.category.message}</p>
                    )}
                    {watchedCategory && (
                      <p className="text-xs text-neutral-500 mt-1">Selected: {watchedCategory}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Technologies *
                    </label>
                    <input
                      {...register('technologies')}
                      type="text"
                      className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:border-neutral-500 transition-colors"
                      placeholder="React, Three.js, Node.js"
                    />
                    {errors.technologies && (
                      <p className="text-xs text-red-600 mt-1">{errors.technologies.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Description *
                  </label>
                  <textarea
                    {...register('description')}
                    rows={6}
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:border-neutral-500 transition-colors resize-vertical"
                    placeholder="Project description..."
                  />
                  {errors.description && (
                    <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Media Tab */}
            {activeTab === 'media' && (
              <div className="space-y-6">
                {/* Media validation error */}
                {hasMediaValidationError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-red-900">Invalid Cover File</h4>
                        <p className="mt-1 text-sm text-red-700">
                          The first media file must be an image (JPG, PNG, WebP, or GIF) to serve as the project cover. 
                          Please drag an image to the first position or remove the video from the first position.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <MediaUploader
                  onFilesUploaded={handleMediaFilesChange}
                  onFilesReorder={handleMediaFilesReorder}
                  existingFiles={mediaFiles}
                />

                {/* Media List with Captions */}
                {mediaFiles.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-neutral-900">
                      Media Captions & Details ({mediaFiles.length})
                    </h4>
                    {mediaFiles.map((file, index) => (
                      <div key={file.id || index} className="border border-neutral-200 rounded-lg p-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-16 h-16 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                            {index === 0 && (
                              <div className={`absolute -top-1 -left-1 z-10 px-1 py-0.5 rounded text-xs font-bold ${
                                file.type === 'image' 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-red-500 text-white'
                              }`}>
                                {file.type === 'image' ? 'COVER' : 'ERROR'}
                              </div>
                            )}
                            {file.type === 'video' ? (
                              <img
                                src={file.thumbnail || '/placeholder-video.jpg'}
                                alt={`Media ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img
                                src={file.url}
                                alt={`Media ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-neutral-900">
                                  {file.name || `Media ${index + 1}`}
                                  {index === 0 && (
                                    <span className={`ml-2 text-xs px-2 py-1 rounded ${
                                      file.type === 'image' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {file.type === 'image' ? 'Project Cover' : 'Invalid Cover!'}
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-neutral-500">
                                  {file.type.toUpperCase()} • {(file.size / 1024 / 1024).toFixed(1)}MB
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveMedia(index)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                            
                            <input
                              type="text"
                              placeholder="Add caption (optional)"
                              value={file.caption || ''}
                              onChange={(e) => handleMediaCaptionChange(index, e.target.value)}
                              className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:border-neutral-500 transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Buttons Tab */}
            {activeTab === 'buttons' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-neutral-900">Custom Buttons</h3>
                    <p className="text-sm text-neutral-600 mt-1">
                      Add custom action buttons like "View Live", "GitHub", "Documentation", etc.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => appendButton({ text: '', url: '' })}
                    className="px-4 py-2 bg-neutral-900 text-white text-sm rounded hover:bg-neutral-800 transition-colors"
                  >
                    Add Button
                  </button>
                </div>

                {buttonFields.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-neutral-200 rounded-lg">
                    <svg className="w-12 h-12 mx-auto mb-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <h3 className="text-neutral-600 font-medium mb-1">No custom buttons</h3>
                    <p className="text-neutral-500 text-sm mb-4">Add buttons for project links, demos, or documentation</p>
                    <button
                      type="button"
                      onClick={() => appendButton({ text: '', url: '' })}
                      className="px-4 py-2 bg-neutral-900 text-white text-sm rounded hover:bg-neutral-800 transition-colors"
                    >
                      Add First Button
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  {buttonFields.map((field, index) => (
                    <div key={field.id} className="p-4 border border-neutral-200 rounded-lg">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="text-sm font-medium text-neutral-900">
                          Button #{index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeButton(index)}
                          className="text-red-500 hover:text-red-700 transition-colors text-sm"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-900 mb-2">
                            Button Text *
                          </label>
                          <input
                            {...register(`customButtons.${index}.text`)}
                            className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:border-neutral-500 transition-colors"
                            placeholder="e.g., View Live, GitHub, Documentation"
                          />
                          {errors.customButtons?.[index]?.text && (
                            <p className="text-red-600 text-xs mt-1">
                              {errors.customButtons[index].text.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-900 mb-2">
                            URL *
                          </label>
                          <input
                            {...register(`customButtons.${index}.url`)}
                            className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:border-neutral-500 transition-colors"
                            placeholder="https://example.com"
                          />
                          {errors.customButtons?.[index]?.url && (
                            <p className="text-red-600 text-xs mt-1">
                              {errors.customButtons[index].url.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Examples */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Examples:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-700">
                    <div><strong>View Live:</strong> https://myproject.com</div>
                    <div><strong>GitHub:</strong> https://github.com/user/repo</div>
                    <div><strong>Documentation:</strong> https://docs.myproject.com</div>
                    <div><strong>Case Study:</strong> https://behance.net/project</div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Status
                    </label>
                    <select
                      {...register('status')}
                      className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:border-neutral-500 transition-colors"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Sort Order
                    </label>
                    <input
                      {...register('sortOrder', { valueAsNumber: true })}
                      type="number"
                      min="0"
                      className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:border-neutral-500 transition-colors"
                      placeholder="0"
                    />
                  </div>

                  {/* ❌ УДАЛЕНО: поле Featured */}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-neutral-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            disabled={isLoading || hasMediaValidationError}
            className="px-4 py-2 bg-neutral-900 text-white text-sm rounded hover:bg-neutral-800 disabled:bg-neutral-400 transition-colors"
          >
            {isLoading ? 
              (isEditing ? 'Updating...' : 'Creating...') :
              (isEditing ? 'Update Project' : 'Create Project')
            }
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProjectForm;