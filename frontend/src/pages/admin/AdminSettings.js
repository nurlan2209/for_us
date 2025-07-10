// frontend/src/pages/admin/AdminSettings.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AdminLayout from '../../components/admin/AdminLayout';
import { MiniSpinner } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

// Settings validation schema
const settingsSchema = z.object({
  siteTitle: z.string().min(1, 'Название сайта обязательно').max(100, 'Название слишком длинное'),
  siteDescription: z.string().min(1, 'Описание обязательно').max(500, 'Описание слишком длинное'),
  contactEmail: z.string().email('Некорректный email'),
  githubUrl: z.string().url('Некорректный URL').optional().or(z.literal('')),
  linkedinUrl: z.string().url('Некорректный URL').optional().or(z.literal('')),
  twitterUrl: z.string().url('Некорректный URL').optional().or(z.literal('')),
  dribbbleUrl: z.string().url('Некорректный URL').optional().or(z.literal('')),
});

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      siteTitle: "My 3D Portfolio",
      siteDescription: "Welcome to my creative portfolio",
      contactEmail: "contact@portfolio.com",
      githubUrl: "https://github.com",
      linkedinUrl: "https://linkedin.com",
      twitterUrl: "https://twitter.com",
      dribbbleUrl: "https://dribbble.com",
    },
  });

  const tabs = [
    { id: 'general', name: 'Основные', icon: '⚙️' },
    { id: 'social', name: 'Социальные сети', icon: '🌐' },
    { id: 'advanced', name: 'Дополнительно', icon: '🔧' },
  ];

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Settings data:', data);
      toast.success('Настройки сохранены');
      reset(data);
    } catch (error) {
      toast.error('Ошибка сохранения настроек');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Сбросить все изменения?')) {
      reset();
      toast.success('Изменения сброшены');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Настройки
          </h1>
          <p className="text-gray-400">
            Управляйте настройками сайта и персональной информацией
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-primary-500/20 text-primary-400 border-r-2 border-primary-500'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span className="mr-3 text-lg">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>

            {/* Save Status */}
            {isDirty && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-yellow-400 text-sm font-medium">
                    Есть несохраненные изменения
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl">
                
                {/* General Settings */}
                {activeTab === 'general' && (
                  <motion.div
                    key="general"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-6 space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-white mb-4">
                        Основные настройки
                      </h2>
                      <p className="text-gray-400 mb-6">
                        Базовая информация о сайте
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Site Title */}
                      <div>
                        <label className="block text-white font-medium mb-2">
                          Название сайта *
                        </label>
                        <input
                          {...register('siteTitle')}
                          type="text"
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                          placeholder="My 3D Portfolio"
                        />
                        {errors.siteTitle && (
                          <p className="text-red-400 text-sm mt-1">{errors.siteTitle.message}</p>
                        )}
                      </div>

                      {/* Site Description */}
                      <div>
                        <label className="block text-white font-medium mb-2">
                          Описание сайта *
                        </label>
                        <textarea
                          {...register('siteDescription')}
                          rows={4}
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors resize-vertical"
                          placeholder="Welcome to my creative portfolio"
                        />
                        {errors.siteDescription && (
                          <p className="text-red-400 text-sm mt-1">{errors.siteDescription.message}</p>
                        )}
                      </div>

                      {/* Contact Email */}
                      <div>
                        <label className="block text-white font-medium mb-2">
                          Email для связи *
                        </label>
                        <input
                          {...register('contactEmail')}
                          type="email"
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                          placeholder="contact@portfolio.com"
                        />
                        {errors.contactEmail && (
                          <p className="text-red-400 text-sm mt-1">{errors.contactEmail.message}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Social Media Settings */}
                {activeTab === 'social' && (
                  <motion.div
                    key="social"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-6 space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-white mb-4">
                        Социальные сети
                      </h2>
                      <p className="text-gray-400 mb-6">
                        Ссылки на ваши профили в социальных сетях
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* GitHub */}
                      <div>
                        <label className="flex items-center text-white font-medium mb-2">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                          </svg>
                          GitHub
                        </label>
                        <input
                          {...register('githubUrl')}
                          type="url"
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                          placeholder="https://github.com/username"
                        />
                        {errors.githubUrl && (
                          <p className="text-red-400 text-sm mt-1">{errors.githubUrl.message}</p>
                        )}
                      </div>

                      {/* LinkedIn */}
                      <div>
                        <label className="flex items-center text-white font-medium mb-2">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                          LinkedIn
                        </label>
                        <input
                          {...register('linkedinUrl')}
                          type="url"
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                          placeholder="https://linkedin.com/in/username"
                        />
                        {errors.linkedinUrl && (
                          <p className="text-red-400 text-sm mt-1">{errors.linkedinUrl.message}</p>
                        )}
                      </div>

                      {/* Twitter */}
                      <div>
                        <label className="flex items-center text-white font-medium mb-2">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                          </svg>
                          Twitter
                        </label>
                        <input
                          {...register('twitterUrl')}
                          type="url"
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                          placeholder="https://twitter.com/username"
                        />
                        {errors.twitterUrl && (
                          <p className="text-red-400 text-sm mt-1">{errors.twitterUrl.message}</p>
                        )}
                      </div>

                      {/* Dribbble */}
                      <div>
                        <label className="flex items-center text-white font-medium mb-2">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0zm9.568 5.302c.896 1.464 1.43 3.174 1.43 5.005 0 .734-.088 1.448-.251 2.131-.456-.094-5.043-1.025-9.608-.484.023-.056.044-.112.067-.171.062-.156.129-.323.196-.49 2.646-.343 5.267-.343 7.795.009zM12 2.252c2.173 0 4.174.744 5.759 1.992-1.898 1.676-4.926 3.314-8.759 3.77V2.252zM5.878 3.458A10.136 10.136 0 0112 2.252v5.762c-3.833-.456-6.861-2.094-8.759-3.77A9.968 9.968 0 015.878 3.458zM2.252 12c0-.178.01-.355.025-.532.456.008 5.32.066 10.608-1.992.178.348.349.7.505 1.052-4.178.848-7.518 3.176-9.885 6.374A9.968 9.968 0 012.252 12zm1.53 8.413c2.012-2.613 4.986-4.686 8.685-5.416.896 2.32 1.464 4.785 1.464 7.004 0 .734-.088 1.448-.251 2.131A9.973 9.973 0 013.782 20.413zm8.966.984c-.062-2.012-.456-3.95-1.098-5.759 4.178-.67 8.356.225 9.306.413a9.973 9.973 0 01-8.208 5.346z"/>
                          </svg>
                          Dribbble
                        </label>
                        <input
                          {...register('dribbbleUrl')}
                          type="url"
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                          placeholder="https://dribbble.com/username"
                        />
                        {errors.dribbbleUrl && (
                          <p className="text-red-400 text-sm mt-1">{errors.dribbbleUrl.message}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Advanced Settings */}
                {activeTab === 'advanced' && (
                  <motion.div
                    key="advanced"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-6 space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-white mb-4">
                        Дополнительные настройки
                      </h2>
                      <p className="text-gray-400 mb-6">
                        Расширенные опции и инструменты
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Theme Settings */}
                      <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
                        <h3 className="text-lg font-semibold text-white mb-4">
                          Настройки темы
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">Темный режим</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" defaultChecked className="sr-only peer" />
                              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                            </label>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">3D анимации</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" defaultChecked className="sr-only peer" />
                              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Performance Settings */}
                      <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
                        <h3 className="text-lg font-semibold text-white mb-4">
                          Производительность
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-gray-300 mb-2">
                              Качество 3D рендеринга
                            </label>
                            <select className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white">
                              <option value="low">Низкое</option>
                              <option value="medium" selected>Среднее</option>
                              <option value="high">Высокое</option>
                            </select>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">Оптимизация изображений</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" defaultChecked className="sr-only peer" />
                              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Maintenance Mode */}
                      <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-yellow-400 mb-4">
                          Режим обслуживания
                        </h3>
                        <p className="text-gray-300 mb-4">
                          Временно отключить сайт для посетителей во время обновления
                        </p>
                        <button
                          type="button"
                          className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          Включить режим обслуживания
                        </button>
                      </div>

                      {/* Danger Zone */}
                      <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-red-400 mb-4">
                          Опасная зона
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-white font-medium mb-2">Сброс настроек</h4>
                            <p className="text-gray-400 text-sm mb-3">
                              Вернуть все настройки к значениям по умолчанию
                            </p>
                            <button
                              type="button"
                              onClick={handleReset}
                              className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg transition-colors"
                            >
                              Сбросить настройки
                            </button>
                          </div>
                          
                          <div>
                            <h4 className="text-white font-medium mb-2">Экспорт данных</h4>
                            <p className="text-gray-400 text-sm mb-3">
                              Скачать все данные портфолио в JSON формате
                            </p>
                            <button
                              type="button"
                              className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg transition-colors"
                            >
                              Экспортировать данные
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Form Actions */}
                <div className="px-6 py-4 border-t border-gray-700 bg-gray-900/30">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      {isDirty ? 'Есть несохраненные изменения' : 'Все изменения сохранены'}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {isDirty && (
                        <button
                          type="button"
                          onClick={handleReset}
                          className="px-4 py-2 text-gray-400 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition-colors"
                          disabled={isSaving}
                        >
                          Сбросить
                        </button>
                      )}
                      
                      <button
                        type="submit"
                        disabled={!isDirty || isSaving}
                        className="bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl disabled:shadow-none"
                      >
                        {isSaving ? (
                          <div className="flex items-center space-x-2">
                            <MiniSpinner />
                            <span>Сохранение...</span>
                          </div>
                        ) : (
                          'Сохранить настройки'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;