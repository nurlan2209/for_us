// frontend/src/pages/Portfolio.js
import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from 'react-query';
import { projectsAPI } from '../utils/api';
import { ProjectGrid3D, ProjectCarousel3D } from '../components/3d/ProjectCard3D';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import gsap from 'gsap';

const Portfolio = () => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'carousel'
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const headerRef = useRef(null);
  const controlsRef = useRef(null);

  // Fetch projects
  const { data: projectsData, isLoading, error } = useQuery(
    'projects',
    () => projectsAPI.getAll({ status: 'published' }),
    {
      select: (response) => response.data.projects,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const projects = projectsData || [];

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'featured') return project.featured && matchesSearch;
    
    return project.technologies.toLowerCase().includes(filter.toLowerCase()) && matchesSearch;
  });

  // Get unique technologies for filter
  const technologies = [...new Set(
    projects.flatMap(project => 
      project.technologies.split(',').map(tech => tech.trim())
    )
  )];

  // GSAP animations
  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(headerRef.current.children,
        { opacity: 0, y: 50 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.8, 
          stagger: 0.2,
          ease: "power3.out"
        }
      );
    }

    if (controlsRef.current) {
      gsap.fromTo(controlsRef.current.children,
        { opacity: 0, x: -30 },
        { 
          opacity: 1, 
          x: 0, 
          duration: 0.6, 
          stagger: 0.1,
          delay: 0.5,
          ease: "power2.out"
        }
      );
    }
  }, []);

  if (isLoading) return <LoadingSpinner text="Загрузка портфолио..." />;
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">
            Ошибка загрузки
          </h2>
          <p className="text-gray-400">
            Не удалось загрузить проекты. Попробуйте обновить страницу.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      {/* Header Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-6xl mx-auto text-center" ref={headerRef}>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary-400 to-accent-500 bg-clip-text text-transparent">
            Мои Проекты
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Коллекция интерактивных веб-приложений и 3D визуализаций, 
            созданных с использованием современных технологий
          </p>
          <div className="text-lg text-primary-400">
            {filteredProjects.length} {filteredProjects.length === 1 ? 'проект' : 'проектов'}
          </div>
        </div>
      </section>

      {/* Controls Section */}
      <section className="py-8 px-4 bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-6xl mx-auto" ref={controlsRef}>
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            
            {/* Search */}
            <div className="relative w-full lg:w-auto">
              <input
                type="text"
                placeholder="Поиск проектов..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full lg:w-80 bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
              />
              <svg
                className="absolute right-3 top-2.5 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Все
              </button>
              <button
                onClick={() => setFilter('featured')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'featured'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Избранные
              </button>
              {technologies.slice(0, 5).map(tech => (
                <button
                  key={tech}
                  onClick={() => setFilter(tech)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === tech
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {tech}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Сетка
              </button>
              <button
                onClick={() => setViewMode('carousel')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'carousel'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Карусель
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3D Portfolio Section */}
      <section className="relative h-screen">
        <AnimatePresence mode="wait">
          {filteredProjects.length > 0 ? (
            <motion.div
              key={`${viewMode}-${filter}-${searchTerm}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="h-full"
            >
              <Canvas
                camera={{ position: [0, 0, 8], fov: 75 }}
                style={{ background: 'linear-gradient(to bottom, #111827, #1f2937)' }}
              >
                {/* Lighting */}
                <ambientLight intensity={0.6} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
                
                {/* Environment */}
                <Environment preset="night" />

                {/* 3D Projects */}
                {viewMode === 'grid' ? (
                  <ProjectGrid3D projects={filteredProjects} />
                ) : (
                  <ProjectCarousel3D projects={filteredProjects} />
                )}

                {/* Controls */}
                <OrbitControls
                  enableZoom={true}
                  enablePan={true}
                  maxDistance={15}
                  minDistance={3}
                  maxPolarAngle={Math.PI / 1.5}
                  minPolarAngle={Math.PI / 4}
                />
              </Canvas>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex items-center justify-center"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Проекты не найдены
                </h3>
                <p className="text-gray-400 mb-6">
                  Попробуйте изменить фильтры или поисковый запрос
                </p>
                <button
                  onClick={() => {
                    setFilter('all');
                    setSearchTerm('');
                  }}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Сбросить фильтры
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3D Navigation Hint */}
        <div className="absolute bottom-6 left-6 bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 text-sm text-gray-300">
          <div className="flex items-center space-x-2 mb-2">
            <span>🖱️</span>
            <span>Вращайте: зажмите левую кнопку мыши</span>
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <span>🔍</span>
            <span>Масштаб: колесо мыши</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>👆</span>
            <span>Перемещение: зажмите правую кнопку</span>
          </div>
        </div>

        {/* Stats */}
        <div className="absolute top-6 right-6 bg-gray-900/80 backdrop-blur-sm rounded-lg p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-400">
              {filteredProjects.length}
            </div>
            <div className="text-sm text-gray-400">
              {viewMode === 'grid' ? 'в сетке' : 'в карусели'}
            </div>
          </div>
        </div>
      </section>

      {/* Traditional Grid View (Fallback) */}
      {filteredProjects.length > 0 && (
        <section className="py-20 px-4 bg-gray-900">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-12 text-center">
              Традиционный вид
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map((project, index) => (
                <ProjectCard2D key={project.id} project={project} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

// 2D Project Card Component (Traditional fallback)
const ProjectCard2D = ({ project, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-primary-500 transition-all duration-300 group"
    >
      {/* Project Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={project.imageUrl || '/placeholder-project.jpg'}
          alt={project.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {project.featured && (
          <div className="absolute top-4 right-4 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">
            ⭐ Избранный
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Project Info */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary-400 transition-colors">
          {project.title}
        </h3>
        <p className="text-gray-400 mb-4 line-clamp-3">
          {project.description}
        </p>
        
        {/* Technologies */}
        <div className="flex flex-wrap gap-2 mb-4">
          {project.technologies.split(',').slice(0, 3).map((tech, i) => (
            <span
              key={i}
              className="bg-primary-500/20 text-primary-300 px-2 py-1 rounded text-xs"
            >
              {tech.trim()}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <a
            href={`/portfolio/${project.id}`}
            className="flex-1 bg-primary-500 hover:bg-primary-600 text-white text-center py-2 rounded-lg transition-colors"
          >
            Подробнее
          </a>
          {project.projectUrl && (
            <a
              href={project.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 border border-primary-500 text-primary-400 hover:bg-primary-500 hover:text-white text-center py-2 rounded-lg transition-colors"
            >
              Демо
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Portfolio;