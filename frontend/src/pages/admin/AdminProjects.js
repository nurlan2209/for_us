// frontend/src/pages/admin/AdminProjects.js - ОБНОВЛЕННАЯ ВЕРСИЯ с releaseDate
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { projectsAPI } from '../../utils/api';
import AdminLayout from '../../components/admin/AdminLayout';
import ProjectForm from '../../components/admin/ProjectForm';
import toast from 'react-hot-toast';

const AdminProjects = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

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

  const { data: projects = [], isLoading } = useQuery(
    'admin-projects',
    () => projectsAPI.adminGetAll(),
    {
      select: (response) => response.data.projects,
    }
  );

  const deleteProjectMutation = useMutation(
    (projectId) => projectsAPI.delete(projectId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-projects');
        toast.success('Project deleted');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Delete error');
      },
    }
  );

  const filteredProjects = projects.filter(project => {
    if (filter === 'all') return true;
    if (filter === 'published') return project.status === 'published';
    if (filter === 'draft') return project.status === 'draft';
    if (filter === 'featured') return project.featured;
    return true;
  });

  // ✅ Форматирование даты выхода
  const formatReleaseDate = (dateString) => {
    if (!dateString) return 'Not set';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

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
    if (window.confirm(`Delete "${project.title}"?`)) {
      deleteProjectMutation.mutate(project.id);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProject(null);
    setSearchParams({});
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <div className="text-neutral-600">Loading projects...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light text-neutral-900 mb-2">
              Projects
            </h1>
            <p className="text-sm text-neutral-600">
              Manage your portfolio projects
            </p>
          </div>
          <button
            onClick={handleCreateProject}
            className="px-4 py-2 bg-neutral-900 text-white text-xs font-medium rounded hover:bg-neutral-800 transition-colors"
          >
            NEW PROJECT
          </button>
        </div>

        {/* Filters */}
        <div className="flex space-x-2">
          {['all', 'published', 'draft', 'featured'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                filter === filterOption
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {filterOption.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Projects Table for better data display */}
        {filteredProjects.length > 0 ? (
          <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-600 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-600 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-600 uppercase tracking-wider">
                      Release Date
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-600 uppercase tracking-wider">
                      Technologies
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {filteredProjects.map((project, index) => (
                    <motion.tr
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-neutral-50 transition-colors"
                    >
                      {/* Project Info */}
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-3">
                          {/* Thumbnail */}
                          {project.imageUrl ? (
                            <img
                              src={project.imageUrl}
                              alt={project.title}
                              className="w-12 h-12 object-cover rounded border border-neutral-200"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-neutral-100 rounded border border-neutral-200 flex items-center justify-center">
                              <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          
                          {/* Title and Description */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-sm font-medium text-neutral-900 truncate">
                                {project.title}
                              </h3>
                              {project.featured && (
                                <span className="text-yellow-500 text-xs">★</span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-600 truncate max-w-xs">
                              {project.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-neutral-100 text-neutral-700">
                          {project.category || 'Uncategorized'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          project.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : project.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {project.status}
                        </span>
                      </td>

                      {/* ✅ Release Date */}
                      <td className="px-4 py-4">
                        <div className="text-sm text-neutral-900">
                          {formatReleaseDate(project.releaseDate)}
                        </div>
                        <div className="text-xs text-neutral-500">
                          Release date
                        </div>
                      </td>

                      {/* Technologies */}
                      <td className="px-4 py-4">
                        <div className="text-xs text-neutral-600 max-w-32 truncate">
                          {project.technologies || 'Not specified'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditProject(project)}
                            className="text-xs text-neutral-600 hover:text-neutral-900 font-medium"
                          >
                            Edit
                          </button>
                          <a
                            href={`/portfolio/${project.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-neutral-600 hover:text-neutral-900 font-medium"
                          >
                            View
                          </a>
                          <button
                            onClick={() => handleDeleteProject(project)}
                            className="text-xs text-red-600 hover:text-red-800 font-medium"
                          >
                            Delete
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
          <div className="text-center py-12 border border-neutral-200 rounded-lg">
            <div className="text-neutral-600 mb-4">
              {filter !== 'all' ? `No ${filter} projects` : 'No projects yet'}
            </div>
            {filter === 'all' && (
              <button
                onClick={handleCreateProject}
                className="px-4 py-2 bg-neutral-900 text-white text-xs font-medium rounded hover:bg-neutral-800 transition-colors"
              >
                CREATE PROJECT
              </button>
            )}
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-neutral-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-light text-neutral-900">{projects.length}</div>
            <div className="text-xs text-neutral-600 uppercase tracking-wide">Total Projects</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-light text-neutral-900">
              {projects.filter(p => p.status === 'published').length}
            </div>
            <div className="text-xs text-neutral-600 uppercase tracking-wide">Published</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-light text-neutral-900">
              {projects.filter(p => p.status === 'draft').length}
            </div>
            <div className="text-xs text-neutral-600 uppercase tracking-wide">Drafts</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-light text-neutral-900">
              {projects.filter(p => p.featured).length}
            </div>
            <div className="text-xs text-neutral-600 uppercase tracking-wide">Featured</div>
          </div>
        </div>

        {/* Project Form Modal */}
        <AnimatePresence>
          {showForm && (
            <ProjectForm
              project={editingProject}
              onClose={handleCloseForm}
              onSuccess={() => {
                handleCloseForm();
                queryClient.invalidateQueries('admin-projects');
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
};

export default AdminProjects;