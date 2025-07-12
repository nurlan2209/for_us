// frontend/src/pages/ProjectDetail.js
import React, { useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, Center, Html } from '@react-three/drei';
import { projectsAPI } from '../utils/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Минималистичный 3D компонент
const Project3DShowcase = ({ project }) => {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} />
      <pointLight position={[-10, -10, -5]} intensity={0.3} color="#f1f5f9" />

      <Float speed={1} rotationIntensity={0.1} floatIntensity={0.2}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.5, 1.8, 0.1]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.1}
            metalness={0.1}
            transparent
            opacity={0.9}
          />
        </mesh>
      </Float>

      <OrbitControls 
        enableZoom={false} 
        autoRotate 
        autoRotateSpeed={0.5}
        enablePan={false}
        maxPolarAngle={Math.PI / 1.8}
        minPolarAngle={Math.PI / 3}
      />
    </Canvas>
  );
};

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch project data
  const { 
    data: project, 
    isLoading, 
    error 
  } = useQuery(
    ['project', id],
    () => projectsAPI.getById(id),
    {
      select: (response) => response.data.project,
      enabled: !!id,
    }
  );

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-white flex items-center justify-center"
      >
        <LoadingSpinner text="Loading project..." />
      </motion.div>
    );
  }
  
  if (error || !project) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-white flex items-center justify-center pt-16"
      >
        <div className="text-center px-6">
          <h2 className="text-3xl font-light text-neutral-900 mb-4">
            Project Not Found
          </h2>
          <p className="text-neutral-600 mb-8">
            The requested project doesn't exist or has been removed.
          </p>
          <Link
            to="/"
            className="catalog-button-unveil catalog-button-primary"
          >
            Back to Projects
          </Link>
        </div>
      </motion.div>
    );
  }

  const technologies = project.technologies.split(',').map(tech => tech.trim());

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-white"
    >
      
      {/* Hero Section with 3D */}
      <section className="relative pt-24 pb-16 px-6 lg:px-8 overflow-hidden">
        
        {/* 3D Background */}
        <div className="absolute inset-0 z-0">
          <Project3DShowcase project={project} />
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 to-white/95 z-10" />
        
        {/* Navigation */}
        <div className="absolute top-6 left-6 z-20">
          <button
            onClick={() => navigate(-1)}
            className="bg-white/90 backdrop-blur-sm border border-neutral-200 text-neutral-900 p-3 rounded-lg hover:bg-white transition-all duration-200 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Featured Badge */}
        {project.featured && (
          <div className="absolute top-6 right-6 z-20">
            <div className="bg-neutral-900 text-white px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase">
              Featured
            </div>
          </div>
        )}

        {/* Content */}
        <div className="relative z-20 max-w-4xl mx-auto text-center pt-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-5xl lg:text-7xl font-light text-neutral-900 tracking-tight mb-6">
              {project.title}
            </h1>
            
            <p className="text-xl lg:text-2xl text-neutral-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              {project.description}
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {project.projectUrl && (
                <a
                  href={project.projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="catalog-button-unveil catalog-button-primary text-lg px-8 py-4"
                >
                  View Project
                </a>
              )}
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="catalog-button-unveil text-lg px-8 py-4"
                >
                  View Code
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Project Image */}
      {project.imageUrl && (
        <section className="py-16 px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative rounded-2xl overflow-hidden shadow-card border border-neutral-200"
            >
              <img
                src={project.imageUrl}
                alt={project.title}
                className="w-full h-auto"
              />
            </motion.div>
          </div>
        </section>
      )}

      {/* Project Details */}
      <section className="py-16 px-6 lg:px-8 bg-neutral-50">
        <div className="max-w-4xl mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              
              {/* Technologies */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2 className="text-2xl font-light text-neutral-900 tracking-tight mb-6">
                  Technologies
                </h2>
                <div className="flex flex-wrap gap-3">
                  {technologies.map((tech, index) => (
                    <span
                      key={index}
                      className="tech-tag-unveil"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* About */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <h2 className="text-2xl font-light text-neutral-900 tracking-tight mb-6">
                  About This Project
                </h2>
                <div className="prose prose-neutral max-w-none">
                  <p className="text-lg text-neutral-600 leading-relaxed">
                    {project.description}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              
              {/* Project Stats */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-xl border border-neutral-200"
              >
                <h3 className="text-lg font-light text-neutral-900 mb-6">
                  Project Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-neutral-500 uppercase tracking-wide mb-1">
                      Status
                    </div>
                    <div className="text-neutral-900 font-medium">
                      {project.status === 'published' ? 'Completed' : 'In Progress'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-neutral-500 uppercase tracking-wide mb-1">
                      Technologies
                    </div>
                    <div className="text-neutral-900 font-medium">
                      {technologies.length} technologies
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-neutral-500 uppercase tracking-wide mb-1">
                      Year
                    </div>
                    <div className="text-neutral-900 font-medium">
                      {new Date(project.createdAt).getFullYear()}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-neutral-500 uppercase tracking-wide mb-1">
                      Created
                    </div>
                    <div className="text-neutral-900 font-medium">
                      {new Date(project.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Links */}
              {(project.projectUrl || project.githubUrl) && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="bg-white p-6 rounded-xl border border-neutral-200"
                >
                  <h3 className="text-lg font-light text-neutral-900 mb-6">
                    Project Links
                  </h3>
                  
                  <div className="space-y-3">
                    {project.projectUrl && (
                      <a
                        href={project.projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full catalog-button-unveil catalog-button-primary text-center"
                      >
                        View Live Project
                      </a>
                    )}
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full catalog-button-unveil text-center"
                      >
                        View Source Code
                      </a>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Back to Projects */}
      <section className="py-16 px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Link
              to="/"
              className="catalog-button-unveil text-lg px-8 py-4"
            >
              ← Back to All Projects
            </Link>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
};

export default ProjectDetail;