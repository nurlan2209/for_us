// frontend/src/components/3d/Scene.js
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float, Stars, Environment } from '@react-three/drei';
import { motion } from 'framer-motion-3d';
import * as THREE from 'three';

// Animated floating cube
const FloatingCube = ({ position, color, scale = 1 }) => {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={0.8}
          wireframe 
        />
      </mesh>
    </Float>
  );
};

// Animated sphere
const AnimatedSphere = ({ position, color }) => {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.1);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial 
        color={color} 
        transparent 
        opacity={0.6}
        roughness={0.1}
        metalness={0.8}
      />
    </mesh>
  );
};

// Particle system
const Particles = ({ count = 1000 }) => {
  const points = useRef();
  
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    
    return positions;
  }, [count]);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesPosition.length / 3}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#0ea5e9"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
};

// Main 3D Scene
const Scene3D = ({ 
  showParticles = true, 
  showElements = true, 
  enableControls = true,
  cameraPosition = [0, 0, 5],
  children 
}) => {
  return (
    <Canvas
      camera={{ 
        position: cameraPosition, 
        fov: 75,
        near: 0.1,
        far: 1000 
      }}
      style={{ background: 'transparent' }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
      <directionalLight
        position={[0, 10, 5]}
        intensity={0.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Environment */}
      <Environment preset="night" />
      
      {/* Stars */}
      <Stars 
        radius={300} 
        depth={60} 
        count={5000} 
        factor={7} 
        saturation={0} 
        fade 
      />

      {/* Particles */}
      {showParticles && <Particles />}

      {/* 3D Elements */}
      {showElements && (
        <>
          <FloatingCube position={[-2, 0, 0]} color="#0ea5e9" />
          <AnimatedSphere position={[2, 0, 0]} color="#8b5cf6" />
          <FloatingCube position={[0, 2, -2]} color="#10b981" scale={0.7} />
        </>
      )}

      {/* Custom children */}
      {children}

      {/* Controls */}
      {enableControls && (
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 1.8}
          minPolarAngle={Math.PI / 3}
        />
      )}
    </Canvas>
  );
};

// Simple hero scene for home page
export const HeroScene = () => (
  <Scene3D 
    showParticles={true} 
    showElements={true} 
    enableControls={true}
    cameraPosition={[0, 0, 5]}
  />
);

// Portfolio scene with grid layout
export const PortfolioScene = ({ projects = [] }) => (
  <Scene3D 
    showParticles={false} 
    showElements={false} 
    enableControls={true}
    cameraPosition={[0, 0, 8]}
  >
    {projects.map((project, index) => (
      <ProjectCard3D 
        key={project.id} 
        project={project} 
        position={getGridPosition(index)} 
      />
    ))}
  </Scene3D>
);

// Helper function to calculate grid positions
const getGridPosition = (index) => {
  const cols = 3;
  const spacing = 3;
  const x = (index % cols - 1) * spacing;
  const y = Math.floor(index / cols) * -spacing;
  return [x, y, 0];
};

// Project card 3D component (will be detailed in next file)
const ProjectCard3D = ({ project, position }) => {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime + position[0]) * 0.1;
    }
  });

  return (
    <Float speed={1} rotationIntensity={0.5} floatIntensity={0.2}>
      <mesh ref={meshRef} position={position}>
        <boxGeometry args={[2, 1.2, 0.1]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      
      {/* Project title */}
      <Text
        position={[position[0], position[1] - 0.8, position[2] + 0.1]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {project.title}
      </Text>
    </Float>
  );
};

export default Scene3D;