// frontend/src/components/3d/ProjectStack3D.js - Обновленная версия с оптимизированным скроллом

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';

const ProjectCarouselCard = React.memo(({ 
  project, 
  position = [0, 0, 0], 
  index = 0,
  onClick,
  onHover
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
    
    // Показываем обычный курсор в 3D зоне
    document.body.style.cursor = 'pointer';
  };

  const handlePointerLeave = (event) => {
    event.stopPropagation();
    onHover && onHover(project, false);
    
    if (window.updateProjectCursor) {
      window.updateProjectCursor({ show: false });
    }
    
    // Возвращаем обычный курсор
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
        <planeGeometry args={[3, 2.25]} />
        <meshBasicMaterial
          map={texture}
          side={THREE.DoubleSide}
        />
      </mesh>

      {project.featured && (
        <mesh position={[1.3, 1.0, 0.01]}>
          <circleGeometry args={[0.06, 8]} />
          <meshBasicMaterial color="#0066ff" />
        </mesh>
      )}
    </group>
  );
});

// Утилита для детекции Mac
const isMacOS = () => {
  return typeof navigator !== 'undefined' && 
         /Mac|iPod|iPhone|iPad/.test(navigator.platform);
};

// Утилита для нормализации deltaY на разных платформах
const normalizeDeltaY = (deltaY, deltaMode) => {
  // deltaMode: 0 = pixel, 1 = line, 2 = page
  let normalizedDelta = deltaY;
  
  if (deltaMode === 1) {
    // Line mode - умножаем на высоту строки
    normalizedDelta = deltaY * 16;
  } else if (deltaMode === 2) {
    // Page mode - умножаем на высоту страницы
    normalizedDelta = deltaY * window.innerHeight;
  }
  
  return normalizedDelta;
};

// Оптимизированный обработчик скролла для Mac тачпада
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

    // Нормализуем deltaY для разных режимов
    let normalizedDelta = normalizeDeltaY(event.deltaY, event.deltaMode);
    
    // Специальная обработка для Mac тачпада
    if (isMacOS()) {
      // На Mac тачпад генерирует много мелких событий
      // Уменьшаем чувствительность и добавляем аккумуляцию
      normalizedDelta *= 0.3; // Снижаем чувствительность
      
      // Игнорируем очень маленькие движения (шум тачпада)
      if (Math.abs(normalizedDelta) < 1) {
        return;
      }
    } else {
      // Для мыши - стандартная обработка
      normalizedDelta *= 0.5;
    }

    // Определяем направление
    const newDirection = normalizedDelta > 0 ? 1 : -1;
    
    // Аккумулируем скролл
    scrollState.current.accumulator += normalizedDelta;
    scrollState.current.velocity = normalizedDelta / Math.max(deltaTime, 16);
    
    // Пороговое значение для переключения проекта
    const threshold = isMacOS() ? 25 : 50;
    
    if (Math.abs(scrollState.current.accumulator) >= threshold) {
      const steps = Math.floor(Math.abs(scrollState.current.accumulator) / threshold);
      const direction = scrollState.current.accumulator > 0 ? 1 : -1;
      
      // Вызываем колбэк с количеством шагов
      onScroll(direction, steps);
      
      // Сбрасываем аккумулятор
      scrollState.current.accumulator = 0;
    }

    // Throttling для предотвращения слишком частых обновлений
    if (!scrollState.current.isScrolling) {
      scrollState.current.isScrolling = true;
      
      // Очищаем предыдущий таймаут
      if (scrollState.current.scrollTimeout) {
        clearTimeout(scrollState.current.scrollTimeout);
      }
      
      // Устанавливаем новый таймаут
      scrollState.current.scrollTimeout = setTimeout(() => {
        scrollState.current.isScrolling = false;
        scrollState.current.accumulator = 0; // Сбрасываем остаток
      }, isMacOS() ? 150 : 100);
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

// Оптимизированный хук для управления клавиатурой
const useKeyboardNavigation = (onNavigate, projects) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Проверяем, что фокус не на input/textarea
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

// 3D Стек проектов с оптимизированным скроллом
export const ProjectStack3D = ({ projects = [], onProjectClick }) => {
  const groupRef = useRef();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hoveredProject, setHoveredProject] = useState(null);

  // Оптимизированная функция навигации
  const navigate = useCallback((direction, steps = 1) => {
    if (isTransitioning || projects.length === 0) return;
    
    setIsTransitioning(true);
    
    let newIndex;
    const totalSteps = direction * steps;
    newIndex = (currentIndex + totalSteps + projects.length) % projects.length;
    
    setCurrentIndex(newIndex);
    
    // Сбрасываем флаг транзиции с задержкой
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300); // Время должно соответствовать анимации вращения
    
  }, [currentIndex, projects.length, isTransitioning]);

  // Подключаем оптимизированный скролл
  useOptimizedScroll(navigate, projects);
  
  // Подключаем клавиатурную навигацию
  useKeyboardNavigation(navigate, projects);

  // Плавная анимация карусели
  useFrame((state) => {
    if (groupRef.current && projects.length > 0) {
      const targetRotation = -(currentIndex * Math.PI * 2) / projects.length;
      const currentRotation = groupRef.current.rotation.y;
      
      // Вычисляем кратчайший путь поворота
      let rotationDiff = targetRotation - currentRotation;
      
      // Нормализуем разность угла
      while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
      while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
      
      // Применяем плавное вращение
      const rotationSpeed = isTransitioning ? 0.12 : 0.08;
      groupRef.current.rotation.y += rotationDiff * rotationSpeed;
      
      // Легкое покачивание
      const time = state.clock.elapsedTime;
      groupRef.current.position.y = Math.sin(time * 0.5) * 0.05;
    }
  });

  const getCarouselPosition = (index) => {
    const radius = 4;
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
            />
          );
        })}
      </group>

      {/* Улучшенное освещение */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[0, 5, 5]} intensity={0.4} />
      <pointLight position={[-5, 3, -5]} intensity={0.3} color="#e2e8f0" />

      {/* Навигационные точки */}
      <group position={[0, -3, 0]}>
        {projects.map((_, index) => (
          <mesh
            key={index}
            position={[(index - projects.length / 2) * 0.4, 0, 0]}
            onClick={() => !isTransitioning && setCurrentIndex(index)}
          >
            <sphereGeometry args={[0.04, 8, 8]} />
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