// frontend/src/pages/Home.js
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// 3D Hero Scene Component
const HeroScene = () => {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Stars radius={300} depth={60} count={20000} factor={7} saturation={0} fade />
      
      {/* Animated 3D Elements */}
      <mesh rotation={[0, 0, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial 
          color="#0ea5e9" 
          transparent 
          opacity={0.8}
          wireframe 
        />
      </mesh>
      
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
    </Canvas>
  );
};

const Home = () => {
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    // Hero section animations
    const tl = gsap.timeline({ delay: 0.5 });
    
    tl.fromTo(titleRef.current, 
      { opacity: 0, y: 100 },
      { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
    )
    .fromTo(subtitleRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
      "-=0.5"
    )
    .fromTo(ctaRef.current,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)" },
      "-=0.3"
    );

    // Scroll-triggered animations
    const sections = document.querySelectorAll('.scroll-animate');
    sections.forEach((section, index) => {
      gsap.fromTo(section,
        { opacity: 0, y: 100 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
            end: "bottom 15%",
            toggleActions: "play none none reverse"
          }
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  const features = [
    {
      icon: "🎨",
      title: "3D Дизайн",
      description: "Создаю интерактивные 3D интерфейсы и визуализации"
    },
    {
      icon: "💻",
      title: "Веб-разработка",
      description: "Современные веб-приложения с использованием React и Three.js"
    },
    {
      icon: "📱",
      title: "Мобильная адаптация",
      description: "Респонсивный дизайн для всех устройств"
    },
    {
      icon: "⚡",
      title: "Производительность",
      description: "Оптимизация и высокая скорость загрузки"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 3D Background */}
        <div className="absolute inset-0 z-0">
          <HeroScene />
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 via-gray-900/50 to-gray-900/70 z-10" />
        
        {/* Hero Content */}
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
          <motion.h1 
            ref={titleRef}
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary-400 via-accent-500 to-primary-600 bg-clip-text text-transparent"
          >
            3D Portfolio
          </motion.h1>
          
          <motion.p 
            ref={subtitleRef}
            className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed"
          >
            Создаю интерактивные веб-приложения и 3D визуализации, 
            которые оживляют идеи и впечатляют пользователей
          </motion.p>
          
          <motion.div 
            ref={ctaRef}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              to="/portfolio"
              className="bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Посмотреть работы
            </Link>
            <Link
              to="/about"
              className="border-2 border-primary-500 text-primary-400 hover:bg-primary-500 hover:text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300"
            >
              Обо мне
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-primary-500 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-primary-500 rounded-full mt-2"></div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 scroll-animate">
            <h2 className="text-4xl font-bold text-white mb-4">
              Что я делаю
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Специализируюсь на создании современных интерактивных решений
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="scroll-animate bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 hover:border-primary-500 transition-all duration-300 hover:transform hover:scale-105"
                whileHover={{ y: -5 }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 scroll-animate">
            <h2 className="text-4xl font-bold text-white mb-4">
              Технологии
            </h2>
            <p className="text-xl text-gray-400">
              Современный стек для создания впечатляющих проектов
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 scroll-animate">
            {['React', 'Three.js', 'GSAP', 'Node.js', 'Docker', 'Tailwind'].map((tech, index) => (
              <motion.div
                key={tech}
                className="bg-gray-900/30 backdrop-blur-sm p-6 rounded-xl border border-gray-700 text-center hover:border-primary-500 transition-all duration-300"
                whileHover={{ scale: 1.1 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-2xl font-bold text-primary-400 mb-2">
                  {tech}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary-900/20 to-accent-900/20">
        <div className="max-w-4xl mx-auto text-center scroll-animate">
          <h2 className="text-4xl font-bold text-white mb-6">
            Готовы создать что-то потрясающее?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Свяжитесь со мной, чтобы обсудить ваш проект
          </p>
          <Link
            to="/contact"
            className="inline-block bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Связаться со мной
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;