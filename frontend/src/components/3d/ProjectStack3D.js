// frontend/src/components/3d/ProjectStack3D.js - Простая 3D карусель
import React, { useRef, useState, useEffect } from 'react';
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

  // URL текстуры
  const textureUrl = project.imageUrl || `data:image/svg+xml;base64,${btoa(`
    <svg width="400" height="300" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#f8fafc"/>
      <circle cx="200" cy="150" r="50" fill="#cbd5e1"/>
      <text x="200" y="250" text-anchor="middle" fill="#64748b" font-family="system-ui" font-size="16" font-weight="500">${project.title}</text>
    </svg>
  `)}`;

  // Загружаем текстуру
  const texture = useTexture(textureUrl, (texture) => {
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.flipY = true;
  });

  // Плавная анимация к позиции + поворот к камере
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Плавное движение к целевой позиции
    groupRef.current.position.x += (position[0] - groupRef.current.position.x) * 0.1;
    groupRef.current.position.y += (position[1] + Math.sin(time + index) * 0.05 - groupRef.current.position.y) * 0.1;
    groupRef.current.position.z += (position[2] - groupRef.current.position.z) * 0.1;
    
    // КАРТОЧКА ВСЕГДА СМОТРИТ НА КАМЕРУ
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
    
    document.body.style.cursor = 'none';
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
      {/* Простая карточка - только изображение */}
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

      {/* Featured индикатор */}
      {project.featured && (
        <mesh position={[1.3, 1.0, 0.01]}>
          <circleGeometry args={[0.06, 8]} />
          <meshBasicMaterial color="#0066ff" />
        </mesh>
      )}
    </group>
  );
});

// 3D Карусель проектов
export const ProjectStack3D = ({ projects = [], onProjectClick }) => {
  const groupRef = useRef();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [hoveredProject, setHoveredProject] = useState(null);

  // Автоматическое вращение карусели
  useFrame((state) => {
    if (groupRef.current) {
      // Целевой угол поворота
      const targetRotation = (currentIndex * Math.PI * 2) / projects.length;
      
      // Плавный поворот к целевому углу
      const currentRotation = groupRef.current.rotation.y;
      let rotationDiff = targetRotation - currentRotation;
      
      // Обработка перехода через 0/2π
      if (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
      if (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
      
      groupRef.current.rotation.y += rotationDiff * 0.08;
      
      // Легкое покачивание
      const time = state.clock.elapsedTime;
      groupRef.current.position.y = Math.sin(time * 0.5) * 0.1;
    }
  });

  // Управление с клавиатуры
  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          setCurrentIndex(prev => (prev - 1 + projects.length) % projects.length);
          break;
        case 'ArrowRight':
          event.preventDefault();
          setCurrentIndex(prev => (prev + 1) % projects.length);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [projects.length]);

  // Управление скроллом
  useEffect(() => {
    const handleWheel = (event) => {
      event.preventDefault();
      
      if (event.deltaY > 0) {
        setCurrentIndex(prev => (prev + 1) % projects.length);
      } else {
        setCurrentIndex(prev => (prev - 1 + projects.length) % projects.length);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [projects.length]);

  // Расчет позиций карточек в круге (без ротации)
  const getCarouselPosition = (index) => {
    const radius = 4; // Радиус карусели
    const angle = (index * Math.PI * 2) / projects.length;
    
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    const y = 0;
    
    return [x, y, z];
  };

  const handleProjectHover = (project, isHovered) => {
    setHoveredProject(isHovered ? project : null);
  };

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

      {/* Освещение */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[0, 5, 5]} intensity={0.4} />

      {/* Навигационные точки */}
      <group position={[0, -3, 0]}>
        {projects.map((_, index) => (
          <mesh
            key={index}
            position={[(index - projects.length / 2) * 0.3, 0, 0]}
            onClick={() => setCurrentIndex(index)}
          >
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial 
              color={index === currentIndex ? "#0066ff" : "#d4d4d8"}
            />
          </mesh>
        ))}
      </group>
    </>
  );
};

export default ProjectStack3D;