// frontend/src/components/3d/ProjectCard3D.js
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Float } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';

// Функция для определения яркости цвета изображения
const getImageBrightness = (imageUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let brightness = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          brightness += (r * 0.299 + g * 0.587 + b * 0.114);
        }
        
        brightness = brightness / (data.length / 4);
        resolve(brightness > 128 ? 'dark' : 'light');
      } catch (error) {
        resolve('light');
      }
    };
    img.onerror = () => resolve('light');
    img.src = imageUrl;
  });
};

const ProjectCard3D = ({ 
  project, 
  position = [0, 0, 0], 
  onClick,
  isHovered,
  onHover 
}) => {
  const meshRef = useRef();
  const cardRef = useRef();
  const hoverAreaRef = useRef();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [textColor, setTextColor] = useState('light');

  // Load project image texture with error handling
  const texture = useTexture(
    project.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjMwMCIgeT0iMjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIiBmb250LXNpemU9IjI0Ij5Qcm9qZWN0IEltYWdlPC90ZXh0Pgo8L3N2Zz4K',
    (texture) => {
      texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
    }
  );

  // Определяем цвет текста на основе изображения
  useEffect(() => {
    if (project.imageUrl) {
      getImageBrightness(project.imageUrl).then(setTextColor);
    }
  }, [project.imageUrl]);

  // Animation frame
  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.1;
      
      // Hover rotation effect
      if (hovered) {
        meshRef.current.rotation.y = THREE.MathUtils.lerp(
          meshRef.current.rotation.y, 
          Math.sin(state.clock.elapsedTime * 2) * 0.1, 
          0.1
        );
        meshRef.current.scale.setScalar(
          THREE.MathUtils.lerp(meshRef.current.scale.x, 1.1, 0.1)
        );
      } else {
        meshRef.current.rotation.y = THREE.MathUtils.lerp(
          meshRef.current.rotation.y, 
          0, 
          0.1
        );
        meshRef.current.scale.setScalar(
          THREE.MathUtils.lerp(meshRef.current.scale.x, 1, 0.1)
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
    
    // Обновляем курсор через глобальную функцию
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

  const handlePointerMove = (event) => {
    event.stopPropagation();
    // Принудительно поддерживаем hover состояние при движении мыши
    if (!hovered) {
      setHovered(true);
      onHover && onHover(project, true);
      
      if (window.updateProjectCursor) {
        window.updateProjectCursor({
          show: true,
          title: project.title,
          textColor: textColor
        });
      }
      
      document.body.style.cursor = 'none';
    }
  };

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.2}>
      <group ref={meshRef} position={position}>
        
        {/* БОЛЬШАЯ невидимая область для стабильного hover */}
        <mesh
          ref={hoverAreaRef}
          position={[0, -0.3, 0]}
          onClick={handleClick}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onPointerMove={handlePointerMove}
          visible={false}
        >
          <boxGeometry args={[4.5, 3.5, 2]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        {/* Main card - БЕЗ ВСЕХ Html элементов */}
        <mesh ref={cardRef}>
          <boxGeometry args={[2.5, 1.8, 0.1]} />
          <meshStandardMaterial
            map={texture}
            transparent
            opacity={hovered ? 0.95 : 0.85}
            roughness={0.1}
            metalness={0.2}
          />
        </mesh>

        {/* Featured badge - ТОЛЬКО 3D геометрия, БЕЗ Html */}
        {project.featured && (
          <mesh position={[1.1, 0.7, 0.15]}>
            <cylinderGeometry args={[0.15, 0.15, 0.05, 6]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#fbbf24"
              emissiveIntensity={0.4}
            />
          </mesh>
        )}
      </group>
    </Float>
  );
};

export const ProjectGrid3D = ({ projects = [], onProjectClick }) => {
  const groupRef = useRef();
  const [hoveredProject, setHoveredProject] = useState(null);

  const getGridPosition = (index) => {
    const cols = 3;
    const spacing = 4.5;
    
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    const x = (col - (cols - 1) / 2) * spacing;
    const y = ((Math.ceil(projects.length / cols) - 1) / 2 - row) * spacing * 0.9;
    const z = Math.random() * 0.2 - 0.1;
    
    return [x, y, z];
  };

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      {projects.map((project, index) => (
        <ProjectCard3D
          key={project.id}
          project={project}
          position={getGridPosition(index)}
          onClick={onProjectClick}
          isHovered={hoveredProject?.id === project.id}
          onHover={(project, isHovered) => {
            setHoveredProject(isHovered ? project : null);
          }}
        />
      ))}
    </group>
  );
};

export const ProjectCarousel3D = ({ projects = [], currentIndex = 0 }) => {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      const targetRotation = (currentIndex * Math.PI * 2) / projects.length;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        -targetRotation,
        0.05
      );
    }
  });

  const radius = 4;

  return (
    <group ref={groupRef}>
      {projects.map((project, index) => {
        const angle = (index * Math.PI * 2) / projects.length;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        
        return (
          <ProjectCard3D
            key={project.id}
            project={project}
            position={[x, 0, z]}
          />
        );
      })}
    </group>
  );
};

export default ProjectCard3D;