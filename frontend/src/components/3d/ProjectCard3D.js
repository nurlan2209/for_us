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
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  // Load project image texture
  const texture = useTexture(
    project.imageUrl || '/placeholder-project.jpg',
    (texture) => {
      texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearFilter;
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

  const handlePointerEnter = () => {
    setHovered(true);
    onHover && onHover(project, true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerLeave = () => {
    setHovered(false);
    onHover && onHover(project, false);
    document.body.style.cursor = 'auto';
  };

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.2}>
      <group ref={meshRef} position={position}>
        {/* Main card */}
        <mesh
          ref={cardRef}
          onClick={handleClick}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
        >
          <boxGeometry args={[2.5, 1.8, 0.1]} />
          <meshStandardMaterial
            map={texture}
            transparent
            opacity={hovered ? 0.9 : 0.8}
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
            opacity={0.8}
            emissive={hovered ? "#0ea5e9" : "#000000"}
            emissiveIntensity={hovered ? 0.2 : 0}
          />
        </mesh>

        {/* Project title */}
        <Text
          position={[0, -1.2, 0.1]}
          fontSize={0.15}
          color={hovered ? "#0ea5e9" : "#ffffff"}
          anchorX="center"
          anchorY="middle"
          maxWidth={2.4}
          font="/fonts/Inter-Bold.woff"
        >
          {project.title}
        </Text>

        {/* Technologies tags */}
        <Text
          position={[0, -1.5, 0.1]}
          fontSize={0.08}
          color="#9ca3af"
          anchorX="center"
          anchorY="middle"
          maxWidth={2.4}
        >
          {project.technologies}
        </Text>

        {/* Featured badge */}
        {project.featured && (
          <mesh position={[1.1, 0.7, 0.15]}>
            <cylinderGeometry args={[0.15, 0.15, 0.05, 6]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#fbbf24"
              emissiveIntensity={0.3}
            />
            <Text
              position={[0, 0, 0.03]}
              fontSize={0.06}
              color="#000000"
              anchorX="center"
              anchorY="middle"
              rotation={[0, 0, 0]}
            >
              ★
            </Text>
          </mesh>
        )}

        {/* Hover info panel */}
        {hovered && (
          <Html
            position={[0, 0, 1]}
            center
            distanceFactor={8}
            transform
            occlude
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-gray-900/95 backdrop-blur-sm border border-primary-500/50 rounded-lg p-4 max-w-xs pointer-events-none"
            >
              <h3 className="text-white font-bold text-sm mb-2">
                {project.title}
              </h3>
              <p className="text-gray-300 text-xs mb-3 line-clamp-3">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-1">
                {project.technologies.split(',').slice(0, 3).map((tech, index) => (
                  <span
                    key={index}
                    className="bg-primary-500/20 text-primary-300 px-2 py-1 rounded text-xs"
                  >
                    {tech.trim()}
                  </span>
                ))}
              </div>
              <div className="mt-3 text-xs text-primary-400">
                Нажмите для просмотра →
              </div>
            </motion.div>
          </Html>
        )}

        {/* Subtle glow effect */}
        {hovered && (
          <mesh position={[0, 0, -0.2]} scale={[3, 2.2, 0.1]}>
            <planeGeometry />
            <meshBasicMaterial
              color="#0ea5e9"
              transparent
              opacity={0.1}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        )}
      </group>
    </Float>
  );
};

// Grid layout component for multiple project cards
export const ProjectGrid3D = ({ projects = [], onProjectClick }) => {
  const groupRef = useRef();
  const [hoveredProject, setHoveredProject] = useState(null);

  // Calculate grid positions
  const getGridPosition = (index) => {
    const cols = 3;
    const rows = Math.ceil(projects.length / cols);
    const spacing = 3.5;
    
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    const x = (col - (cols - 1) / 2) * spacing;
    const y = ((rows - 1) / 2 - row) * spacing * 0.8;
    const z = Math.random() * 0.5 - 0.25; // Slight random depth
    
    return [x, y, z];
  };

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle group rotation
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
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

// Carousel layout for featured projects
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