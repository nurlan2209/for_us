// frontend/src/pages/Home.js - В стиле unveil.fr
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Минималистичная 3D сцена для героя
const HeroScene3D = () => {
  const meshRef = useRef();
  
  return (
    <>
      {/* Основной элемент сцены */}
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.3}>
        <mesh ref={meshRef} position={[0, 0, 0]}>
          <boxGeometry args={[2, 2, 0.1]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.1}
            metalness={0.1}
            transparent
            opacity={0.9}
          />
        </mesh>
      </Float>

      {/* Дополнительные плавающие элементы */}
      <Float speed={0.8} rotationIntensity={0.1} floatIntensity={0.2}>
        <mesh position={[3, 1, -2]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial
            color="#f8fafc"
            transparent
            opacity={0.7}
          />
        </mesh>
      </Float>

      <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.25}>
        <mesh position={[-2.5, -1, -1]}>
          <cylinderGeometry args={[0.3, 0.3, 1.5, 8]} />
          <meshStandardMaterial
            color="#e4e4e7"
            transparent
            opacity={0.8}
          />
        </mesh>
      </Float>
    </>
  );
};

const Home = () => {
  const heroRef = useRef(null);
  const featuresRef = useRef(null);

  useEffect(() => {
    // Простая анимация появления без GSAP
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        
        {/* 3D Background */}
        <div className="absolute inset-0 z-0">
          <Canvas
            camera={{ position: [0, 0, 5], fov: 50 }}
            style={{ background: 'linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%)' }}
          >
            <ambientLight intensity={0.8} />
            <directionalLight position={[10, 10, 5]} intensity={0.5} />
            <pointLight position={[-10, -10, -5]} intensity={0.3} color="#f1f5f9" />
            
            <HeroScene3D />
            
            <OrbitControls 
              enableZoom={false} 
              autoRotate 
              autoRotateSpeed={0.5}
              enablePan={false}
              maxPolarAngle={Math.PI / 1.8}
              minPolarAngle={Math.PI / 3}
            />
          </Canvas>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
          >
            <h1 className="text-6xl lg:text-8xl font-light text-neutral-900 tracking-tight mb-8 leading-none">
              CREATIVE
              <br />
              <span className="text-neutral-600">PORTFOLIO</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-neutral-600 mb-12 leading-relaxed max-w-2xl mx-auto">
              Interactive 3D experiences and modern web applications that push the boundaries of digital design.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/portfolio"
                className="catalog-button-unveil catalog-button-primary text-lg px-8 py-4"
              >
                VIEW PROJECTS
              </Link>
              <Link
                to="/about"
                className="catalog-button-unveil text-lg px-8 py-4"
              >
                LEARN MORE
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="flex flex-col items-center text-neutral-400">
            <span className="text-sm tracking-wide mb-2">SCROLL</span>
            <div className="w-px h-8 bg-neutral-300"></div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 lg:px-8 bg-white" ref={featuresRef}>
        <div className="max-w-7xl mx-auto">
          
          {/* Section Header */}
          <div className="text-center mb-20 scroll-reveal">
            <h2 className="text-4xl lg:text-5xl font-light text-neutral-900 tracking-tight mb-6">
              WHAT I DO
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
              Specializing in modern web technologies and immersive digital experiences
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "3D DEVELOPMENT",
                description: "Interactive 3D interfaces and visualizations using Three.js and WebGL",
                icon: "🎨"
              },
              {
                title: "WEB APPLICATIONS",
                description: "Modern web apps built with React, Next.js, and cutting-edge technologies",
                icon: "💻"
              },
              {
                title: "RESPONSIVE DESIGN",
                description: "Mobile-first design approach ensuring perfect experience across all devices",
                icon: "📱"
              },
              {
                title: "PERFORMANCE",
                description: "Optimized loading times and smooth animations for exceptional user experience",
                icon: "⚡"
              },
              {
                title: "UI/UX DESIGN",
                description: "Clean, intuitive interfaces that prioritize user experience and accessibility",
                icon: "✨"
              },
              {
                title: "INNOVATION",
                description: "Exploring new technologies and pushing the boundaries of web development",
                icon: "🚀"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                className="card-unveil p-8 hover:shadow-card-hover transition-all duration-300 scroll-reveal"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="text-4xl mb-6">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-4 tracking-wide">
                  {feature.title}
                </h3>
                <p className="text-neutral-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technologies Section */}
      <section className="py-24 px-6 lg:px-8 bg-neutral-50">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center mb-20 scroll-reveal">
            <h2 className="text-4xl lg:text-5xl font-light text-neutral-900 tracking-tight mb-6">
              TECHNOLOGIES
            </h2>
            <p className="text-xl text-neutral-600">
              Modern stack for exceptional digital experiences
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 scroll-reveal">
            {[
              'React',
              'Three.js', 
              'Next.js',
              'TypeScript',
              'Node.js',
              'WebGL'
            ].map((tech, index) => (
              <motion.div
                key={tech}
                className="text-center p-6 bg-white rounded-xl hover:shadow-card transition-all duration-300"
                whileHover={{ scale: 1.05, y: -5 }}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <div className="text-2xl font-semibold text-neutral-900 tracking-wide">
                  {tech}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center scroll-reveal">
          <h2 className="text-4xl lg:text-5xl font-light text-neutral-900 tracking-tight mb-8">
            READY TO CREATE
            <br />
            <span className="text-neutral-600">SOMETHING AMAZING?</span>
          </h2>
          <p className="text-xl text-neutral-600 mb-12 leading-relaxed">
            Let's discuss your project and bring your ideas to life
          </p>
          <Link
            to="/contact"
            className="catalog-button-unveil catalog-button-primary text-lg px-8 py-4"
          >
            GET IN TOUCH
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 lg:px-8 bg-neutral-50">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center scroll-reveal">
            {[
              { number: "50+", label: "PROJECTS COMPLETED" },
              { number: "3+", label: "YEARS EXPERIENCE" },
              { number: "100%", label: "CLIENT SATISFACTION" }
            ].map((stat, index) => (
              <div key={stat.label} className="p-6">
                <div className="text-4xl lg:text-5xl font-light text-neutral-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-neutral-600 tracking-wide">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;