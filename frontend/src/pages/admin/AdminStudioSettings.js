// frontend/src/pages/admin/AdminStudioSettings.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { settingsAPI } from '../../utils/api';
import AdminLayout from '../../components/admin/AdminLayout';
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
    () => settingsAPI.getStudio(),
    {
      select: (response) => response.data.studio,
      staleTime: 5 * 60 * 1000,
    }
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    control,
    reset,
    watch,
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

  // Watch current form values for preview
  const currentValues = watch();

  // Update mutation
  const updateMutation = useMutation(
    (data) => {
      const formattedData = {
        aboutText: data.aboutText,
        clients: data.clients.map(c => c.name),
        services: data.services.map(s => s.name),
        recognitions: data.recognitions.map(r => r.name),
      };
      return settingsAPI.updateStudio(formattedData);
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
      console.log('Loading studio data:', studioData);
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
      reset(data); // Reset form state to mark as not dirty
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="max-w-2xl space-y-8">
          <div>
            <h1 className="text-2xl font-light text-neutral-900 mb-2">Studio Settings</h1>
            <p className="text-sm text-neutral-600">Manage studio page content</p>
          </div>
          
          <div className="border border-neutral-200 rounded-lg p-6 bg-white">
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-600 rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-light text-neutral-900 mb-2">Studio Settings</h1>
          <p className="text-sm text-neutral-600">Manage studio page content</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Form */}
          <div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="border border-neutral-200 rounded-lg p-6 bg-white">
                
                {/* About Text */}
                <div className="mb-8">
                  <label className="block text-neutral-900 font-medium mb-2">
                    About Text
                    {studioData?.aboutText && (
                      <span className="text-xs text-neutral-500 ml-2">
                        (Current: {studioData.aboutText.length} chars)
                      </span>
                    )}
                  </label>
                  <textarea
                    {...register('aboutText')}
                    rows={6}
                    className="w-full bg-white border border-neutral-300 rounded px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-500 transition-colors resize-vertical"
                    placeholder="About text..."
                  />
                  {errors.aboutText && (
                    <p className="text-red-600 text-sm mt-1">{errors.aboutText.message}</p>
                  )}
                  <p className="text-xs text-neutral-500 mt-1">
                    {currentValues.aboutText?.length || 0} / 2000 characters
                  </p>
                </div>

                {/* Clients */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-neutral-900 font-medium">
                      Clients
                      {studioData?.clients?.length > 0 && (
                        <span className="text-xs text-neutral-500 ml-2">
                          (Current: {studioData.clients.length} clients)
                        </span>
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={() => appendClient({ name: '' })}
                      className="px-3 py-1 bg-neutral-900 text-white text-xs font-medium rounded hover:bg-neutral-800 transition-colors"
                    >
                      Add Client
                    </button>
                  </div>
                  
                  {clientFields.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-neutral-200 rounded-lg">
                      <p className="text-neutral-500 text-sm mb-2">No clients added</p>
                      <button
                        type="button"
                        onClick={() => appendClient({ name: '' })}
                        className="text-xs text-neutral-600 hover:text-neutral-900"
                      >
                        Add your first client
                      </button>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {clientFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2">
                        <input
                          {...register(`clients.${index}.name`)}
                          className="flex-1 bg-white border border-neutral-300 rounded px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-500 transition-colors"
                          placeholder="Client name"
                        />
                        <button
                          type="button"
                          onClick={() => removeClient(index)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded transition-colors"
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
                    <label className="text-neutral-900 font-medium">
                      Services
                      {studioData?.services?.length > 0 && (
                        <span className="text-xs text-neutral-500 ml-2">
                          (Current: {studioData.services.length} services)
                        </span>
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={() => appendService({ name: '' })}
                      className="px-3 py-1 bg-neutral-900 text-white text-xs font-medium rounded hover:bg-neutral-800 transition-colors"
                    >
                      Add Service
                    </button>
                  </div>
                  
                  {serviceFields.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-neutral-200 rounded-lg">
                      <p className="text-neutral-500 text-sm mb-2">No services added</p>
                      <button
                        type="button"
                        onClick={() => appendService({ name: '' })}
                        className="text-xs text-neutral-600 hover:text-neutral-900"
                      >
                        Add your first service
                      </button>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {serviceFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2">
                        <input
                          {...register(`services.${index}.name`)}
                          className="flex-1 bg-white border border-neutral-300 rounded px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-500 transition-colors"
                          placeholder="Service name"
                        />
                        <button
                          type="button"
                          onClick={() => removeService(index)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded transition-colors"
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
                    <label className="text-neutral-900 font-medium">
                      Recognitions
                      {studioData?.recognitions?.length > 0 && (
                        <span className="text-xs text-neutral-500 ml-2">
                          (Current: {studioData.recognitions.length} recognitions)
                        </span>
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={() => appendRecognition({ name: '' })}
                      className="px-3 py-1 bg-neutral-900 text-white text-xs font-medium rounded hover:bg-neutral-800 transition-colors"
                    >
                      Add Recognition
                    </button>
                  </div>
                  
                  {recognitionFields.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-neutral-200 rounded-lg">
                      <p className="text-neutral-500 text-sm mb-2">No recognitions added</p>
                      <button
                        type="button"
                        onClick={() => appendRecognition({ name: '' })}
                        className="text-xs text-neutral-600 hover:text-neutral-900"
                      >
                        Add your first recognition
                      </button>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {recognitionFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2">
                        <input
                          {...register(`recognitions.${index}.name`)}
                          className="flex-1 bg-white border border-neutral-300 rounded px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-500 transition-colors"
                          placeholder="Recognition"
                        />
                        <button
                          type="button"
                          onClick={() => removeRecognition(index)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Submit */}
              <div className="flex justify-between items-center">
                <div>
                  {isDirty && (
                    <p className="text-xs text-amber-600">You have unsaved changes</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!isDirty || isSaving}
                  className="px-6 py-2 bg-neutral-900 text-white text-sm font-medium rounded hover:bg-neutral-800 disabled:bg-neutral-400 transition-colors"
                >
                  {isSaving ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    'Save Settings'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Current Values Preview */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-light text-neutral-900 mb-4">Current Settings</h2>
            </div>

            {/* Current About Text */}
            <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
              <h3 className="text-sm font-medium text-neutral-900 mb-3">About Text</h3>
              <div className="text-xs text-neutral-600 bg-white p-3 rounded border max-h-32 overflow-y-auto">
                {studioData?.aboutText || (
                  <span className="text-neutral-400 italic">No about text set</span>
                )}
              </div>
            </div>

            {/* Current Clients */}
            <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
              <h3 className="text-sm font-medium text-neutral-900 mb-3">Clients</h3>
              <div className="space-y-1">
                {studioData?.clients?.length > 0 ? (
                  studioData.clients.map((client, index) => (
                    <div key={index} className="text-xs text-neutral-600 bg-white px-2 py-1 rounded">
                      {client}
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-neutral-400 italic">No clients set</span>
                )}
              </div>
            </div>

            {/* Current Services */}
            <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
              <h3 className="text-sm font-medium text-neutral-900 mb-3">Services</h3>
              <div className="space-y-1">
                {studioData?.services?.length > 0 ? (
                  studioData.services.map((service, index) => (
                    <div key={index} className="text-xs text-neutral-600 bg-white px-2 py-1 rounded">
                      {service}
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-neutral-400 italic">No services set</span>
                )}
              </div>
            </div>

            {/* Current Recognitions */}
            <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
              <h3 className="text-sm font-medium text-neutral-900 mb-3">Recognitions</h3>
              <div className="space-y-1">
                {studioData?.recognitions?.length > 0 ? (
                  studioData.recognitions.map((recognition, index) => (
                    <div key={index} className="text-xs text-neutral-600 bg-white px-2 py-1 rounded">
                      {recognition}
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-neutral-400 italic">No recognitions set</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminStudioSettings;