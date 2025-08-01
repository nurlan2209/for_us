// frontend/src/components/3d/ProjectStack3D.js - АДАПТИВНАЯ ВЕРСИЯ для мобильных
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';

const ProjectCarouselCard = React.memo(({ 
  project, 
  position = [0, 0, 0], 
  index = 0,
  onClick,
  onHover,
  isMobile = false // ✅ НОВЫЙ ПРОПС для мобильной версии
}) => {
  const meshRef = useRef();
  const groupRef = useRef();
  const navigate = useNavigate();

  const textureUrl = project.imageUrl || `data:image/svg+xml;base64,${btoa(`
    <svg width="400" height="300" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#f8fafc"/>
      <circle cx="200" cy="150" r="50" fill="#cbd5e1"/>
      <text x="200" y="250" text-anchor="middle" fill="#64748b" font-family="system-ui" font-size="16" font-weight="500">${project.title}</text>
    </svg>
  `)}`;

  const texture = useTexture(textureUrl, (texture) => {
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.flipY = true;
  });

  // ✅ АДАПТИВНЫЕ РАЗМЕРЫ для карточек
  const cardSize = isMobile ? [2.2, 1.65] : [3, 2.25]; // Уменьшаем размер на мобильных

  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    groupRef.current.position.x += (position[0] - groupRef.current.position.x) * 0.1;
    groupRef.current.position.y += (position[1] + Math.sin(time + index) * 0.05 - groupRef.current.position.y) * 0.1;
    groupRef.current.position.z += (position[2] - groupRef.current.position.z) * 0.1;
    
    if (meshRef.current && state.camera) {
      meshRef.current.lookAt(state.camera.position);
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
    onHover && onHover(project, true);
    
    if (window.updateProjectCursor) {
      window.updateProjectCursor({
        show: true,
        title: project.title,
        textColor: 'light'
      });
    }
    
    document.body.style.cursor = 'pointer';
  };

  const handlePointerLeave = (event) => {
    event.stopPropagation();
    onHover && onHover(project, false);
    
    if (window.updateProjectCursor) {
      window.updateProjectCursor({ show: false });
    }
    
    document.body.style.cursor = 'auto';
  };

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        {/* ✅ ИСПОЛЬЗУЕМ АДАПТИВНЫЕ РАЗМЕРЫ */}
        <planeGeometry args={cardSize} />
        <meshBasicMaterial
          map={texture}
          side={THREE.DoubleSide}
        />
      </mesh>

      {project.featured && (
        <mesh position={[cardSize[0] * 0.43, cardSize[1] * 0.44, 0.01]}>
          {/* ✅ АДАПТИВНЫЙ РАЗМЕР индикатора */}
          <circleGeometry args={[isMobile ? 0.04 : 0.06, 8]} />
          <meshBasicMaterial color="#0066ff" />
        </mesh>
      )}
    </group>
  );
});

// Утилита для детекции мобильных устройств
const isMobileDevice = () => {
  return typeof window !== 'undefined' && window.innerWidth <= 1024;
};

// Утилита для нормализации deltaY на разных платформах
const normalizeDeltaY = (deltaY, deltaMode) => {
  let normalizedDelta = deltaY;
  
  if (deltaMode === 1) {
    normalizedDelta = deltaY * 16;
  } else if (deltaMode === 2) {
    normalizedDelta = deltaY * window.innerHeight;
  }
  
  return normalizedDelta;
};

// Оптимизированный обработчик скролла
const useOptimizedScroll = (onScroll, projects) => {
  const scrollState = useRef({
    isScrolling: false,
    scrollTimeout: null,
    accumulator: 0,
    lastTime: 0,
    velocity: 0,
    direction: 0
  });

  const handleWheel = useCallback((event) => {
    event.preventDefault();
    
    const now = Date.now();
    const deltaTime = now - scrollState.current.lastTime;
    scrollState.current.lastTime = now;

    let normalizedDelta = normalizeDeltaY(event.deltaY, event.deltaMode);
    
    // ✅ АДАПТИВНАЯ чувствительность для мобильных
    const isMobile = isMobileDevice();
    normalizedDelta *= isMobile ? 0.2 : 0.3; // Меньше чувствительность на мобильных
    
    if (Math.abs(normalizedDelta) < 1) {
      return;
    }

    const newDirection = normalizedDelta > 0 ? 1 : -1;
    
    scrollState.current.accumulator += normalizedDelta;
    scrollState.current.velocity = normalizedDelta / Math.max(deltaTime, 16);
    
    // ✅ АДАПТИВНЫЙ порог для мобильных
    const threshold = isMobile ? 15 : 25;
    
    if (Math.abs(scrollState.current.accumulator) >= threshold) {
      const steps = Math.floor(Math.abs(scrollState.current.accumulator) / threshold);
      const direction = scrollState.current.accumulator > 0 ? 1 : -1;
      
      onScroll(direction, steps);
      scrollState.current.accumulator = 0;
    }

    if (!scrollState.current.isScrolling) {
      scrollState.current.isScrolling = true;
      
      if (scrollState.current.scrollTimeout) {
        clearTimeout(scrollState.current.scrollTimeout);
      }
      
      scrollState.current.scrollTimeout = setTimeout(() => {
        scrollState.current.isScrolling = false;
        scrollState.current.accumulator = 0;
      }, isMobile ? 100 : 150);
    }
  }, [onScroll]);

  useEffect(() => {
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (scrollState.current.scrollTimeout) {
        clearTimeout(scrollState.current.scrollTimeout);
      }
    };
  }, [handleWheel]);
};

// Клавиатурная навигация
const useKeyboardNavigation = (onNavigate, projects) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          onNavigate(-1);
          break;
        case 'ArrowRight':
          event.preventDefault();
          onNavigate(1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate, projects.length]);
};

// 3D Стек проектов с адаптивными размерами
export const ProjectStack3D = ({ projects = [], onProjectClick }) => {
  const groupRef = useRef();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hoveredProject, setHoveredProject] = useState(null);
  const [isMobile, setIsMobile] = useState(isMobileDevice());
  
  // ✅ ОТСЛЕЖИВАНИЕ размера экрана для адаптивности
  const { viewport } = useThree();
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isMobileDevice());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Оптимизированная функция навигации
  const navigate = useCallback((direction, steps = 1) => {
    if (isTransitioning || projects.length === 0) return;
    
    setIsTransitioning(true);
    
    let newIndex;
    const totalSteps = direction * steps;
    newIndex = (currentIndex + totalSteps + projects.length) % projects.length;
    
    setCurrentIndex(newIndex);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
    
  }, [currentIndex, projects.length, isTransitioning]);

  // Подключаем скролл и клавиатуру
  useOptimizedScroll(navigate, projects);
  useKeyboardNavigation(navigate, projects);

  // Плавная анимация карусели с адаптивным радиусом
  useFrame((state) => {
    if (groupRef.current && projects.length > 0) {
      const targetRotation = -(currentIndex * Math.PI * 2) / projects.length;
      const currentRotation = groupRef.current.rotation.y;
      
      let rotationDiff = targetRotation - currentRotation;
      
      while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
      while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
      
      const rotationSpeed = isTransitioning ? 0.12 : 0.08;
      groupRef.current.rotation.y += rotationDiff * rotationSpeed;
      
      const time = state.clock.elapsedTime;
      groupRef.current.position.y = Math.sin(time * 0.5) * 0.05;
    }
  });

  const getCarouselPosition = (index) => {
    // ✅ АДАПТИВНЫЙ радиус для мобильных устройств
    const radius = isMobile ? 2.8 : 4; // Меньше радиус = ближе к камере = меньше карточки
    const angle = (index * Math.PI * 2) / projects.length;
    
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    const y = 0;
    
    return [x, y, z];
  };

  const handleProjectHover = (project, isHovered) => {
    setHoveredProject(isHovered ? project : null);
  };

  if (projects.length === 0) {
    return null;
  }

  return (
    <>
      {/* Основная карусель */}
      <group ref={groupRef}>
        {projects.map((project, index) => {
          const position = getCarouselPosition(index);

          return (
            <ProjectCarouselCard
              key={project.id}
              project={project}
              position={position}
              index={index}
              onClick={onProjectClick}
              onHover={handleProjectHover}
              isMobile={isMobile} // ✅ ПЕРЕДАЕМ флаг мобильной версии
            />
          );
        })}
      </group>

      {/* ✅ АДАПТИВНОЕ освещение */}
      <ambientLight intensity={isMobile ? 0.7 : 0.6} />
      <directionalLight position={[0, 5, 5]} intensity={isMobile ? 0.5 : 0.4} />
      <pointLight position={[-5, 3, -5]} intensity={0.3} color="#e2e8f0" />

      {/* ✅ АДАПТИВНЫЕ навигационные точки */}
      <group position={[0, isMobile ? -2.5 : -3, 0]}>
        {projects.map((_, index) => (
          <mesh
            key={index}
            position={[(index - projects.length / 2) * (isMobile ? 0.3 : 0.4), 0, 0]}
            onClick={() => !isTransitioning && setCurrentIndex(index)}
          >
            <sphereGeometry args={[isMobile ? 0.03 : 0.04, 8, 8]} />
            <meshBasicMaterial 
              color={index === currentIndex ? "#0066ff" : "#d4d4d8"}
              transparent
              opacity={index === currentIndex ? 1 : 0.6}
            />
          </mesh>
        ))}
      </group>
    </>
  );
};

export default ProjectStack3D;