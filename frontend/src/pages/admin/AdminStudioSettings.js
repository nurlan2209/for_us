// frontend/src/pages/admin/AdminStudioSettings.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../../utils/api';
import AdminLayout from '../../components/admin/AdminLayout';
import { MiniSpinner } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const studioSettingsSchema = z.object({
  aboutText: z.string().min(1, 'About text is required').max(2000, 'About text too long'),
  clients: z.array(z.object({ name: z.string().min(1, 'Client name required') })).max(50, 'Too many clients'),
  services: z.array(z.object({ name: z.string().min(1, 'Service name required') })).max(20, 'Too many services'),
  recognitions: z.array(z.object({ name: z.string().min(1, 'Recognition required') })).max(10, 'Too many recognitions'),
});

const AdminStudioSettings = () => {
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  // Fetch studio settings
  const { data: studioData, isLoading } = useQuery(
    'admin-studio-settings',
    () => api.get('/settings/studio'),
    {
      select: (response) => response.data.studio,
    }
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    control,
    reset,
  } = useForm({
    resolver: zodResolver(studioSettingsSchema),
    defaultValues: {
      aboutText: '',
      clients: [],
      services: [],
      recognitions: [],
    },
  });

  const { fields: clientFields, append: appendClient, remove: removeClient } = useFieldArray({
    control,
    name: 'clients',
  });

  const { fields: serviceFields, append: appendService, remove: removeService } = useFieldArray({
    control,
    name: 'services',
  });

  const { fields: recognitionFields, append: appendRecognition, remove: removeRecognition } = useFieldArray({
    control,
    name: 'recognitions',
  });

  // Update mutation
  const updateMutation = useMutation(
    (data) => {
      const formattedData = {
        aboutText: data.aboutText,
        clients: data.clients.map(c => c.name),
        services: data.services.map(s => s.name),
        recognitions: data.recognitions.map(r => r.name),
      };
      return api.put('/settings/studio', formattedData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-studio-settings');
        queryClient.invalidateQueries('studio-settings');
        toast.success('Studio settings updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Error updating settings');
      },
    }
  );

  // Set form data when loaded
  React.useEffect(() => {
    if (studioData) {
      reset({
        aboutText: studioData.aboutText || '',
        clients: (studioData.clients || []).map(name => ({ name })),
        services: (studioData.services || []).map(name => ({ name })),
        recognitions: (studioData.recognitions || []).map(name => ({ name })),
      });
    }
  }, [studioData, reset]);

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync(data);
      reset(data);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <MiniSpinner />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Studio Settings</h1>
          <p className="text-gray-400">Manage studio page content</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            
            {/* About Text */}
            <div className="mb-8">
              <label className="block text-white font-medium mb-2">About Text</label>
              <textarea
                {...register('aboutText')}
                rows={6}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors resize-vertical"
                placeholder="About text..."
              />
              {errors.aboutText && (
                <p className="text-red-400 text-sm mt-1">{errors.aboutText.message}</p>
              )}
            </div>

            {/* Clients */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <label className="text-white font-medium">Clients</label>
                <button
                  type="button"
                  onClick={() => appendClient({ name: '' })}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-3 py-1 rounded text-sm"
                >
                  Add Client
                </button>
              </div>
              <div className="space-y-2">
                {clientFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <input
                      {...register(`clients.${index}.name`)}
                      className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                      placeholder="Client name"
                    />
                    <button
                      type="button"
                      onClick={() => removeClient(index)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Services */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <label className="text-white font-medium">Services</label>
                <button
                  type="button"
                  onClick={() => appendService({ name: '' })}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-3 py-1 rounded text-sm"
                >
                  Add Service
                </button>
              </div>
              <div className="space-y-2">
                {serviceFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <input
                      {...register(`services.${index}.name`)}
                      className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                      placeholder="Service name"
                    />
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Recognitions */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <label className="text-white font-medium">Recognitions</label>
                <button
                  type="button"
                  onClick={() => appendRecognition({ name: '' })}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-3 py-1 rounded text-sm"
                >
                  Add Recognition
                </button>
              </div>
              <div className="space-y-2">
                {recognitionFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <input
                      {...register(`recognitions.${index}.name`)}
                      className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                      placeholder="Recognition"
                    />
                    <button
                      type="button"
                      onClick={() => removeRecognition(index)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isDirty || isSaving}
              className="bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
            >
              {isSaving ? (
                <div className="flex items-center space-x-2">
                  <MiniSpinner />
                  <span>Saving...</span>
                </div>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminStudioSettings;