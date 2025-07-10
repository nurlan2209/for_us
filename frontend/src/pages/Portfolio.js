// frontend/src/pages/Portfolio.js - ФИНАЛЬНАЯ РАБОЧАЯ ВЕРСИЯ
import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { projectsAPI } from '../utils/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import * as THREE from 'three';
import gsap from 'gsap';

// Компонент карточки проекта
const ProjectCard = ({ project, position, index, isSelected, onClick }) => {
  const meshRef = useRef();
  const groupRef = useRef();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  // Загружаем текстуру проекта
  const texture = useTexture(
    project.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjMwMCIgeT0iMjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIiBmb250LXNpemU9IjI0Ij5Qcm9qZWN0IEltYWdlPC90ZXh0Pgo8L3N2Zz4K',
    (texture) => {
      texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
    }
  );

  // Анимация
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime;
      const floatY = Math.sin(time + index * 0.5) * 0.1;
      
      if (hovered || isSelected) {
        groupRef.current.position.y = position[1] + floatY + (isSelected ? 1.0 : 0.5);
        groupRef.current.scale.setScalar(isSelected ? 1.2 : 1.1);
        groupRef.current.rotation.y = Math.sin(time * 2) * 0.1;
      } else {
        groupRef.current.position.y = position[1] + floatY;
        groupRef.current.scale.setScalar(1);
        groupRef.current.rotation.y = 0;
      }
    }
  });

  const handleClick = (event) => {
    event.stopPropagation();
    if (onClick) {
      onClick(project);
    } else {
      navigate(`/portfolio/${project.id}`);
    }
  };

  const handlePointerEnter = (event) => {
    event.stopPropagation();
    setHovered(true);
    
    // Обновляем курсор
    if (window.updateProjectCursor) {
      window.updateProjectCursor({
        show: true,
        title: project.title,
        textColor: 'light'
      });
    }
    
    document.body.style.cursor = 'none';
  };

  const handlePointerLeave = (event) => {
    event.stopPropagation();
    setHovered(false);
    
    if (window.updateProjectCursor) {
      window.updateProjectCursor({ show: false });
    }
    
    document.body.style.cursor = 'auto';
  };

  return (
    <group ref={groupRef} position={position}>
      
      {/* Область hover */}
      <mesh
        position={[0, 0, 0]}
        onClick={handleClick}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        visible={false}
      >
        <boxGeometry args={[4, 5, 0.5]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Основная карточка */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <boxGeometry args={[3.5, 4.5, 0.1]} />
        <meshStandardMaterial
          map={texture}
          transparent
          opacity={hovered ? 1 : 0.9}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* Избранный проект */}
      {project.featured && (
        <mesh position={[1.5, 2, 0.1]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#fbbf24"
            emissiveIntensity={0.5}
          />
        </mesh>
      )}
    </group>
  );
};

// Основной каталог проектов
const ProjectCatalog3D = ({ projects = [], onProjectClick }) => {
  const groupRef = useRef();
  const [hoveredProject, setHoveredProject] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Позиции проектов
  const getPosition = (index) => {
    const spacing = 5;
    return [
      (index - currentIndex) * spacing,
      index === currentIndex ? 0.2 : 0,
      0
    ];
  };

  // Скролл для навигации
  useEffect(() => {
    let scrollTimeout;
    
    const handleWheel = (event) => {
      event.preventDefault();
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (event.deltaY > 0) {
          setCurrentIndex(prev => Math.min(prev + 1, projects.length - 1));
        } else {
          setCurrentIndex(prev => Math.max(prev - 1, 0));
        }
      }, 150);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      clearTimeout(scrollTimeout);
    };
  }, [projects.length]);

  // Анимация группы
  useFrame(() => {
    if (groupRef.current) {
      const targetX = -currentIndex * 5;
      groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {projects.map((project, index) => (
        <ProjectCard
          key={project.id}
          project={project}
          index={index}
          position={getPosition(index)}
          isSelected={index === currentIndex}
          onClick={onProjectClick}
          onHover={(project, isHovered) => {
            setHoveredProject(isHovered ? project : null);
          }}
        />
      ))}
    </group>
  );
};

const Portfolio = () => {
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
      staleTime: 5 * 60 * 1000,
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
      <section className="py-8 px-4 bg-gray-800/50 backdrop-blur-sm border-b border-gray-700" ref={controlsRef}>
        <div className="max-w-6xl mx-auto">
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
              
              {/* Count */}
              <div className="ml-4 bg-gray-900/50 px-4 py-2 rounded-lg border border-gray-600">
                <span className="text-primary-400 font-bold text-lg">
                  {filteredProjects.length}
                </span>
                <span className="text-gray-400 text-sm ml-2">
                  {filteredProjects.length === 1 ? 'проект' : 'проектов'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Hint */}
      <section className="py-4 px-4 bg-primary-900/20">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-primary-400 font-medium">
            🖱️ Прокрутите колесиком мыши для навигации между проектами
          </div>
        </div>
      </section>

      {/* 3D Portfolio Section */}
      <section className="relative">
        <div 
          className="w-full"
          style={{
            height: '100vh',
            minHeight: '600px',
            backgroundColor: '#111827',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <AnimatePresence mode="wait">
            {filteredProjects.length > 0 ? (
              <motion.div
                key={`catalog-${filter}-${searchTerm}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="h-full"
              >
                <Canvas
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    left: 0
                  }}
                  camera={{ 
                    position: [0, 2, 12], 
                    fov: 75
                  }}
                  dpr={[1, 1.5]}
                  onCreated={({ gl }) => {
                    // Обеспечиваем видимость Canvas
                    gl.domElement.style.display = 'block';
                    gl.domElement.style.visibility = 'visible';
                    gl.domElement.style.opacity = '1';
                  }}
                >
                  {/* Освещение */}
                  <ambientLight intensity={0.6} />
                  <pointLight position={[10, 10, 10]} intensity={1} />
                  <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
                  <directionalLight
                    position={[0, 10, 5]}
                    intensity={0.5}
                  />

                  {/* Звезды для атмосферы */}
                  <mesh>
                    <sphereGeometry args={[300, 32, 32]} />
                    <meshBasicMaterial 
                      color="#000011" 
                      side={THREE.BackSide}
                    />
                  </mesh>

                  {/* Каталог проектов */}
                  <ProjectCatalog3D projects={filteredProjects} />

                  {/* Контролы */}
                  <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    enableRotate={false}
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
        </div>
      </section>
    </div>
  );
};

export default Portfolio;