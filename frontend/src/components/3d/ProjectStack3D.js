// frontend/src/components/3d/ProjectStack3D.js - Диагональное расположение как на unveil.fr
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
    
    // Целевые позиции
    const targetX = position[0];
    const targetY = position[1] + Math.sin(time * 0.5 + index * 0.3) * 0.02;
    const targetZ = position[2];
    
    // Плавное движение к позиции
    groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.05;
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.05;
    groupRef.current.position.z += (targetZ - groupRef.current.position.z) * 0.05;
    
    // Ротация
    groupRef.current.rotation.x += (rotation[0] - groupRef.current.rotation.x) * 0.05;
    groupRef.current.rotation.y += (rotation[1] - groupRef.current.rotation.y) * 0.05;
    groupRef.current.rotation.z += (rotation[2] - groupRef.current.rotation.z) * 0.05;
    
    // Масштаб при hover
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
      
      {/* Тень карточки */}
      <mesh position={[0.1, -0.1, -0.01]}>
        <planeGeometry args={[4, 3]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={opacity * 0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Основная карточка - плоская плоскость */}
      <mesh
        onClick={handleClick}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <planeGeometry args={[4, 3]} />
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Граница карточки */}
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[4.05, 3.05]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={opacity * 0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Featured индикатор */}
      {project.featured && (
        <mesh position={[1.8, 1.3, 0.01]}>
          <circleGeometry args={[0.08, 8]} />
          <meshBasicMaterial
            color="#0066ff"
            transparent
            opacity={opacity}
          />
        </mesh>
      )}
    </group>
  );
});

// Основной компонент стека проектов - ДИАГОНАЛЬНОЕ РАСПОЛОЖЕНИЕ
export const ProjectStack3D = ({ projects = [], onProjectClick, currentFilter = 'ALL' }) => {
  const groupRef = useRef();
  const [hoveredProject, setHoveredProject] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const handleWheel = (event) => {
      event.preventDefault();
      
      // Предотвращаем слишком частые скроллы
      if (isScrolling) return;
      
      setIsScrolling(true);
      
      // Определяем направление скролла
      const direction = event.deltaY > 0 ? 1 : -1;
      
      setCurrentPage(prev => {
        const newPage = prev + direction;
        return Math.max(0, Math.min(newPage, projects.length - 1));
      });
      
      // Разблокируем скролл через 300ms
      setTimeout(() => {
        setIsScrolling(false);
      }, 300);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [projects.length, isScrolling]);

  // Анимация группы - фокус на текущей странице
  useFrame((state) => {
    if (groupRef.current) {
      // Смещение группы к текущей активной карточке
      const targetX = -currentPage * 1.8 * 1.2; // baseSpacing * diagonalFactor
      const targetY = -currentPage * 0.5;       // heightOffset
      
      groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.08;
      groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.08;
      
      // Легкое покачивание
      const time = state.clock.elapsedTime;
      groupRef.current.rotation.z = Math.sin(time * 0.2) * 0.005;
    }
  });

  // НОВАЯ ФУНКЦИЯ: Диагональное каскадное расположение как на unveil.fr
  const getDiagonalPosition = (index, total) => {
    // Параметры диагонального расположения
    const baseSpacing = 1.8;  // Базовое расстояние между карточками
    const diagonalFactor = 1.2; // Коэффициент диагонали
    const depthFactor = 0.8;    // Глубина по Z
    const heightOffset = 0.5;   // Смещение по высоте
    
    // Диагональное смещение - каждая следующая карточка правее и выше
    const x = index * baseSpacing * diagonalFactor;
    const y = index * heightOffset;
    const z = -index * depthFactor; // Каждая следующая карточка дальше
    
    return [x, y, z];
  };

  // Расчет ротации для каскадного эффекта
  const getDiagonalRotation = (index, total) => {
    // Легкий наклон для каскадного эффекта
    const rotationVariation = 0.05;
    const rotX = (Math.sin(index * 0.5) * rotationVariation);
    const rotY = (Math.cos(index * 0.3) * rotationVariation);
    const rotZ = (index % 2 === 0 ? 1 : -1) * rotationVariation * 0.5;
    
    return [rotX, rotY, rotZ];
  };

  // Расчет масштаба - ближние карточки больше
  const getDiagonalScale = (index, total) => {
    const baseScale = 1.0;
    const scaleReduction = 0.05; // Уменьшение для дальних карточек
    return Math.max(0.7, baseScale - (index * scaleReduction));
  };

  // Расчет прозрачности - дальние карточки прозрачнее
  const getDiagonalOpacity = (index, total) => {
    const baseOpacity = 1.0;
    const opacityReduction = 0.08;
    return Math.max(0.4, baseOpacity - (index * opacityReduction));
  };

  // Масштаб и прозрачность относительно текущей страницы
  const getRelativeScale = (index) => {
    const distance = Math.abs(index - currentPage);
    const baseScale = getDiagonalScale(index, projects.length);
    
    // Текущая карточка больше, остальные меньше
    if (index === currentPage) {
      return baseScale * 1.2;
    } else if (distance === 1) {
      return baseScale * 0.9;
    } else {
      return baseScale * 0.7;
    }
  };

  const getRelativeOpacity = (index) => {
    const distance = Math.abs(index - currentPage);
    const baseOpacity = getDiagonalOpacity(index, projects.length);
    
    // Текущая карточка ярче, остальные тусклее
    if (index === currentPage) {
      return 1.0;
    } else if (distance === 1) {
      return baseOpacity * 0.8;
    } else {
      return baseOpacity * 0.5;
    }
  };

  const handleProjectHover = (project, isHovered) => {
    setHoveredProject(isHovered ? project : null);
  };

  return (
    <group ref={groupRef}>
      {projects.map((project, index) => {
        const position = getDiagonalPosition(index, projects.length);
        const rotation = getDiagonalRotation(index, projects.length);
        const scale = getRelativeScale(index);
        const opacity = getRelativeOpacity(index);
        const isActive = hoveredProject?.id === project.id || index === currentPage;

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

      {/* Направленное освещение для лучшего отображения */}
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={0.3} 
        color="#ffffff"
      />
      <directionalLight 
        position={[-3, 3, 2]} 
        intensity={0.2} 
        color="#f1f5f9"
      />
      
      {/* Ambient свет для общего освещения */}
      <ambientLight intensity={0.4} />

      {/* Индикатор текущей страницы */}
      <group position={[0, -4, 0]}>
        <mesh>
          <planeGeometry args={[0.5, 0.05]} />
          <meshBasicMaterial color="#0066ff" />
        </mesh>
      </group>
    </group>
  );
};

export default ProjectStack3D;