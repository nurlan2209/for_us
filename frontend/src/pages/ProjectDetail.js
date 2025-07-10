// frontend/src/pages/ProjectDetail.js
import React, { useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, Center, Html } from '@react-three/drei'; // ✅ Добавили Html
import { projectsAPI } from '../utils/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// 3D Project Showcase Component
const Project3DShowcase = ({ project }) => {
  const meshRef = useRef();

  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />

      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.3}>
        <Center>
          {/* ✅ Теперь Html импортирован и будет работать */}
          <Html center>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent pointer-events-none">
              {project.title}
            </h1>
          </Html>
        </Center>
      </Float>

      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
    </Canvas>
  );
};

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const headerRef = useRef(null);
  const contentRef = useRef(null);
  const imageRef = useRef(null);

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

  // GSAP Animations
  useEffect(() => {
    if (project && headerRef.current && contentRef.current) {
      const tl = gsap.timeline();
      
      // Header animations
      tl.fromTo(headerRef.current.children,
        { opacity: 0, y: 100 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 1, 
          stagger: 0.2,
          ease: "power3.out"
        }
      );

      // Content animations
      gsap.fromTo(contentRef.current.children,
        { opacity: 0, x: -50 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: contentRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // Image animation
      if (imageRef.current) {
        gsap.fromTo(imageRef.current,
          { opacity: 0, scale: 0.8, rotation: 5 },
          {
            opacity: 1,
            scale: 1,
            rotation: 0,
            duration: 1.2,
            ease: "back.out(1.7)",
            scrollTrigger: {
              trigger: imageRef.current,
              start: "top 85%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [project]);

  if (isLoading) return <LoadingSpinner text="Загрузка проекта..." />;
  
  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Проект не найден
          </h2>
          <p className="text-gray-400 mb-6">
            Запрашиваемый проект не существует или был удален
          </p>
          <Link
            to="/portfolio"
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Вернуться к портфолио
          </Link>
        </div>
      </div>
    );
  }

  const technologies = project.technologies.split(',').map(tech => tech.trim());

  return (
    <div className="min-h-screen pt-16">
      {/* 3D Hero Section */}
      <section className="relative h-96 overflow-hidden">
        <div className="absolute inset-0">
          <Project3DShowcase project={project} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-gray-900/80" />
        
        {/* Navigation */}
        <div className="absolute top-6 left-6 z-20">
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-900/80 backdrop-blur-sm text-white p-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Featured Badge */}
        {project.featured && (
          <div className="absolute top-6 right-6 z-20">
            <div className="bg-yellow-500 text-black px-4 py-2 rounded-full font-bold text-sm">
              ⭐ Избранный проект
            </div>
          </div>
        )}
      </section>

      {/* Project Header */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto text-center" ref={headerRef}>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary-400 to-accent-500 bg-clip-text text-transparent">
            {project.title}
          </h1>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            {project.description}
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {project.projectUrl && (
              <motion.a
                href={project.projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🚀 Посмотреть демо
              </motion.a>
            )}
            {project.githubUrl && (
              <motion.a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-primary-500 text-primary-400 hover:bg-primary-500 hover:text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                📂 Исходный код
              </motion.a>
            )}
          </div>
        </div>
      </section>

      {/* Project Image */}
      {project.imageUrl && (
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              ref={imageRef}
              className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-700"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <img
                src={project.imageUrl}
                alt={project.title}
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          </div>
        </section>
      )}

      {/* Project Details */}
      <section className="py-20 px-4 bg-gray-800/50">
        <div className="max-w-4xl mx-auto" ref={contentRef}>
          
          {/* Technologies */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6">
              Технологии
            </h2>
            <div className="flex flex-wrap gap-3">
              {technologies.map((tech, index) => (
                <motion.span
                  key={index}
                  className="bg-gradient-to-r from-primary-500/20 to-accent-500/20 border border-primary-500/30 text-primary-300 px-4 py-2 rounded-lg font-medium"
                  whileHover={{ scale: 1.1, y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  {tech}
                </motion.span>
              ))}
            </div>
          </div>

          {/* Project Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 text-center">
              <div className="text-3xl font-bold text-primary-400 mb-2">
                {technologies.length}
              </div>
              <div className="text-gray-400">Технологий</div>
            </div>
            
            <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 text-center">
              <div className="text-3xl font-bold text-accent-400 mb-2">
                {project.status === 'published' ? '✅' : '🚧'}
              </div>
              <div className="text-gray-400">
                {project.status === 'published' ? 'Завершен' : 'В разработке'}
              </div>
            </div>
            
            <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {new Date(project.createdAt).getFullYear()}
              </div>
              <div className="text-gray-400">Год создания</div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-gray-900/30 backdrop-blur-sm p-8 rounded-xl border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-4">
              О проекте
            </h3>
            <p className="text-gray-300 leading-relaxed text-lg">
              {project.description}
            </p>
            
            {/* Creation Date */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                Создано: {new Date(project.createdAt).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Related Projects CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary-900/20 to-accent-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Хотите увидеть больше проектов?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Ознакомьтесь с другими работами в моем портфолио
          </p>
          <Link
            to="/portfolio"
            className="inline-block bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Все проекты
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ProjectDetail;