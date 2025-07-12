// frontend/src/pages/admin/AdminContactSettings.js
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

  const { register, handleSubmit, control, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(contactButtonSchema),
    defaultValues: {
      contactButtons: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'contactButtons'
  });

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      // API call here
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Contact buttons updated');
    } catch (error) {
      toast.error('Error updating contact buttons');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Contact Settings</h1>
          <p className="text-gray-400">Manage contact overlay buttons</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Contact Buttons</h2>
              <button
                type="button"
                onClick={() => append({ text: '', url: '' })}
                className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Add Button
              </button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-900/50 p-4 rounded-lg border border-gray-700"
                >
                  <div className="flex items-start gap-4">
                    
                    <div className="flex-1">
                      <label className="block text-white font-medium mb-2 text-sm">
                        Button Text
                      </label>
                      <input
                        {...register(`contactButtons.${index}.text`)}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                        placeholder="CONTACT@EMAIL.COM"
                      />
                      {errors.contactButtons?.[index]?.text && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.contactButtons[index].text.message}
                        </p>
                      )}
                    </div>

                    <div className="flex-1">
                      <label className="block text-white font-medium mb-2 text-sm">
                        URL
                      </label>
                      <input
                        {...register(`contactButtons.${index}.url`)}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                        placeholder="https://example.com"
                      />
                      {errors.contactButtons?.[index]?.url && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.contactButtons[index].url.message}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="mt-7 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg"
                    >
                      ×
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {fields.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No contact buttons. Add one to get started.
              </div>
            )}

            <div className="flex justify-end mt-8 pt-6 border-t border-gray-700">
              <button
                type="submit"
                disabled={!isDirty || isSaving}
                className="bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
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