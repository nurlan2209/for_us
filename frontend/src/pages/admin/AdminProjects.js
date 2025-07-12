// frontend/src/pages/admin/AdminProjects.js
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
      <div className="max-w-5xl space-y-8">
        
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

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-neutral-200 rounded-lg overflow-hidden hover:border-neutral-300 transition-colors group"
              >
                {project.imageUrl && (
                  <img
                    src={project.imageUrl}
                    alt={project.title}
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-medium text-neutral-900 flex-1">
                      {project.title}
                      {project.featured && (
                        <span className="ml-2 text-yellow-500">★</span>
                      )}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded ml-2 ${
                      project.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : project.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 mb-3 line-clamp-2">
                    {project.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-neutral-500">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditProject(project)}
                        className="text-xs text-neutral-900 hover:text-neutral-600"
                      >
                        Edit
                      </button>
                      <a
                        href={`/portfolio/${project.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-neutral-600 hover:text-neutral-900"
                      >
                        View
                      </a>
                      <button
                        onClick={() => handleDeleteProject(project)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
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