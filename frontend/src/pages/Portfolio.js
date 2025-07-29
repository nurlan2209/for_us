// frontend/src/pages/Portfolio.js - Исправленная полная версия
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { projectsAPI } from '../utils/api';

// Ленивая загрузка оптимизированного 3D компонента
const ProjectStack3D = React.lazy(() => 
  import('../components/3d/ProjectStack3D').then(module => ({
    default: module.ProjectStack3D
  }))
);

// Улучшенный лоадер для 3D сцены
const Scene3DLoader = () => (
  <div className="loading-3d-indicator">
    <div className="loading-spinner-3d" />
    <p className="text-sm text-neutral-600 font-medium">Loading 3D Scene...</p>
  </div>
);

// Компонент подсказок для пользователя
const ScrollHints = ({ show = true }) => {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => setVisible(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <>
      <div className="scroll-hint">
        🖱️ Scroll or use ← → arrows to navigate
      </div>
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.6, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="text-xs text-neutral-500 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full"
        >
          Scroll to explore projects
        </motion.div>
      </div>
    </>
  );
};

const Portfolio = () => {
  const [filter, setFilter] = useState('ALL');
  const [hoveredProject, setHoveredProject] = useState(null);
  const [is3DReady, setIs3DReady] = useState(false);
  const [showHints, setShowHints] = useState(true);
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

  // Скрываем подсказки при первом взаимодействии
  useEffect(() => {
    const handleInteraction = () => {
      setShowHints(false);
    };

    window.addEventListener('wheel', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });
    
    return () => {
      window.removeEventListener('wheel', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

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
      className="min-h-screen bg-white overflow-hidden"
    >

      {/* 3D Сцена с оптимизированным скроллом */}
      <section className="portfolio-3d-scene relative">
        <motion.div 
          className="canvas-container w-full bg-white"
          style={{ height: '100vh' }}
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
              
              // Оптимизация рендеринга для Mac
              gl.powerPreference = "high-performance";
              gl.antialias = true;
              
              setIs3DReady(true);
            }}
            style={{ background: 'linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%)' }}
            dpr={Math.min(window.devicePixelRatio, 2)} // Ограничиваем DPR для производительности
          >
            {/* Улучшенное освещение для стеклянного эффекта */}
            <ambientLight intensity={0.4} />
            <directionalLight
              position={[10, 10, 5]}
              intensity={0.8}
              castShadow
              shadow-mapSize={[1024, 1024]} // Уменьшено для производительности
              shadow-camera-near={0.5}
              shadow-camera-far={50}
              shadow-camera-left={-10}
              shadow-camera-right={10}
              shadow-camera-top={10}
              shadow-camera-bottom={-10}
            />
            <pointLight position={[-10, -10, -5]} intensity={0.3} color="#f1f5f9" />
            <pointLight position={[5, 5, 5]} intensity={0.4} color="#ffffff" />
            <pointLight position={[-5, 5, -5]} intensity={0.2} color="#e2e8f0" />

            {/* 3D Стек проектов с оптимизированным скроллом */}
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

            {/* Отключаем OrbitControls чтобы не мешать скроллу */}
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

          {/* Подсказки для пользователя */}
          <ScrollHints show={showHints && is3DReady} />

        </motion.div>
      </section>

      {/* Информация о текущем проекте - компактная версия */}
      <AnimatePresence>
        {hoveredProject && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.4 }}
            className="project-title-overlay visible"
          >
            <h3 className="font-medium">{hoveredProject.title}</h3>
            <p className="text-sm opacity-80 mt-1">
              {hoveredProject.technologies.split(',').slice(0, 3).join(', ')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Фильтры проектов */}
      <div className="fixed top-20 right-6 z-20 bg-white/90 backdrop-blur-sm rounded-lg border border-neutral-200 p-2">
        <div className="flex flex-col gap-1">
          {['ALL', 'FEATURED', 'WEB', '3D', 'MOBILE'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                filter === filterOption
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              {filterOption}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation подсказки под статистикой */}
      <div className="fixed bottom-6 left-6 z-20 space-y-2">
        {/* Статистика проектов */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-white/90 backdrop-blur-sm rounded-lg border border-neutral-200 p-3"
        >
          <div className="text-xs text-neutral-600">
            <div className="font-medium text-neutral-900 mb-1">
              {filteredProjects.length} Project{filteredProjects.length !== 1 ? 's' : ''}
            </div>
            <div>
              {filteredProjects.filter(p => p.featured).length} Featured
            </div>
          </div>
        </motion.div>

        {/* Navigation подсказки */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 0.6 }}
          className="bg-white/90 backdrop-blur-sm rounded-lg border border-neutral-200 p-3"
        >
          <div className="text-xs text-neutral-500 space-y-1">
            <div className="font-medium text-neutral-700 mb-2">Navigation:</div>
            <div>🖱️ Scroll to rotate</div>
            <div>← → Arrow keys</div>
            <div>Click to view project</div>
          </div>
        </motion.div>
      </div>

      {/* Информация о проекте при наведении - полная версия */}
      <AnimatePresence>
        {hoveredProject && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.4 }}
            className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-neutral-200 p-6 z-30"
          >
            <div className="max-w-4xl mx-auto text-center">
              
              <h2 className="text-2xl lg:text-3xl font-light text-neutral-900 tracking-tight mb-4">
                {hoveredProject.title}
              </h2>
              
              <p className="text-neutral-600 leading-relaxed mb-6 max-w-2xl mx-auto">
                {hoveredProject.description}
              </p>
              
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {hoveredProject.technologies.split(',').map((tech, index) => (
                  <span key={index} className="tech-tag-unveil">
                    {tech.trim()}
                  </span>
                ))}
              </div>
              
              <div className="flex justify-center space-x-4 flex-wrap gap-2">
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

      {/* Дополнительная информация о управлении - УДАЛЕНО, перенесено под статистику */}

      {/* Индикатор производительности - УДАЛЕН, заменен на навигацию под статистикой */}

    </motion.div>
  );
};

export default Portfolio;