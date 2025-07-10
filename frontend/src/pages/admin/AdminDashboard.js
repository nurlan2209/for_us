// frontend/src/pages/admin/AdminDashboard.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const AdminDashboard = () => {
  const { user } = useAuth();
  
  // Fetch projects data
  const { data: projects = [], isLoading } = useQuery(
    'admin-projects',
    () => projectsAPI.adminGetAll(),
    {
      select: (response) => response.data.projects,
    }
  );

  // Calculate statistics
  const stats = {
    total: projects.length,
    published: projects.filter(p => p.status === 'published').length,
    draft: projects.filter(p => p.status === 'draft').length,
    featured: projects.filter(p => p.featured).length,
  };

  const recentProjects = projects
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);

  const quickActions = [
    {
      title: 'Новый проект',
      description: 'Создать новый проект',
      icon: '➕',
      href: '/admin/projects?action=create',
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Управление проектами',
      description: 'Редактировать существующие проекты',
      icon: '📝',
      href: '/admin/projects',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Настройки сайта',
      description: 'Изменить настройки портфолио',
      icon: '⚙️',
      href: '/admin/settings',
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Посмотреть сайт',
      description: 'Перейти на основной сайт',
      icon: '🌐',
      href: '/',
      color: 'from-orange-500 to-red-500'
    }
  ];

  if (isLoading) {
    return <LoadingSpinner text="Загрузка панели управления..." />;
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Панель управления
            </h1>
            <p className="text-gray-400">
              Добро пожаловать, {user?.username}! Управляйте своим портфолио.
            </p>
          </div>
          <div className="mt-4 lg:mt-0 text-sm text-gray-500">
            Последний вход: {new Date().toLocaleDateString('ru-RU')}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Всего проектов', value: stats.total, icon: '📊', color: 'blue' },
            { label: 'Опубликовано', value: stats.published, icon: '✅', color: 'green' },
            { label: 'Черновики', value: stats.draft, icon: '📝', color: 'yellow' },
            { label: 'Избранные', value: stats.featured, icon: '⭐', color: 'purple' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-primary-500/50 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className="text-3xl opacity-75">
                  {stat.icon}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">
            Быстрые действия
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group"
              >
                <Link
                  to={action.href}
                  className={`block bg-gradient-to-br ${action.color} p-6 rounded-xl text-white shadow-lg group-hover:shadow-xl transition-all duration-300`}
                >
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                    {action.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-2">
                    {action.title}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {action.description}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Projects */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              Последние проекты
            </h2>
            <Link
              to="/admin/projects"
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              Посмотреть все →
            </Link>
          </div>

          {recentProjects.length > 0 ? (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Проект
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Статус
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Обновлен
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {recentProjects.map((project, index) => (
                      <motion.tr
                        key={project.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index, duration: 0.5 }}
                        className="hover:bg-gray-700/30 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {project.imageUrl && (
                              <img
                                src={project.imageUrl}
                                alt={project.title}
                                className="w-10 h-10 rounded-lg object-cover mr-3"
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-white">
                                {project.title}
                              </div>
                              <div className="text-sm text-gray-400 truncate max-w-xs">
                                {project.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            project.status === 'published'
                              ? 'bg-green-500/20 text-green-400'
                              : project.status === 'draft'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {project.status === 'published' ? 'Опубликован' : 
                             project.status === 'draft' ? 'Черновик' : 'Архив'}
                          </span>
                          {project.featured && (
                            <span className="ml-2 text-yellow-400">⭐</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {new Date(project.updatedAt).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <Link
                              to={`/admin/projects?edit=${project.id}`}
                              className="text-primary-400 hover:text-primary-300 transition-colors"
                            >
                              Редактировать
                            </Link>
                            <Link
                              to={`/portfolio/${project.id}`}
                              target="_blank"
                              className="text-gray-400 hover:text-white transition-colors"
                            >
                              Просмотр
                            </Link>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">📁</div>
              <h3 className="text-xl font-bold text-white mb-2">
                Пока нет проектов
              </h3>
              <p className="text-gray-400 mb-6">
                Создайте свой первый проект для отображения в портфолио
              </p>
              <Link
                to="/admin/projects?action=create"
                className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
              >
                <span className="mr-2">➕</span>
                Создать проект
              </Link>
            </div>
          )}
        </div>

        {/* System Info */}
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            Информация о системе
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Версия:</span>
              <span className="text-white ml-2">1.0.0</span>
            </div>
            <div>
              <span className="text-gray-400">Последнее обновление:</span>
              <span className="text-white ml-2">Сегодня</span>
            </div>
            <div>
              <span className="text-gray-400">Статус API:</span>
              <span className="text-green-400 ml-2">● Активен</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;