// frontend/src/pages/ProjectDetail.js - ОБНОВЛЕННАЯ ВЕРСИЯ без года
import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { projectsAPI } from '../utils/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import MediaGallery from '../components/ui/MediaGallery';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch project data
  const { 
    data: project, 
    isLoading, 
    error 
  } = useQuery(
    ['project', id],
    () => projectsAPI.getById(id),
    {
      select: (response) => response.data.project,
      enabled: !!id,
    }
  );

  // ✅ Форматирование даты выхода
  const formatReleaseDate = (dateString) => {
    if (!dateString) return 'Not specified';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-white flex items-center justify-center"
      >
        <LoadingSpinner text="Loading project..." />
      </motion.div>
    );
  }
  
  if (error || !project) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-white flex items-center justify-center pt-16"
      >
        <div className="text-center px-6">
          <h2 className="text-3xl font-light text-neutral-900 mb-4">
            Project Not Found
          </h2>
          <p className="text-neutral-600 mb-8">
            The requested project doesn't exist or has been removed.
          </p>
          <Link
            to="/"
            className="catalog-button-unveil catalog-button-primary"
          >
            Back to Projects
          </Link>
        </div>
      </motion.div>
    );
  }

  const technologies = project.technologies.split(',').map(tech => tech.trim());
  const mediaFiles = project.mediaFiles || (project.imageUrl ? [{ 
    id: 1, 
    url: project.imageUrl, 
    type: 'image',
    alt: project.title 
  }] : []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-white"
    >

      {/* Featured Badge */}
      {project.featured && (
        <div className="fixed top-6 right-6 z-20">
          <div className="bg-neutral-900 text-white px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase">
            Featured
          </div>
        </div>
      )}

      {/* Project Info Block - Always at the top */}
      <section className="pt-24 pb-16 px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl lg:text-7xl font-light text-neutral-900 tracking-tight mb-6">
              {project.title}
            </h1>
            
            <p className="text-xl lg:text-2xl text-neutral-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              {project.description}
            </p>
            
            {/* Technologies */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {technologies.map((tech, index) => (
                <span
                  key={index}
                  className="tech-tag-unveil"
                >
                  {tech}
                </span>
              ))}
            </div>

            {/* Custom Buttons from Admin */}
            {project.customButtons && project.customButtons.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {project.customButtons.map((button, index) => (
                  <a
                    key={index}
                    href={button.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-lg px-8 py-4 ${
                      index === 0 
                        ? 'catalog-button-unveil catalog-button-primary' 
                        : 'catalog-button-unveil'
                    }`}
                  >
                    {button.text}
                  </a>
                ))}
              </div>
            )}
          </motion.div>

          {/* Project Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              
              {/* About */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2 className="text-2xl font-light text-neutral-900 tracking-tight mb-6">
                  About This Project
                </h2>
                <div className="prose prose-neutral max-w-none">
                  <p className="text-lg text-neutral-600 leading-relaxed">
                    {project.description}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              
              {/* Project Stats */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="bg-neutral-50 p-6 rounded-xl border border-neutral-200"
              >
                <h3 className="text-lg font-light text-neutral-900 mb-6">
                  Project Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-neutral-500 uppercase tracking-wide mb-1">
                      Status
                    </div>
                    <div className="text-neutral-900 font-medium">
                      {project.status === 'published' ? 'Completed' : 'In Progress'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-neutral-500 uppercase tracking-wide mb-1">
                      Technologies
                    </div>
                    <div className="text-neutral-900 font-medium">
                      {technologies.length} technologies
                    </div>
                  </div>
                  
                  {/* ✅ УБРАНО ПОЛЕ "YEAR" */}
                  
                  {/* ✅ НОВОЕ ПОЛЕ: Release Date */}
                  <div>
                    <div className="text-sm text-neutral-500 uppercase tracking-wide mb-1">
                      Release Date
                    </div>
                    <div className="text-neutral-900 font-medium">
                      {formatReleaseDate(project.releaseDate)}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ✅ ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ: Категория */}
              {project.category && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="bg-neutral-50 p-6 rounded-xl border border-neutral-200"
                >
                  <h3 className="text-lg font-light text-neutral-900 mb-4">
                    Category
                  </h3>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-neutral-200 text-neutral-700">
                    {project.category}
                  </div>
                </motion.div>
              )}

              {/* ✅ LEGACY BUTTONS: GitHub/Project URL (если нет кастомных кнопок) */}
              {(!project.customButtons || project.customButtons.length === 0) && (project.projectUrl || project.githubUrl) && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="bg-neutral-50 p-6 rounded-xl border border-neutral-200"
                >
                  <h3 className="text-lg font-light text-neutral-900 mb-4">
                    Links
                  </h3>
                  <div className="space-y-3">
                    {project.projectUrl && (
                      <a
                        href={project.projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block catalog-button-unveil catalog-button-primary text-center"
                      >
                        View Live Project
                      </a>
                    )}
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block catalog-button-unveil text-center"
                      >
                        View Source Code
                      </a>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Media Gallery - Full Screen */}
      {mediaFiles && mediaFiles.length > 0 && (
        <MediaGallery 
          mediaFiles={mediaFiles} 
          projectTitle={project.title}
        />
      )}

      {/* Back to Projects */}
      <section className="py-16 px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Link
              to="/"
              className="catalog-button-unveil text-lg px-8 py-4"
            >
              ← Back to All Projects
            </Link>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
};

export default ProjectDetail;