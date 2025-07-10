// frontend/src/components/3d/ProjectCard3D.js
import React, { useRef, useState, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Text, Html, useTexture, Float } from '@react-three/drei';
import { TextureLoader } from 'three';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';

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

  // Load project image texture with error handling
  const texture = useTexture(
    project.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjMwMCIgeT0iMjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIiBmb250LXNpemU9IjI0Ij5Qcm9qZWN0IEltYWdlPC90ZXh0Pgo8L3N2Zz4K',
    (texture) => {
      texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
    }
  );

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
    document.body.style.cursor = 'pointer';
  };

  const handlePointerLeave = (event) => {
    event.stopPropagation();
    setHovered(false);
    onHover && onHover(project, false);
    document.body.style.cursor = 'auto';
  };

  const handlePointerMove = (event) => {
    event.stopPropagation();
    // Принудительно поддерживаем hover состояние при движении мыши
    if (!hovered) {
      setHovered(true);
      onHover && onHover(project, true);
      document.body.style.cursor = 'pointer';
    }
  };

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.2}>
      <group ref={meshRef} position={position}>
        
        {/* ✅ БОЛЬШАЯ невидимая область для стабильного hover */}
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

        {/* Main card */}
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

        {/* Card border/frame */}
        <mesh position={[0, 0, -0.06]}>
          <boxGeometry args={[2.6, 1.9, 0.05]} />
          <meshStandardMaterial
            color={hovered ? "#0ea5e9" : "#374151"}
            transparent
            opacity={0.9}
            emissive={hovered ? "#0ea5e9" : "#000000"}
            emissiveIntensity={hovered ? 0.3 : 0}
          />
        </mesh>

        {/* ✅ Всегда видимый заголовок с лучшим качеством */}
        <Html
          position={[0, -1.2, 0.1]}
          center
          distanceFactor={4}
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
              background: 'rgba(17, 24, 39, 0.9)',
              backdropFilter: 'blur(8px)',
              borderRadius: '8px',
              padding: '8px 16px',
              border: hovered ? '1px solid rgba(14, 165, 233, 0.5)' : '1px solid rgba(55, 65, 81, 0.5)',
              transition: 'all 0.3s ease',
              transform: hovered ? 'scale(1.05)' : 'scale(1)',
              boxShadow: hovered ? '0 8px 32px rgba(14, 165, 233, 0.3)' : '0 4px 16px rgba(0, 0, 0, 0.3)'
            }}
          >
            <h3 
              className={`font-bold transition-all duration-300 whitespace-nowrap ${
                hovered ? 'text-blue-400 text-lg' : 'text-white text-base'
              }`}
              style={{
                textShadow: hovered ? '0 0 8px rgba(14, 165, 233, 0.5)' : 'none',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
            >
              {project.title}
            </h3>
          </div>
        </Html>

        {/* ✅ Технологии с лучшим качеством */}
        <Html
          position={[0, -1.6, 0.1]}
          center
          distanceFactor={6}
          transform={false}
          occlude={false}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div 
            className="text-center pointer-events-none select-none"
            style={{
              background: 'rgba(31, 41, 55, 0.8)',
              backdropFilter: 'blur(4px)',
              borderRadius: '6px',
              padding: '4px 12px',
              transition: 'all 0.3s ease',
              opacity: hovered ? 1 : 0.8
            }}
          >
            <p 
              className="text-gray-300 whitespace-nowrap"
              style={{
                fontSize: '12px',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
            >
              {project.technologies}
            </p>
          </div>
        </Html>

        {/* Featured badge */}
        {project.featured && (
          <mesh position={[1.1, 0.7, 0.15]}>
            <cylinderGeometry args={[0.15, 0.15, 0.05, 6]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#fbbf24"
              emissiveIntensity={0.4}
            />
            <Html
              position={[0, 0, 0.03]}
              center
              distanceFactor={10}
              style={{ pointerEvents: 'none' }}
            >
              <div 
                className="pointer-events-none select-none"
                style={{
                  color: '#000',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                ⭐
              </div>
            </Html>
          </mesh>
        )}

        {/* ✅ КАЧЕСТВЕННАЯ hover панель */}
        {hovered && (
          <Html
            position={[0, 0, 1.5]}
            center
            distanceFactor={3}
            transform={false}
            occlude={false}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="pointer-events-none select-none"
              style={{
                background: 'rgba(17, 24, 39, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(14, 165, 233, 0.5)',
                borderRadius: '16px',
                padding: '20px',
                maxWidth: '280px',
                boxShadow: '0 20px 60px rgba(14, 165, 233, 0.2), 0 8px 32px rgba(0, 0, 0, 0.3)',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
            >
              <h3 
                className="text-white font-bold text-center mb-3"
                style={{
                  fontSize: '18px',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
                }}
              >
                {project.title}
              </h3>
              
              <p 
                className="text-gray-300 text-center mb-4 leading-relaxed"
                style={{
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}
              >
                {project.description}
              </p>
              
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {project.technologies.split(',').slice(0, 3).map((tech, index) => (
                  <span
                    key={index}
                    className="text-primary-200 font-medium"
                    style={{
                      background: 'rgba(14, 165, 233, 0.3)',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      border: '1px solid rgba(14, 165, 233, 0.4)'
                    }}
                  >
                    {tech.trim()}
                  </span>
                ))}
              </div>
              
              <div className="text-center">
                <span 
                  className="text-primary-400 font-medium"
                  style={{
                    fontSize: '14px',
                    textShadow: '0 0 8px rgba(14, 165, 233, 0.5)'
                  }}
                >
                  ✨ Нажмите для просмотра
                </span>
              </div>
            </motion.div>
          </Html>
        )}

        {/* ✅ Усиленный glow эффект */}
        {hovered && (
          <>
            <mesh position={[0, 0, -0.3]} scale={[4, 3, 0.1]}>
              <planeGeometry />
              <meshBasicMaterial
                color="#0ea5e9"
                transparent
                opacity={0.2}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
            <mesh position={[0, 0, -0.35]} scale={[5, 4, 0.1]}>
              <planeGeometry />
              <meshBasicMaterial
                color="#0ea5e9"
                transparent
                opacity={0.1}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </>
        )}
      </group>
    </Float>
  );
};

// Остальной код остается тот же...
export const ProjectGrid3D = ({ projects = [], onProjectClick }) => {
  const groupRef = useRef();
  const [hoveredProject, setHoveredProject] = useState(null);

  const getGridPosition = (index) => {
    const cols = 3;
    const spacing = 4.5; // Еще больше расстояние
    
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