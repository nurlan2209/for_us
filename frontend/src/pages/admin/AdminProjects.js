// frontend/src/pages/admin/AdminProjects.js
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { projectsAPI, uploadAPI } from '../../utils/api';
import AdminLayout from '../../components/admin/AdminLayout';
import ProjectForm from '../../components/admin/ProjectForm';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminProjects = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Check URL params for actions
  useEffect(() => {
    const action = searchParams.get('action');
    const editId = searchParams.get('edit');

    if (action === 'create') {
      setShowForm(true);
      setEditingProject(null);
    } else if (editId) {
      setEditingProject({ id: parseInt(editId) });
      setShowForm(true);
    }
  }, [searchParams]);

  // Fetch projects
  const { data: projects = [], isLoading } = useQuery(
    'admin-projects',
    () => projectsAPI.adminGetAll(),
    {
      select: (response) => response.data.projects,
    }
  );

  // Delete project mutation
  const deleteProjectMutation = useMutation(
    (projectId) => projectsAPI.delete(projectId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-projects');
        toast.success('Проект удален');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Ошибка удаления');
      },
    }
  );

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'all') return matchesSearch;
    if (filter === 'published') return project.status === 'published' && matchesSearch;
    if (filter === 'draft') return project.status === 'draft' && matchesSearch;
    if (filter === 'featured') return project.featured && matchesSearch;

    return matchesSearch;
  });

  const handleCreateProject = () => {
    setEditingProject(null);
    setShowForm(true);
    setSearchParams({ action: 'create' });
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setShowForm(true);
    setSearchParams({ edit: project.id });
  };

  const handleDeleteProject = async (project) => {
    if (window.confirm(`Удалить проект "${project.title}"?`)) {
      deleteProjectMutation.mutate(project.id);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProject(null);
    setSearchParams({});
  };

  const handleFormSuccess = () => {
    handleCloseForm();
    queryClient.invalidateQueries('admin-projects');
  };

  if (isLoading) {
    return <LoadingSpinner text="Загрузка проектов..." />;
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Управление проектами
            </h1>
            <p className="text-gray-400">
              Создавайте, редактируйте и управляйте проектами портфолио
            </p>
          </div>

          <motion.button
            onClick={handleCreateProject}
            className="mt-4 lg:mt-0 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Создать проект
            </span>
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Всего', value: projects.length, color: 'blue' },
            { label: 'Опубликовано', value: projects.filter(p => p.status === 'published').length, color: 'green' },
            { label: 'Черновики', value: projects.filter(p => p.status === 'draft').length, color: 'yellow' },
            { label: 'Избранные', value: projects.filter(p => p.featured).length, color: 'purple' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
            >
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">

            {/* Search */}
            <div className="relative w-full lg:w-96">
              <input
                type="text"
                placeholder="Поиск проектов..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
              />
              <svg
                className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'Все' },
                { key: 'published', label: 'Опубликовано' },
                { key: 'draft', label: 'Черновики' },
                { key: 'featured', label: 'Избранные' },
              ].map((filterOption) => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === filterOption.key
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>

            {/* Results count */}
            <div className="text-sm text-gray-400">
              {filteredProjects.length} из {projects.length} проектов
            </div>
          </div>
        </div>

        {/* Projects Table */}
        {filteredProjects.length > 0 ? (
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
                      Технологии
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Обновлен
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredProjects.map((project, index) => (
                    <motion.tr
                      key={project.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {project.imageUrl && (
                            <img
                              src={project.imageUrl}
                              alt={project.title}
                              className="w-12 h-12 rounded-lg object-cover mr-4"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-white flex items-center">
                              {project.title}
                              {project.featured && (
                                <span className="ml-2 text-yellow-400">⭐</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-400 truncate max-w-xs">
                              {project.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${project.status === 'published'
                            ? 'bg-green-500/20 text-green-400'
                            : project.status === 'draft'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                          {project.status === 'published' ? 'Опубликован' :
                            project.status === 'draft' ? 'Черновик' : 'Архив'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400 max-w-xs truncate">
                          {project.technologies}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(project.updatedAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditProject(project)}
                            className="text-primary-400 hover:text-primary-300 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          <a
                            href={`/portfolio/${project.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>

                          <button
                            onClick={() => handleDeleteProject(project)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            disabled={deleteProjectMutation.isLoading}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
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
              {searchTerm || filter !== 'all' ? 'Проекты не найдены' : 'Пока нет проектов'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || filter !== 'all'
                ? 'Попробуйте изменить фильтры или поисковый запрос'
                : 'Создайте свой первый проект для отображения в портфолио'
              }
            </p>
            {!searchTerm && filter === 'all' && (
              <button
                onClick={handleCreateProject}
                className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
              >
                <span className="mr-2">➕</span>
                Создать проект
              </button>
            )}
          </div>
        )}

        {/* Project Form Modal */}
        <AnimatePresence>
          {showForm && (
            <ProjectForm
              project={editingProject}
              onClose={handleCloseForm}
              onSuccess={handleFormSuccess}
            />
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
};

export default AdminProjects;