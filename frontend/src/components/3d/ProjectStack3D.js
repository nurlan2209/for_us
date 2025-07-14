// frontend/src/components/3d/ProjectStack3D.js - Стек проектов как на unveil.fr
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';

const ProjectStackCard = React.memo(({ 
  project, 
  position = [0, 0, 0], 
  rotation = [0, 0, 0],
  scale = 1,
  opacity = 1,
  index = 0,
  isActive = false,
  onClick,
  onHover
}) => {
  const meshRef = useRef();
  const groupRef = useRef();
  const navigate = useNavigate();

  // URL текстуры
  const textureUrl = project.imageUrl || `data:image/svg+xml;base64,${btoa(`
    <svg width="800" height="600" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="600" fill="#f8fafc"/>
      <rect x="50" y="50" width="700" height="500" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
      <circle cx="400" cy="300" r="80" fill="#cbd5e1"/>
      <text x="400" y="420" text-anchor="middle" fill="#64748b" font-family="system-ui" font-size="32" font-weight="500">${project.title}</text>
    </svg>
  `)}`;

  // Загружаем текстуру
  const texture = useTexture(textureUrl, (texture) => {
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.flipY = true;
  });

  // Анимация при взаимодействии
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Базовая анимация позиции
    groupRef.current.position.x = position[0];
    groupRef.current.position.y = position[1] + Math.sin(time * 0.5 + index * 0.3) * 0.02;
    groupRef.current.position.z = position[2];
    
    // Базовая ротация
    groupRef.current.rotation.x = rotation[0] + Math.sin(time * 0.3 + index * 0.2) * 0.01;
    groupRef.current.rotation.y = rotation[1];
    groupRef.current.rotation.z = rotation[2];
    
    // Масштаб
    const targetScale = isActive ? scale * 1.1 : scale;
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
    <group ref={groupRef}>
      
      {/* Стеклянная рамка */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[4.2, 3.2]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={opacity * 0.1}
          transmission={0.9}
          thickness={0.1}
          roughness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.1}
          ior={1.5}
          reflectivity={0.1}
        />
      </mesh>

      {/* Основное изображение проекта */}
      <mesh
        onClick={handleClick}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <planeGeometry args={[4, 3]} />
        <meshPhysicalMaterial
          map={texture}
          transparent
          opacity={opacity * 0.95}
          transmission={0.05}
          thickness={0.01}
          roughness={0.1}
          clearcoat={0.5}
          clearcoatRoughness={0.1}
          ior={1.4}
          reflectivity={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Тонкая граница */}
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[4.05, 3.05]} />
        <meshBasicMaterial
          color="#e2e8f0"
          transparent
          opacity={opacity * 0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Отражение/тень на поверхности */}
      <mesh position={[0.05, -0.05, -0.05]} rotation={[0, 0, 0]}>
        <planeGeometry args={[4, 3]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={opacity * 0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
});

// Основной компонент стека проектов
export const ProjectStack3D = ({ projects = [], onProjectClick, currentFilter = 'ALL' }) => {
  const groupRef = useRef();
  const [hoveredProject, setHoveredProject] = useState(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Обработка скролла для навигации по проектам
  useEffect(() => {
    const handleWheel = (event) => {
      event.preventDefault();
      
      const scrollSpeed = 0.5;
      const maxOffset = Math.max(0, projects.length - 1) * scrollSpeed;
      
      setScrollOffset(prev => {
        const newOffset = prev + (event.deltaY > 0 ? scrollSpeed : -scrollSpeed);
        return Math.max(0, Math.min(newOffset, maxOffset));
      });
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [projects.length]);

  // Анимация позиций при скролле и hover
  useFrame((state) => {
    if (groupRef.current) {
      // Плавное движение при скролле
      const targetX = -scrollOffset;
      groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.1;
      
      // Движение влево при hover
      if (hoveredProject) {
        groupRef.current.position.x += (targetX - 1 - groupRef.current.position.x) * 0.15;
      }
    }
  });

  // Расчет позиции каждой карточки в стеке
  const getStackPosition = (index, total) => {
    // Начинаем с правого верхнего угла и идем к левому нижнему
    const progress = index / Math.max(total - 1, 1);
    
    // Параметры раскладки - горизонтальная линия со смещением
    const baseX = index * 1.2; // Горизонтальное расстояние между карточками
    const startY = 2;  // Верх
    const endY = -1;   // Низ
    const startZ = 1;  // Ближе к камере
    const endZ = -2;   // Дальше от камеры
    
    // Интерполяция позиций
    const x = baseX;
    const y = startY + (endY - startY) * progress;
    const z = startZ + (endZ - startZ) * progress;
    
    return [x, y, z];
  };

  // Расчет ротации для каждой карточки
  const getStackRotation = (index, total) => {
    const progress = index / Math.max(total - 1, 1);
    
    // Небольшой наклон для эффекта стека
    const rotX = -0.1 + progress * 0.2;
    const rotY = 0.1 - progress * 0.2;
    const rotZ = 0.05 - progress * 0.1;
    
    return [rotX, rotY, rotZ];
  };

  // Расчет прозрачности
  const getStackOpacity = (index, total) => {
    const progress = index / Math.max(total - 1, 1);
    return 0.4 + (1 - progress) * 0.6; // От 0.4 до 1.0
  };

  // Расчет масштаба
  const getStackScale = (index, total) => {
    const progress = index / Math.max(total - 1, 1);
    return 0.7 + (1 - progress) * 0.3; // От 0.7 до 1.0
  };

  const handleProjectHover = (project, isHovered) => {
    setHoveredProject(isHovered ? project : null);
  };

  return (
    <group ref={groupRef}>
      {projects.map((project, index) => {
        const position = getStackPosition(index, projects.length);
        const rotation = getStackRotation(index, projects.length);
        const opacity = getStackOpacity(index, projects.length);
        const scale = getStackScale(index, projects.length);
        const isActive = hoveredProject?.id === project.id;

        return (
          <ProjectStackCard
            key={project.id}
            project={project}
            position={position}
            rotation={rotation}
            scale={scale}
            opacity={opacity}
            index={index}
            isActive={isActive}
            onClick={onProjectClick}
            onHover={handleProjectHover}
          />
        );
      })}

      {/* Дополнительные эффекты освещения для стеклянного эффекта */}
      <pointLight position={[5, 5, 5]} intensity={0.3} color="#ffffff" />
      <pointLight position={[-5, -5, 5]} intensity={0.2} color="#f1f5f9" />
      
      {/* Направленный свет для отражений */}
      <directionalLight 
        position={[2, 4, 3]} 
        intensity={0.4} 
        color="#ffffff"
        castShadow={false}
      />
    </group>
  );
};

export default ProjectStack3D;