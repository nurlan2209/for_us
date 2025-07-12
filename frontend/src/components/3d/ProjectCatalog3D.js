// frontend/src/components/3d/ProjectCatalog3D.js - Исправленная версия
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';

// Минимальный компонент карточки - ТОЛЬКО изображение
const ProjectCatalogCard = React.memo(({ 
  project, 
  position = [0, 0, 0], 
  index = 0,
  onClick,
  onHover,
  hoveredProject = null
}) => {
  const meshRef = useRef();
  const groupRef = useRef();
  const navigate = useNavigate();
  
  // Проверяем, наведен ли именно этот проект
  const isHovered = hoveredProject?.id === project.id;

  // URL текстуры
  const textureUrl = useMemo(() => {
    return project.imageUrl || `data:image/svg+xml;base64,${btoa(`
      <svg width="400" height="560" viewBox="0 0 400 560" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="560" fill="#f1f5f9"/>
        <circle cx="200" cy="280" r="60" fill="#cbd5e1"/>
        <text x="200" y="350" text-anchor="middle" fill="#64748b" font-family="system-ui" font-size="16" font-weight="500">${project.title}</text>
      </svg>
    `)}`;
  }, [project.imageUrl, project.title]);

  // Загружаем текстуру с правильными настройками
  const texture = useTexture(textureUrl, (texture) => {
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.flipY = true; // ✅ УБИРАЕМ ПЕРЕВОРОТ
  });

  // Простая анимация - только подъем при hover
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.elapsedTime;
    const floatY = Math.sin(time * 0.5 + index * 0.8) * 0.03;
    
    const targetY = position[1] + floatY + (isHovered ? 0.8 : 0);
    const targetScale = isHovered ? 1.08 : 1.0;
    
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.1;
    groupRef.current.scale.setScalar(
      groupRef.current.scale.x + (targetScale - groupRef.current.scale.x) * 0.1
    );
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
    <group ref={groupRef} position={position}>
      
      {/* Невидимая область для клика */}
      <mesh
        position={[0, 0, 0.1]}
        onClick={handleClick}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        visible={false}
      >
        <planeGeometry args={[4.2, 5.8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* ТОЛЬКО изображение - плоская плоскость БЕЗ ПЕРЕВОРОТА */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <planeGeometry args={[4, 5.6]} />
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Маленький индикатор для избранных - только при необходимости */}
      {project.featured && (
        <mesh position={[1.8, 2.6, 0.05]}>
          <circleGeometry args={[0.1, 8]} />
          <meshBasicMaterial
            color="#0066ff"
            transparent
            opacity={0.8}
          />
        </mesh>
      )}
    </group>
  );
});

// Основной компонент каталога
export const ProjectCatalog3D = ({ projects = [], onProjectClick }) => {
  const groupRef = useRef();
  const [hoveredProject, setHoveredProject] = useState(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Расположение проектов
  const getProjectPosition = (index) => {
    const spacing = 5.0;
    const x = (index * spacing) - scrollOffset;
    const y = 0;
    const z = Math.sin(index * 0.1) * 0.05;
    
    return [x, y, z];
  };

  // Обработчик скролла
  useEffect(() => {
    let isScrolling = false;
    
    const handleWheel = (event) => {
      event.preventDefault();
      
      if (isScrolling) return;
      isScrolling = true;
      
      const scrollSpeed = 5.0;
      
      setTimeout(() => {
        setScrollOffset(prev => {
          const newOffset = prev + (event.deltaY > 0 ? scrollSpeed : -scrollSpeed);
          const maxOffset = Math.max(0, (projects.length - 1) * scrollSpeed);
          return Math.max(0, Math.min(newOffset, maxOffset));
        });
        isScrolling = false;
      }, 50);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [projects.length]);

  // Анимация группы
  useFrame(() => {
    if (groupRef.current) {
      const targetX = -scrollOffset;
      groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.1;
    }
  });

  const handleProjectHover = (project, isHovered) => {
    setHoveredProject(isHovered ? project : null);
  };

  return (
    <group ref={groupRef}>
      {projects.map((project, index) => (
        <ProjectCatalogCard
          key={project.id}
          project={project}
          index={index}
          position={getProjectPosition(index)}
          onClick={onProjectClick}
          onHover={handleProjectHover}
          hoveredProject={hoveredProject}
        />
      ))}
    </group>
  );
};

export default ProjectCatalog3D;