// frontend/src/pages/admin/AdminDashboard.js
import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';

const AdminDashboard = () => {
  const { user } = useAuth();
  
  const { data: projects = [], isLoading } = useQuery(
    'admin-projects',
    () => projectsAPI.adminGetAll(),
    {
      select: (response) => response.data.projects,
    }
  );

  const stats = {
    total: projects.length,
    published: projects.filter(p => p.status === 'published').length,
    draft: projects.filter(p => p.status === 'draft').length,
    featured: projects.filter(p => p.featured).length,
  };

  const recentProjects = projects
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 4);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <div className="text-neutral-600">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl space-y-12">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-light text-neutral-900 mb-2">
            Dashboard
          </h1>
          <p className="text-sm text-neutral-600">
            Welcome back, {user?.username}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Projects', value: stats.total },
            { label: 'Published', value: stats.published },
            { label: 'Drafts', value: stats.draft },
            { label: 'Featured', value: stats.featured },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 border border-neutral-200 rounded-lg"
            >
              <div className="text-2xl font-light text-neutral-900 mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-neutral-600 uppercase tracking-wide">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Projects */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-light text-neutral-900">
              Recent Projects
            </h2>
            <Link
              to="/admin/projects"
              className="text-xs font-medium text-neutral-900 hover:text-neutral-600 transition-colors uppercase tracking-wide"
            >
              View All
            </Link>
          </div>

          {recentProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recentProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="border border-neutral-200 rounded-lg overflow-hidden hover:border-neutral-300 transition-colors"
                >
                  {project.imageUrl && (
                    <img
                      src={project.imageUrl}
                      alt={project.title}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-neutral-900">
                        {project.title}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded ${
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
                    <div className="flex space-x-2">
                      <Link
                        to={`/admin/projects?edit=${project.id}`}
                        className="text-xs text-neutral-900 hover:text-neutral-600 transition-colors"
                      >
                        Edit
                      </Link>
                      <Link
                        to={`/portfolio/${project.id}`}
                        target="_blank"
                        className="text-xs text-neutral-600 hover:text-neutral-900 transition-colors"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-neutral-200 rounded-lg">
              <div className="text-neutral-600 mb-4">No projects yet</div>
              <Link
                to="/admin/projects?action=create"
                className="inline-block px-4 py-2 bg-neutral-900 text-white text-xs font-medium rounded hover:bg-neutral-800 transition-colors"
              >
                CREATE PROJECT
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/projects?action=create"
            className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors text-center"
          >
            <div className="text-xs font-medium text-neutral-900 mb-1">NEW PROJECT</div>
            <div className="text-xs text-neutral-600">Create a new project</div>
          </Link>
          <Link
            to="/admin/studio"
            className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors text-center"
          >
            <div className="text-xs font-medium text-neutral-900 mb-1">STUDIO SETTINGS</div>
            <div className="text-xs text-neutral-600">Manage studio content</div>
          </Link>
          <Link
            to="/admin/contact"
            className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors text-center"
          >
            <div className="text-xs font-medium text-neutral-900 mb-1">CONTACT SETTINGS</div>
            <div className="text-xs text-neutral-600">Manage contact buttons</div>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;