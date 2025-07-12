// frontend/src/components/3d/ProjectCard3D.js - Исправленная версия
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Float, Text } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';

// Функция для определения яркости изображения
const getImageBrightness = (() => {
  const cache = new Map();
  
  return (imageUrl) => {
    if (cache.has(imageUrl)) {
      return Promise.resolve(cache.get(imageUrl));
    }
    
    return new Promise((resolve) => {
      if (!imageUrl || imageUrl.includes('placeholder')) {
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
      }, 800);
      
      img.onload = () => {
        clearTimeout(timeoutId);
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 50;
          canvas.height = 50;
          
          ctx.drawImage(img, 0, 0, 50, 50);
          
          const imageData = ctx.getImageData(0, 0, 50, 50);
          const data = imageData.data;
          
          let brightness = 0;
          for (let i = 0; i < data.length; i += 16) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            brightness += (r * 0.299 + g * 0.587 + b * 0.114);
          }
          
          brightness = brightness / (data.length / 16);
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

// Главный компонент карточки проекта в стиле unveil.fr
const ProjectCard3D = React.memo(({ 
  project, 
  position = [0, 0, 0], 
  index = 0,
  onClick,
  onHover,
  isActive = false,
  isSelected = false
}) => {
  const meshRef = useRef();
  const groupRef = useRef();
  const frameRef = useRef();
  const shadowRef = useRef();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [textColor, setTextColor] = useState('light');

  // Мемоизируем URL текстуры
  const textureUrl = useMemo(() => 
    project.imageUrl || '/api/placeholder/800/600'
  , [project.imageUrl]);

  // ✅ ИСПРАВЛЯЕМ ЗАГРУЗКУ ТЕКСТУРЫ - ДОБАВЛЯЕМ flipY = false
  const texture = useTexture(textureUrl, (texture) => {
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.flipY = true; // ✅ УБИРАЕМ ПЕРЕВОРОТ
  });

  // Определяем цвет текста на основе изображения
  useEffect(() => {
    if (project.imageUrl) {
      getImageBrightness(project.imageUrl).then(setTextColor);
    }
  }, [project.imageUrl]);

  // Плавная анимация в стиле unveil.fr
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.elapsedTime;
    const floatY = Math.sin(time * 0.4 + index * 0.6) * 0.03;
    const floatX = Math.cos(time * 0.3 + index * 0.4) * 0.02;
    
    // Основные позиции
    const targetY = position[1] + floatY;
    const targetX = position[0] + floatX;
    
    // Активное состояние
    if (isActive || isSelected) {
      const lift = isSelected ? 0.8 : 0.4;
      const scale = isSelected ? 1.15 : 1.08;
      
      groupRef.current.position.y += (targetY + lift - groupRef.current.position.y) * 0.08;
      groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.08;
      groupRef.current.scale.setScalar(
        groupRef.current.scale.x + (scale - groupRef.current.scale.x) * 0.08
      );
      
      // Легкое покачивание
      groupRef.current.rotation.z = Math.sin(time * 0.8) * 0.005;
      groupRef.current.rotation.x = Math.cos(time * 0.6) * 0.01;
      
    } else if (hovered) {
      groupRef.current.position.y += (targetY + 0.15 - groupRef.current.position.y) * 0.1;
      groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.1;
      groupRef.current.scale.setScalar(
        groupRef.current.scale.x + (1.05 - groupRef.current.scale.x) * 0.1
      );
      
    } else {
      // Обычное состояние
      groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.06;
      groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.06;
      groupRef.current.scale.setScalar(
        groupRef.current.scale.x + (1 - groupRef.current.scale.x) * 0.06
      );
      groupRef.current.rotation.z += (0 - groupRef.current.rotation.z) * 0.1;
      groupRef.current.rotation.x += (0 - groupRef.current.rotation.x) * 0.1;
    }

    // Обновление тени
    if (shadowRef.current) {
      const shadowOpacity = (isActive || isSelected) ? 0.25 : hovered ? 0.15 : 0.08;
      shadowRef.current.material.opacity += (shadowOpacity - shadowRef.current.material.opacity) * 0.1;
    }

    // Обновление рамки
    if (frameRef.current) {
      const frameColor = (isActive || isSelected) ? '#000000' : hovered ? '#18181b' : '#e4e4e7';
      frameRef.current.material.color.lerp(new THREE.Color(frameColor), 0.1);
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
    <Float speed={0.8} rotationIntensity={0.1} floatIntensity={0.05} enabled={!isActive && !isSelected}>
      <group ref={groupRef} position={position}>
        
        {/* Невидимая область для взаимодействия */}
        <mesh
          position={[0, 0, 0.1]}
          onClick={handleClick}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          visible={false}
        >
          <boxGeometry args={[4.5, 6, 0.8]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        {/* Тень карточки */}
        <mesh 
          ref={shadowRef}
          position={[0.05, -0.05, -0.15]} 
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[4.2, 5.8]} />
          <meshBasicMaterial
            color="#000000"
            transparent
            opacity={0.08}
          />
        </mesh>

        {/* Основная карточка */}
        <mesh ref={meshRef} position={[0, 0, 0]}>
          <boxGeometry args={[4, 5.6, 0.08]} />
          <meshStandardMaterial
            map={texture}
            transparent
            opacity={isActive || isSelected ? 1 : hovered ? 0.98 : 0.92}
            roughness={0.1}
            metalness={0.02}
          />
        </mesh>

        {/* Рамка карточки */}
        <mesh ref={frameRef} position={[0, 0, -0.05]}>
          <boxGeometry args={[4.15, 5.75, 0.04]} />
          <meshStandardMaterial
            color="#e4e4e7"
            transparent
            opacity={0.9}
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>

        {/* Подложка для глубины */}
        <mesh position={[0, 0, -0.1]}>
          <boxGeometry args={[4.3, 5.9, 0.02]} />
          <meshStandardMaterial
            color="#f8fafc"
            transparent
            opacity={0.6}
          />
        </mesh>

        {/* Статус избранного проекта */}
        {project.featured && (
          <mesh position={[1.7, 2.5, 0.15]}>
            <cylinderGeometry args={[0.12, 0.12, 0.05, 8]} />
            <meshStandardMaterial
              color="#0066ff"
              emissive="#0066ff"
              emissiveIntensity={0.3}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
        )}

        {/* Индикатор активности */}
        {(isActive || isSelected) && (
          <mesh position={[0, -3.2, 0.1]}>
            <boxGeometry args={[0.8, 0.03, 0.03]} />
            <meshStandardMaterial
              color="#0066ff"
              emissive="#0066ff"
              emissiveIntensity={0.5}
            />
          </mesh>
        )}

        {/* Текстовая информация (опционально) */}
        {(isActive || isSelected) && (
          <Text
            position={[0, -3.8, 0.2]}
            fontSize={0.2}
            color="#18181b"
            anchorX="center"
            anchorY="middle"
            font="/fonts/inter-medium.woff"
            maxWidth={3.5}
            textAlign="center"
          >
            {project.title}
          </Text>
        )}
      </group>
    </Float>
  );
});

// Компонент сетки проектов в стиле unveil.fr
export const ProjectGrid3D = ({ projects = [], onProjectClick }) => {
  const groupRef = useRef();
  const [hoveredProject, setHoveredProject] = useState(null);
  const [activeProject, setActiveProject] = useState(0);

  // Расположение в сетке
  const getGridPosition = (index) => {
    const cols = 4;
    const rows = Math.ceil(projects.length / cols);
    
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    const spacingX = 5.5;
    const spacingY = 6.5;
    
    const x = (col - (cols - 1) / 2) * spacingX;
    const y = ((rows - 1) / 2 - row) * spacingY;
    const z = Math.random() * 0.1 - 0.05;
    
    return [x, y, z];
  };

  // Плавная анимация группы
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime;
      groupRef.current.rotation.y = Math.sin(time * 0.1) * 0.01;
      groupRef.current.position.y = Math.sin(time * 0.2) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {projects.map((project, index) => (
        <ProjectCard3D
          key={project.id}
          project={project}
          position={getGridPosition(index)}
          index={index}
          isActive={index === activeProject}
          onClick={onProjectClick}
          onHover={(project, isHovered) => {
            setHoveredProject(isHovered ? project : null);
            if (isHovered) {
              setActiveProject(index);
            }
          }}
        />
      ))}
    </group>
  );
};

// Компонент карусели проектов в стиле unveil.fr
export const ProjectCarousel3D = ({ projects = [], currentIndex = 0, onProjectClick }) => {
  const groupRef = useRef();

  // Круговое расположение
  const getCarouselPosition = (index, total) => {
    const radius = 6;
    const angleStep = (Math.PI * 2) / Math.max(total, 1);
    const angle = index * angleStep;
    
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    const y = Math.sin(index * 0.3) * 0.2;
    
    return [x, y, z];
  };

  // Вращение к текущему проекту
  useFrame(() => {
    if (groupRef.current && projects.length > 0) {
      const targetRotation = (currentIndex * Math.PI * 2) / projects.length;
      groupRef.current.rotation.y += (targetRotation - groupRef.current.rotation.y) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {projects.map((project, index) => (
        <ProjectCard3D
          key={project.id}
          project={project}
          position={getCarouselPosition(index, projects.length)}
          index={index}
          isSelected={index === currentIndex}
          onClick={onProjectClick}
        />
      ))}
    </group>
  );
};

// Компонент спирального расположения в стиле unveil.fr
export const ProjectSpiral3D = ({ projects = [], activeIndex = 0, onProjectClick }) => {
  const groupRef = useRef();

  // Спиральное расположение
  const getSpiralPosition = (index, total) => {
    const baseRadius = 4;
    const heightStep = 1.2;
    const angleStep = (Math.PI * 1.5) / Math.max(total, 1);
    
    const angle = index * angleStep;
    const radius = baseRadius + (index * 0.2);
    const height = index * heightStep - (total * heightStep) / 2;
    
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = height;
    
    return [x, y, z];
  };

  // Автоматическое вращение для лучшего обзора
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime;
      
      // Медленное вращение
      groupRef.current.rotation.y = time * 0.1;
      
      // Фокус на активном проекте
      const targetY = -activeIndex * 1.2;
      groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.03;
    }
  });

  return (
    <group ref={groupRef}>
      {projects.map((project, index) => (
        <ProjectCard3D
          key={project.id}
          project={project}
          position={getSpiralPosition(index, projects.length)}
          index={index}
          isActive={index === activeIndex}
          onClick={onProjectClick}
        />
      ))}
    </group>
  );
};

// Основной экспорт
export default ProjectCard3D;