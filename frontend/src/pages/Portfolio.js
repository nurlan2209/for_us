// frontend/src/pages/Portfolio.js - Обновленная версия со стеком
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { projectsAPI } from '../utils/api';

// Ленивая загрузка нового 3D компонента
const ProjectStack3D = React.lazy(() => 
  import('../components/3d/ProjectStack3D').then(module => ({
    default: module.ProjectStack3D
  }))
);

// Простой лоадер для 3D сцены
const Scene3DLoader = () => (
  <div className="flex items-center justify-center h-full">
    <div className="w-12 h-12 border-2 border-neutral-200 border-t-neutral-600 rounded-full animate-spin" />
  </div>
);

const Portfolio = () => {
  const [filter, setFilter] = useState('ALL');
  const [hoveredProject, setHoveredProject] = useState(null);
  const [is3DReady, setIs3DReady] = useState(false);
  const navigate = useNavigate();
  const canvasRef = useRef();

  // Оптимизированный запрос проектов
  const { data: projectsData, isLoading, error } = useQuery(
    'projects',
    () => projectsAPI.getAll({ status: 'published' }),
    {
      select: (response) => response.data.projects,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );

  const projects = projectsData || [];

  // Мемоизированная фильтрация
  const filteredProjects = React.useMemo(() => {
    return projects.filter(project => {
      if (filter === 'ALL') return true;
      if (filter === 'FEATURED') return project.featured;
      if (filter === 'WEB') return project.technologies.toLowerCase().includes('react') || project.technologies.toLowerCase().includes('web');
      if (filter === 'MOBILE') return project.technologies.toLowerCase().includes('mobile') || project.technologies.toLowerCase().includes('react native');
      if (filter === '3D') return project.technologies.toLowerCase().includes('three') || project.technologies.toLowerCase().includes('3d');
      return false;
    });
  }, [projects, filter]);

  // Предзагрузка критических ресурсов
  useEffect(() => {
    if (filteredProjects.length > 0) {
      const firstProject = filteredProjects[0];
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = `/portfolio/${firstProject.id}`;
      document.head.appendChild(link);
    }
  }, [filteredProjects]);

  // Показываем ошибку без черного экрана
  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-white"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">Loading Error</h2>
          <p className="text-neutral-600 mb-8">Failed to load projects.</p>
          <button
            onClick={() => window.location.reload()}
            className="catalog-button-unveil catalog-button-primary"
          >
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  // Показываем лоадер без черного экрана
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-white"
      >
        <section className="pt-24 pb-8 px-6 lg:px-8">
          <div className="max-w-screen-2xl mx-auto text-center">
            <div className="loading-shimmer h-16 w-64 mx-auto mb-4 rounded" />
            <div className="loading-shimmer h-6 w-32 mx-auto rounded" />
          </div>
        </section>
        <div className="w-full h-96 flex items-center justify-center">
          <Scene3DLoader />
        </div>
      </motion.div>
    );
  }

  if (filteredProjects.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-white"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">No Projects Found</h2>
          <p className="text-neutral-600 mb-8">Try adjusting your filters.</p>
          <button
            onClick={() => setFilter('ALL')}
            className="catalog-button-unveil catalog-button-primary"
          >
            Show All Projects
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-white"
    >

      {/* 3D Сцена со стеком проектов */}
      <section className="relative">
        <motion.div 
          className="w-full bg-white"
          style={{ height: '80vh', minHeight: '600px' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Canvas
            ref={canvasRef}
            camera={{ 
              position: [0, 0, 8], 
              fov: 60,
              near: 0.1,
              far: 1000 
            }}
            onCreated={({ gl, camera }) => {
              gl.setClearColor('#ffffff');
              gl.physicallyCorrectLights = true;
              gl.shadowMap.enabled = true;
              gl.shadowMap.type = THREE.PCFSoftShadowMap;
              setIs3DReady(true);
            }}
            style={{ background: 'linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%)' }}
          >
            {/* Улучшенное освещение для стеклянного эффекта */}
            <ambientLight intensity={0.4} />
            <directionalLight
              position={[10, 10, 5]}
              intensity={0.8}
              castShadow
              shadow-mapSize={[2048, 2048]}
              shadow-camera-near={0.5}
              shadow-camera-far={50}
              shadow-camera-left={-10}
              shadow-camera-right={10}
              shadow-camera-top={10}
              shadow-camera-bottom={-10}
            />
            <pointLight position={[-10, -10, -5]} intensity={0.3} color="#f1f5f9" />
            
            {/* Дополнительное освещение для отражений */}
            <pointLight position={[5, 5, 5]} intensity={0.4} color="#ffffff" />
            <pointLight position={[-5, 5, -5]} intensity={0.2} color="#e2e8f0" />

            {/* 3D Стек проектов с Suspense */}
            <Suspense fallback={null}>
              <ProjectStack3D 
                projects={filteredProjects}
                currentFilter={filter}
                onProjectClick={(project) => {
                  setHoveredProject(project);
                  navigate(`/portfolio/${project.id}`);
                }}
              />
            </Suspense>

            <OrbitControls
              enableZoom={false}
              enablePan={false}
              enableRotate={false}
              autoRotate={false}
            />
          </Canvas>

          {/* Индикатор загрузки 3D */}
          <AnimatePresence>
            {!is3DReady && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 bg-white/90 flex items-center justify-center"
              >
                <Scene3DLoader />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Информация о проекте при наведении */}
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
              
              <h2 className="text-4xl lg:text-5xl font-light text-neutral-900 tracking-tight mb-6">
                {hoveredProject.title}
              </h2>
              
              <p className="text-lg text-neutral-600 leading-relaxed mb-8 max-w-2xl mx-auto">
                {hoveredProject.description}
              </p>
              
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {hoveredProject.technologies.split(',').map((tech, index) => (
                  <span key={index} className="tech-tag-unveil">
                    {tech.trim()}
                  </span>
                ))}
              </div>
              
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
    </motion.div>
  );
};

export default Portfolio;