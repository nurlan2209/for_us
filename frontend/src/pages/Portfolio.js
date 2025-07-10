// frontend/src/pages/Portfolio.js - Исправленная версия как на unveil.fr
import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { projectsAPI } from '../utils/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { ProjectCatalog3D } from '../components/3d/ProjectCatalog3D';

const Portfolio = () => {
  const [filter, setFilter] = useState('ALL');
  const [hoveredProject, setHoveredProject] = useState(null);
  const [isLoading3D, setIsLoading3D] = useState(true);
  const navigate = useNavigate();

  // Fetch projects
  const { data: projectsData, isLoading, error } = useQuery(
    'projects',
    () => projectsAPI.getAll({ status: 'published' }),
    {
      select: (response) => response.data.projects,
      staleTime: 5 * 60 * 1000,
    }
  );

  const projects = projectsData || [];

  // Фильтрация проектов
  const filteredProjects = projects.filter(project => {
    if (filter === 'ALL') return true;
    if (filter === 'FEATURED') return project.featured;
    if (filter === 'WEB') return project.technologies.toLowerCase().includes('react') || project.technologies.toLowerCase().includes('web');
    if (filter === 'MOBILE') return project.technologies.toLowerCase().includes('mobile') || project.technologies.toLowerCase().includes('react native');
    if (filter === '3D') return project.technologies.toLowerCase().includes('three') || project.technologies.toLowerCase().includes('3d');
    return false;
  });

  if (isLoading) return <LoadingSpinner text="Loading Projects..." />;
  
  if (error || filteredProjects.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">
            {error ? 'Loading Error' : 'No Projects Found'}
          </h2>
          <p className="text-neutral-600 mb-8">
            {error ? 'Failed to load projects.' : 'Try adjusting your filters.'}
          </p>
          {!error && (
            <button
              onClick={() => setFilter('ALL')}
              className="catalog-button-unveil catalog-button-primary"
            >
              Show All Projects
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      
      {/* Header Section */}
      <section className="pt-24 pb-8 px-6 lg:px-8">
        <div className="max-w-screen-2xl mx-auto">
          
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl lg:text-7xl font-light text-neutral-900 tracking-tight mb-4">
              PROJECTS
            </h1>
            <p className="text-lg text-neutral-600 tracking-wide">
              {filteredProjects.length} PROJECT{filteredProjects.length !== 1 ? 'S' : ''}
            </p>
          </motion.div>

          {/* Filter Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex justify-center mb-8"
          >
            <div className="flex items-center space-x-8">
              {['ALL', 'FEATURED', 'WEB', 'MOBILE', '3D'].map((filterName) => (
                <button
                  key={filterName}
                  onClick={() => setFilter(filterName)}
                  className={`text-sm font-medium tracking-wide transition-all duration-300 ${
                    filter === filterName
                      ? 'text-neutral-900 opacity-100'
                      : 'text-neutral-400 opacity-70 hover:text-neutral-900 hover:opacity-100'
                  }`}
                >
                  {filterName}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3D Scene */}
      <section className="relative">
        <div 
          className="w-full bg-white"
          style={{ height: '70vh', minHeight: '500px' }}
        >
          <Canvas
            camera={{ 
              position: [0, 2, 10], 
              fov: 50
            }}
            onCreated={() => setIsLoading3D(false)}
            style={{ background: 'linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%)' }}
          >
            {/* Освещение */}
            <ambientLight intensity={0.8} />
            <directionalLight
              position={[10, 10, 5]}
              intensity={1}
              castShadow
              shadow-mapSize={[1024, 1024]}
            />
            <pointLight position={[-10, -10, -5]} intensity={0.3} color="#f1f5f9" />

            {/* Каталог проектов */}
            <ProjectCatalog3D 
              projects={filteredProjects}
              onProjectClick={(project) => {
                setHoveredProject(project);
                navigate(`/portfolio/${project.id}`);
              }}
            />

            {/* Контролы камеры */}
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              enableRotate={false}
              autoRotate={false}
            />
          </Canvas>

          {/* 3D Loading Overlay */}
          {isLoading3D && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <div className="loading-shimmer w-32 h-32 rounded-lg" />
            </div>
          )}
        </div>
      </section>

      {/* Project Info Section - показываем при hover */}
      <AnimatePresence>
        {hoveredProject && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.4 }}
            className="py-16 px-6 lg:px-8 bg-white border-t border-neutral-100"
          >
            <div className="max-w-4xl mx-auto text-center">
              
              {/* Project Title */}
              <h2 className="text-4xl lg:text-5xl font-light text-neutral-900 tracking-tight mb-6">
                {hoveredProject.title}
              </h2>
              
              {/* Project Description */}
              <p className="text-lg text-neutral-600 leading-relaxed mb-8 max-w-2xl mx-auto">
                {hoveredProject.description}
              </p>
              
              {/* Technologies */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {hoveredProject.technologies.split(',').map((tech, index) => (
                  <span
                    key={index}
                    className="tech-tag-unveil"
                  >
                    {tech.trim()}
                  </span>
                ))}
              </div>
              
              {/* Project Links */}
              <div className="flex justify-center space-x-4">
                {hoveredProject.projectUrl && (
                  <a
                    href={hoveredProject.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="catalog-button-unveil catalog-button-primary"
                  >
                    VIEW PROJECT
                  </a>
                )}
                {hoveredProject.githubUrl && (
                  <a
                    href={hoveredProject.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="catalog-button-unveil"
                  >
                    VIEW CODE
                  </a>
                )}
                <button
                  onClick={() => navigate(`/portfolio/${hoveredProject.id}`)}
                  className="catalog-button-unveil"
                >
                  LEARN MORE
                </button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Portfolio;