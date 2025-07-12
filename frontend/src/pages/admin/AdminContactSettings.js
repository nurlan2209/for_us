// frontend/src/pages/admin/AdminContactSettings.js
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { settingsAPI } from '../../utils/api';
import AdminLayout from '../../components/admin/AdminLayout';
import toast from 'react-hot-toast';

const contactButtonSchema = z.object({
  contactButtons: z.array(z.object({
    text: z.string().min(1, 'Text is required'),
    url: z.string().url('Must be a valid URL')
  }))
});

const AdminContactSettings = () => {
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  // Fetch contact settings
  const { data: contactData, isLoading } = useQuery(
    'admin-contact-settings',
    () => settingsAPI.getContact(),
    {
      select: (response) => response.data.contact,
    }
  );

  const { register, handleSubmit, control, formState: { errors, isDirty }, reset } = useForm({
    resolver: zodResolver(contactButtonSchema),
    defaultValues: {
      contactButtons: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'contactButtons'
  });

  // Update mutation
  const updateMutation = useMutation(
    (data) => settingsAPI.updateContact(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-contact-settings');
        queryClient.invalidateQueries('contact-settings');
        toast.success('Contact buttons updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Error updating contact buttons');
      },
    }
  );

  // Set form data when loaded
  React.useEffect(() => {
    if (contactData) {
      reset({
        contactButtons: contactData.contactButtons || []
      });
    }
  }, [contactData, reset]);

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
          <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-600 rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-light text-neutral-900 mb-2">Contact Settings</h1>
          <p className="text-sm text-neutral-600">Manage contact overlay buttons that appear when users click "CONTACT"</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="border border-neutral-200 rounded-lg p-6 bg-white">
            
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-light text-neutral-900 mb-1">Contact Buttons</h2>
                <p className="text-sm text-neutral-500">Add contact methods that will be displayed as buttons</p>
              </div>
              <button
                type="button"
                onClick={() => append({ text: '', url: '' })}
                className="px-4 py-2 bg-neutral-900 text-white text-xs font-medium rounded hover:bg-neutral-800 transition-colors"
              >
                Add Button
              </button>
            </div>

            {/* Current Buttons Preview */}
            {fields.length > 0 && (
              <div className="mb-8 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <h3 className="text-sm font-medium text-neutral-900 mb-3">Preview</h3>
                <div className="flex flex-wrap gap-3">
                  {fields.map((field, index) => {
                    const buttonText = field.text || `Button ${index + 1}`;
                    return (
                      <div
                        key={field.id}
                        className="bg-white border border-neutral-300 rounded-lg px-4 py-2 text-xs font-medium text-neutral-700 tracking-wide uppercase"
                      >
                        {buttonText}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Button Configuration */}
            <div className="space-y-6">
              {fields.map((field, index) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border border-neutral-200 p-6 rounded-lg bg-white shadow-sm"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-sm font-medium text-neutral-900">
                      Button #{index + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => remove(index)}
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
                        {...register(`contactButtons.${index}.text`)}
                        className="w-full bg-white border border-neutral-300 rounded px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-500 transition-colors"
                        placeholder="e.g., Email, Instagram, LinkedIn"
                      />
                      {errors.contactButtons?.[index]?.text && (
                        <p className="text-red-600 text-xs mt-1">
                          {errors.contactButtons[index].text.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-900 mb-2">
                        URL *
                      </label>
                      <input
                        {...register(`contactButtons.${index}.url`)}
                        className="w-full bg-white border border-neutral-300 rounded px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-500 transition-colors"
                        placeholder="https://example.com"
                      />
                      {errors.contactButtons?.[index]?.url && (
                        <p className="text-red-600 text-xs mt-1">
                          {errors.contactButtons[index].url.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* URL Preview */}
                  {field.url && (
                    <div className="mt-3 p-2 bg-neutral-50 rounded text-xs text-neutral-600">
                      Opens: <span className="font-mono">{field.url}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {fields.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-neutral-200 rounded-lg">
                <div className="text-neutral-400 mb-2">
                  <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-neutral-600 font-medium mb-1">No contact buttons</h3>
                <p className="text-neutral-500 text-sm mb-4">Add your first contact button to get started</p>
                <button
                  type="button"
                  onClick={() => append({ text: '', url: '' })}
                  className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded hover:bg-neutral-800 transition-colors"
                >
                  Add First Button
                </button>
              </div>
            )}

            {/* Examples */}
            {fields.length === 0 && (
              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Examples</h4>
                <div className="space-y-1 text-sm text-blue-700">
                  <div><strong>Email:</strong> mailto:contact@example.com</div>
                  <div><strong>Instagram:</strong> https://instagram.com/username</div>
                  <div><strong>LinkedIn:</strong> https://linkedin.com/in/username</div>
                  <div><strong>Telegram:</strong> https://t.me/username</div>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-8 pt-6 border-t border-neutral-200">
              <button
                type="submit"
                disabled={!isDirty || isSaving}
                className="px-6 py-2 bg-neutral-900 text-white text-sm font-medium rounded hover:bg-neutral-800 disabled:bg-neutral-400 transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminContactSettings;