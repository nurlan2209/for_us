// frontend/src/components/3d/ProjectCatalog3D.js
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';

const ProjectCatalogCard = ({ 
  project, 
  position = [0, 0, 0], 
  index = 0,
  onClick,
  onHover,
  totalProjects = 1,
  isSelected = false // Добавляем проп для выбранного состояния
}) => {
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

  // Анимация каждый кадр
  useFrame((state) => {
    if (groupRef.current) {
      // Базовое плавание
      const floatY = Math.sin(state.clock.elapsedTime + index * 0.5) * 0.05;
      
      if (hovered || isSelected) {
        // При наведении или выборе - поднимаем и поворачиваем
        groupRef.current.position.y = THREE.MathUtils.lerp(
          groupRef.current.position.y,
          position[1] + floatY + (isSelected ? 2.0 : 1.5), // Выбранный поднимается выше
          0.1
        );
        
        groupRef.current.rotation.x = THREE.MathUtils.lerp(
          groupRef.current.rotation.x,
          -0.3,
          0.1
        );
        
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
          groupRef.current.rotation.y,
          Math.sin(state.clock.elapsedTime * 2) * 0.1,
          0.1
        );
        
        groupRef.current.scale.setScalar(
          THREE.MathUtils.lerp(groupRef.current.scale.x, isSelected ? 1.2 : 1.1, 0.1)
        );
      } else {
        // Возвращаем в исходное положение
        groupRef.current.position.y = THREE.MathUtils.lerp(
          groupRef.current.position.y,
          position[1] + floatY,
          0.1
        );
        
        groupRef.current.rotation.x = THREE.MathUtils.lerp(
          groupRef.current.rotation.x,
          0,
          0.1
        );
        
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
          groupRef.current.rotation.y,
          0,
          0.1
        );
        
        groupRef.current.scale.setScalar(
          THREE.MathUtils.lerp(groupRef.current.scale.x, 1, 0.1)
        );
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
    onHover && onHover(project, true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerLeave = (event) => {
    event.stopPropagation();
    setHovered(false);
    onHover && onHover(project, false);
    document.body.style.cursor = 'auto';
  };

  return (
    <group ref={groupRef} position={position}>
      
      {/* Большая невидимая область для hover */}
      <mesh
        position={[0, 0, 0]}
        onClick={handleClick}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        visible={false}
      >
        <boxGeometry args={[3, 4, 1]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Основная карточка проекта - УВЕЛИЧИВАЕМ */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <boxGeometry args={[4, 5.5, 0.15]} />
        <meshStandardMaterial
          map={texture}
          transparent
          opacity={hovered ? 1 : 0.9}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>

      {/* Подставка/основание - убираем */}

      {/* Заголовок проекта - УВЕЛИЧИВАЕМ размер и делаем ближе */}
      <Html
        position={[0, -3.2, 0.5]}
        center
        distanceFactor={3}
        transform={false}
        occlude={false}
        style={{ 
          pointerEvents: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
      >
        <div 
          className="text-center pointer-events-none select-none"
          style={{
            background: hovered ? 'rgba(14, 165, 233, 0.9)' : 'rgba(17, 24, 39, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '16px 28px',
            border: hovered ? '1px solid rgba(14, 165, 233, 0.8)' : '1px solid rgba(55, 65, 81, 0.5)',
            transition: 'all 0.3s ease',
            transform: hovered ? 'scale(1.1)' : 'scale(1)',
            boxShadow: hovered ? '0 15px 50px rgba(14, 165, 233, 0.4)' : '0 8px 25px rgba(0, 0, 0, 0.3)',
            minWidth: '300px'
          }}
        >
          <h3 
            className={`font-bold transition-all duration-300 ${
              hovered ? 'text-white text-2xl' : 'text-white text-xl'
            }`}
            style={{
              textShadow: hovered ? '0 0 15px rgba(255, 255, 255, 0.5)' : 'none',
              fontFamily: 'Inter, system-ui, sans-serif',
              marginBottom: '12px'
            }}
          >
            {project.title}
          </h3>
          
          {/* Технологии - УВЕЛИЧИВАЕМ */}
          <div className="flex flex-wrap gap-2 justify-center">
            {project.technologies.split(',').slice(0, 3).map((tech, index) => (
              <span
                key={index}
                className={`font-medium px-3 py-2 rounded-full ${
                  hovered ? 'bg-white/25 text-white' : 'bg-primary-500/25 text-primary-300'
                }`}
                style={{
                  fontSize: '14px',
                  transition: 'all 0.3s ease'
                }}
              >
                {tech.trim()}
              </span>
            ))}
          </div>
        </div>
      </Html>

      {/* Избранный проект - звездочка */}
      {project.featured && (
        <mesh position={[1.2, 1.5, 0.2]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#fbbf24"
            emissiveIntensity={0.5}
          />
          <Html
            position={[0, 0, 0.16]}
            center
            distanceFactor={15}
            style={{ pointerEvents: 'none' }}
          >
            <div 
              className="pointer-events-none select-none"
              style={{
                color: '#000',
                fontSize: '20px',
                fontWeight: 'bold',
                textShadow: '0 0 5px rgba(255, 187, 36, 0.8)'
              }}
            >
              ⭐
            </div>
          </Html>
        </mesh>
      )}

      {/* УБИРАЕМ детальную информацию справа */}

      {/* УБИРАЕМ ВСЕ эффекты свечения */}
    </group>
  );
};

// Основной компонент каталога с дискретной навигацией
export const ProjectCatalog3D = ({ projects = [], onProjectClick }) => {
  const groupRef = useRef();
  const [hoveredProject, setHoveredProject] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0); // Текущий выбранный проект
  const [targetPosition, setTargetPosition] = useState(0);

  // Расчет позиций для каталога
  const getCatalogPosition = (index, total) => {
    const spacing = 6;
    const centerOffset = currentIndex * spacing; // Смещение для центрирования текущего проекта
    
    const x = (index - currentIndex) * spacing;
    const y = index === currentIndex ? 0.5 : 0; // Поднимаем выбранный проект
    const z = Math.sin(index * 0.1) * 0.1;
    
    return [x, y, z];
  };

  // Обработчик дискретного скролла
  useEffect(() => {
    let scrollTimeout;
    
    const handleWheel = (event) => {
      event.preventDefault();
      
      // Дебаунс для предотвращения множественных срабатываний
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (event.deltaY > 0) {
          // Скролл вниз = следующий проект
          setCurrentIndex(prev => Math.min(prev + 1, projects.length - 1));
        } else {
          // Скролл вверх = предыдущий проект
          setCurrentIndex(prev => Math.max(prev - 1, 0));
        }
      }, 100);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      clearTimeout(scrollTimeout);
    };
  }, [projects.length]);

  // Плавная анимация к выбранному проекту
  useFrame((state) => {
    if (groupRef.current) {
      // Плавное движение к центрированию текущего проекта
      const targetX = -currentIndex * 6;
      groupRef.current.position.x = THREE.MathUtils.lerp(
        groupRef.current.position.x,
        targetX,
        0.1
      );
      
      // Мягкое вращение
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.05) * 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      {projects.map((project, index) => (
        <ProjectCatalogCard
          key={project.id}
          project={project}
          index={index}
          position={getCatalogPosition(index, projects.length)}
          totalProjects={projects.length}
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

export default ProjectCatalog3D;