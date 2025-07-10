// frontend/src/components/3d/ProjectCatalog3D.js
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';

// Мемоизированная функция для определения яркости
const getImageBrightness = (() => {
  const cache = new Map();
  
  return (imageUrl) => {
    if (cache.has(imageUrl)) {
      return Promise.resolve(cache.get(imageUrl));
    }
    
    return new Promise((resolve) => {
      if (!imageUrl || imageUrl.includes('data:image/svg')) {
        const result = 'light';
        cache.set(imageUrl, result);
        resolve(result);
        return;
      }
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const timeoutId = setTimeout(() => {
        const result = 'light';
        cache.set(imageUrl, result);
        resolve(result);
      }, 1000); // Таймаут 1 секунда
      
      img.onload = () => {
        clearTimeout(timeoutId);
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 100; // Уменьшаем размер для быстрого анализа
          canvas.height = 100;
          
          ctx.drawImage(img, 0, 0, 100, 100);
          
          const imageData = ctx.getImageData(0, 0, 100, 100);
          const data = imageData.data;
          
          let brightness = 0;
          const sampleStep = 4; // Анализируем каждый 4-й пиксель
          
          for (let i = 0; i < data.length; i += 4 * sampleStep) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            brightness += (r * 0.299 + g * 0.587 + b * 0.114);
          }
          
          brightness = brightness / (data.length / (4 * sampleStep));
          const result = brightness > 128 ? 'dark' : 'light';
          cache.set(imageUrl, result);
          resolve(result);
        } catch (error) {
          const result = 'light';
          cache.set(imageUrl, result);
          resolve(result);
        }
      };
      
      img.onerror = () => {
        clearTimeout(timeoutId);
        const result = 'light';
        cache.set(imageUrl, result);
        resolve(result);
      };
      
      img.src = imageUrl;
    });
  };
})();

// Мемоизированный компонент карточки
const ProjectCatalogCard = React.memo(({ 
  project, 
  position = [0, 0, 0], 
  index = 0,
  onClick,
  onHover,
  isSelected = false
}) => {
  const meshRef = useRef();
  const groupRef = useRef();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [textColor, setTextColor] = useState('light');

  // Мемоизируем URL текстуры
  const textureUrl = useMemo(() => 
    project.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjMwMCIgeT0iMjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIiBmb250LXNpemU9IjI0Ij5Qcm9qZWN0IEltYWdlPC90ZXh0Pgo8L3N2Zz4K'
  , [project.imageUrl]);

  // Загружаем текстуру проекта
  const texture = useTexture(textureUrl, (texture) => {
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
  });

  // Определяем цвет текста на основе изображения - только один раз
  useEffect(() => {
    if (project.imageUrl) {
      getImageBrightness(project.imageUrl).then(setTextColor);
    }
  }, [project.imageUrl]);

  // Оптимизированная анимация - только базовые движения
  useFrame((state) => {
    if (!groupRef.current) return;
    
    // Базовое плавание - менее частое обновление
    const time = state.clock.elapsedTime;
    const floatY = Math.sin(time * 0.5 + index * 0.5) * 0.05;
    
    if (hovered || isSelected) {
      // При наведении - плавные изменения
      const targetY = position[1] + floatY + (isSelected ? 1.5 : 1.0);
      const targetScale = isSelected ? 1.15 : 1.1;
      
      groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.05;
      groupRef.current.scale.setScalar(
        groupRef.current.scale.x + (targetScale - groupRef.current.scale.x) * 0.05
      );
    } else {
      // Возврат в исходное положение
      const targetY = position[1] + floatY;
      groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.05;
      groupRef.current.scale.setScalar(
        groupRef.current.scale.x + (1 - groupRef.current.scale.x) * 0.05
      );
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
    
    // Обновляем курсор
    if (window.updateProjectCursor) {
      window.updateProjectCursor({
        show: true,
        title: project.title,
        textColor: textColor
      });
    }
    
    document.body.style.cursor = 'none';
  };

  const handlePointerLeave = (event) => {
    event.stopPropagation();
    setHovered(false);
    onHover && onHover(project, false);
    
    // Скрываем курсор
    if (window.updateProjectCursor) {
      window.updateProjectCursor({ show: false });
    }
    
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
        <boxGeometry args={[4.5, 5.5, 0.5]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Основная карточка проекта */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <boxGeometry args={[4, 5, 0.1]} />
        <meshStandardMaterial
          map={texture}
          transparent
          opacity={hovered ? 1 : 0.9}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* Избранный проект - простая геометрия */}
      {project.featured && (
        <mesh position={[1.5, 2, 0.1]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#fbbf24"
            emissiveIntensity={0.3}
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
  const [currentIndex, setCurrentIndex] = useState(0);

  // Мемоизируем позиции
  const positions = useMemo(() => {
    const spacing = 5.5;
    return projects.map((_, index) => [
      (index - currentIndex) * spacing,
      index === currentIndex ? 0.3 : 0,
      Math.sin(index * 0.1) * 0.1
    ]);
  }, [projects.length, currentIndex]);

  // Оптимизированный обработчик скролла
  useEffect(() => {
    let scrollTimeout;
    let isScrolling = false;
    
    const handleWheel = (event) => {
      event.preventDefault();
      
      if (isScrolling) return;
      
      clearTimeout(scrollTimeout);
      isScrolling = true;
      
      scrollTimeout = setTimeout(() => {
        if (event.deltaY > 0) {
          setCurrentIndex(prev => Math.min(prev + 1, projects.length - 1));
        } else {
          setCurrentIndex(prev => Math.max(prev - 1, 0));
        }
        isScrolling = false;
      }, 150);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      clearTimeout(scrollTimeout);
    };
  }, [projects.length]);

  // Плавная анимация группы - менее частые обновления
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const targetX = -currentIndex * 5.5;
    groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.05;
  });

  return (
    <group ref={groupRef}>
      {projects.map((project, index) => (
        <ProjectCatalogCard
          key={project.id}
          project={project}
          index={index}
          position={positions[index]}
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