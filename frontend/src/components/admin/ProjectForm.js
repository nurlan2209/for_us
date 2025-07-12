// frontend/src/components/admin/ProjectForm.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from 'react-query';
import { projectsAPI, uploadAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const projectSchema = z.object({
  title: z.string().min(1, 'Title required').max(100, 'Title too long'),
  description: z.string().min(1, 'Description required').max(1000, 'Description too long'),
  technologies: z.string().min(1, 'Technologies required').max(200, 'Technologies list too long'),
  projectUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  githubUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
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

  const createMutation = useMutation(
    (data) => projectsAPI.create(data),
    {
      onSuccess: () => {
        toast.success('Project created');
        queryClient.invalidateQueries('admin-projects');
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
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Update error');
      },
    }
  );

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Only images allowed');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be smaller than 10MB');
      return;
    }

    setImageFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async () => {
    if (!imageFile) return imagePreview;

    setIsUploading(true);
    try {
      const response = await uploadAPI.uploadImage(imageFile);
      return response.data.file.url;
    } catch (error) {
      toast.error('Image upload failed');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
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
      <div className="absolute inset-0 bg-black/50" />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-light text-neutral-900">
            {isEditing ? 'Edit Project' : 'New Project'}
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

        {/* Form */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            
            {/* Title & Technologies */}
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

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                Description *
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:border-neutral-500 transition-colors resize-vertical"
                placeholder="Project description..."
              />
              {errors.description && (
                <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* URLs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  Project URL
                </label>
                <input
                  {...register('projectUrl')}
                  type="url"
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:border-neutral-500 transition-colors"
                  placeholder="https://example.com"
                />
                {errors.projectUrl && (
                  <p className="text-xs text-red-600 mt-1">{errors.projectUrl.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  GitHub URL
                </label>
                <input
                  {...register('githubUrl')}
                  type="url"
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:border-neutral-500 transition-colors"
                  placeholder="https://github.com/user/repo"
                />
                {errors.githubUrl && (
                  <p className="text-xs text-red-600 mt-1">{errors.githubUrl.message}</p>
                )}
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                Project Image
              </label>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="cursor-pointer px-4 py-2 border border-neutral-300 rounded text-sm hover:bg-neutral-50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    Choose Image
                  </label>
                  {imageFile && (
                    <span className="text-xs text-neutral-600">
                      {imageFile.name}
                    </span>
                  )}
                </div>

                {imagePreview && (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded border border-neutral-300"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        setImageFile(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  Options
                </label>
                <label className="flex items-center space-x-2 px-3 py-2 border border-neutral-300 rounded cursor-pointer hover:bg-neutral-50 transition-colors">
                  <input
                    {...register('featured')}
                    type="checkbox"
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Featured</span>
                </label>
              </div>
            </div>
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
            form="project-form"
            onClick={handleSubmit(onSubmit)}
            disabled={isLoading}
            className="px-4 py-2 bg-neutral-900 text-white text-sm rounded hover:bg-neutral-800 disabled:bg-neutral-400 transition-colors"
          >
            {isLoading ? 
              (isUploading ? 'Uploading...' : 
               isEditing ? 'Updating...' : 'Creating...') :
              (isEditing ? 'Update' : 'Create')
            }
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProjectForm;