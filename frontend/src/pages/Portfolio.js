// frontend/src/pages/Portfolio.js
import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Stars } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from 'react-query';
import { projectsAPI } from '../utils/api';
import { ProjectGrid3D, ProjectCarousel3D } from '../components/3d/ProjectCard3D';
import { ProjectCatalog3D } from '../components/3d/ProjectCatalog3D';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import gsap from 'gsap';

const Portfolio = () => {
  const [viewMode, setViewMode] = useState('catalog'); // только каталог
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

            {/* Filters + Count */}
            <div className="flex flex-wrap gap-2 items-center">
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
              {technologies.slice(0, 4).map(tech => (
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
              
              {/* Count справа от фильтров */}
              <div className="ml-4 bg-gray-900/50 px-4 py-2 rounded-lg border border-gray-600">
                <span className="text-primary-400 font-bold text-lg">
                  {filteredProjects.length}
                </span>
                <span className="text-gray-400 text-sm ml-2">
                  {filteredProjects.length === 1 ? 'проект' : 'проектов'}
                </span>
              </div>
            </div>

            {/* Убираем переключатель режимов - только каталог */}
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
                camera={{ 
                  position: viewMode === 'catalog' ? [0, 2, 12] : [0, 0, 8], 
                  fov: 75 
                }}
                style={{ background: 'linear-gradient(to bottom, #111827, #1f2937)' }}
              >
                {/* Lighting setup для разных режимов */}
                <ambientLight intensity={viewMode === 'catalog' ? 0.7 : 0.6} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
                <directionalLight
                  position={[0, 10, 5]}
                  intensity={0.8}
                  castShadow
                  shadow-mapSize-width={2048}
                  shadow-mapSize-height={2048}
                />

                {/* Environment */}
                <Environment preset="night" />
                
                {/* Stars для атмосферы */}
                <Stars 
                  radius={300} 
                  depth={60} 
                  count={3000} 
                  factor={4} 
                  saturation={0} 
                  fade 
                />

                {/* Только каталог */}
                <ProjectCatalog3D projects={filteredProjects} />

                {/* Controls - УБИРАЕМ вращение, только скролл для навигации */}
                <OrbitControls
                  enableZoom={false}
                  enablePan={false}
                  enableRotate={false}
                  maxDistance={20}
                  minDistance={5}
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

        {/* УБИРАЕМ 3D Navigation Hint */}

        {/* УБИРАЕМ Stats & Info - больше не нужно */}

        {/* УБИРАЕМ View Mode Description */}
      </section>

      {/* УБИРАЕМ Additional Info Section */}
    </div>
  );
};

export default Portfolio;