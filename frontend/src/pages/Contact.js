// frontend/src/pages/Contact.js
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Text, Sphere } from '@react-three/drei';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import gsap from 'gsap';

// Contact form validation schema
const contactSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  email: z.string().email('Введите корректный email'),
  subject: z.string().min(5, 'Тема должна содержать минимум 5 символов'),
  message: z.string().min(10, 'Сообщение должно содержать минимум 10 символов'),
});

// 3D Contact Visualization
const ContactVisualization = () => {
  const sphereRef = useRef();
  const textRef = useRef();

  useFrame((state) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      sphereRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.2;
    }
  });

  return (
    <>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.3}>
        <Sphere ref={sphereRef} args={[1, 32, 32]} position={[0, 0, 0]}>
          <meshStandardMaterial
            color="#0ea5e9"
            transparent
            opacity={0.7}
            wireframe
          />
        </Sphere>
      </Float>

      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.2}>
        <Text
          ref={textRef}
          position={[0, 0, 1.5]}
          fontSize={0.5}
          color="#8b5cf6"
          anchorX="center"
          anchorY="middle"
        >
          Контакты
        </Text>
      </Float>

      {/* Floating particles */}
      {Array.from({ length: 20 }, (_, i) => (
        <Float key={i} speed={1 + Math.random()} rotationIntensity={0.2}>
          <Sphere
            args={[0.05, 8, 8]}
            position={[
              (Math.random() - 0.5) * 10,
              (Math.random() - 0.5) * 10,
              (Math.random() - 0.5) * 10,
            ]}
          >
            <meshBasicMaterial color="#0ea5e9" />
          </Sphere>
        </Float>
      ))}
    </>
  );
};

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);
  const heroRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(contactSchema),
  });

  const contactMethods = [
    {
      icon: "📧",
      title: "Email",
      value: "contact@portfolio.com",
      href: "mailto:contact@portfolio.com",
      description: "Напишите мне письмо"
    },
    {
      icon: "💼",
      title: "LinkedIn",
      value: "linkedin.com/in/portfolio",
      href: "https://linkedin.com/in/portfolio",
      description: "Профессиональная сеть"
    },
    {
      icon: "🐙",
      title: "GitHub",
      value: "github.com/portfolio",
      href: "https://github.com/portfolio",
      description: "Мои проекты на GitHub"
    },
    {
      icon: "📱",
      title: "Telegram",
      value: "@portfolio_dev",
      href: "https://t.me/portfolio_dev",
      description: "Быстрая связь"
    }
  ];

  // GSAP animations
  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(heroRef.current.children,
        { opacity: 0, y: 100 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 1, 
          stagger: 0.2,
          ease: "power3.out"
        }
      );
    }

    if (formRef.current) {
      gsap.fromTo(formRef.current.querySelectorAll('.form-field'),
        { opacity: 0, x: -50 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power2.out",
          delay: 0.5
        }
      );
    }
  }, []);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Form data:', data);
      
      toast.success('Сообщение отправлено! Я свяжусь с вами в ближайшее время.');
      reset();
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Ошибка отправки сообщения. Попробуйте еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section with 3D */}
      <section className="relative py-20 px-4 min-h-screen flex items-center">
        {/* 3D Background */}
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
            <ambientLight intensity={0.6} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
            
            <ContactVisualization />
            
            <OrbitControls 
              enableZoom={false} 
              autoRotate 
              autoRotateSpeed={1}
              enablePan={false}
            />
          </Canvas>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-gray-900/60 z-10" />

        {/* Content */}
        <div className="relative z-20 max-w-4xl mx-auto text-center" ref={heroRef}>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary-400 via-accent-500 to-primary-600 bg-clip-text text-transparent">
            Свяжитесь со мной
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            Готов обсудить ваш проект или предложение о сотрудничестве. 
            Всегда открыт для интересных задач и новых возможностей!
          </p>
          <div className="text-lg text-primary-400">
            Отвечу в течение 24 часов
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20 px-4 bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Способы связи
            </h2>
            <p className="text-xl text-gray-400">
              Выберите удобный для вас способ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, index) => (
              <motion.a
                key={method.title}
                href={method.href}
                target={method.href.startsWith('http') ? '_blank' : undefined}
                rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 hover:border-primary-500 transition-all duration-300 group"
                whileHover={{ scale: 1.05, y: -5 }}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {method.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary-400 transition-colors">
                  {method.title}
                </h3>
                <p className="text-primary-400 font-medium mb-2">
                  {method.value}
                </p>
                <p className="text-gray-400 text-sm">
                  {method.description}
                </p>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Напишите мне
            </h2>
            <p className="text-xl text-gray-400">
              Заполните форму, и я свяжусь с вами
            </p>
          </div>

          <motion.div
            ref={formRef}
            className="bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-field">
                  <label className="block text-white font-medium mb-2">
                    Ваше имя *
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                    placeholder="Как вас зовут?"
                  />
                  {errors.name && (
                    <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div className="form-field">
                  <label className="block text-white font-medium mb-2">
                    Email *
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                    placeholder="your@email.com"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* Subject */}
              <div className="form-field">
                <label className="block text-white font-medium mb-2">
                  Тема *
                </label>
                <input
                  {...register('subject')}
                  type="text"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="О чем хотите поговорить?"
                />
                {errors.subject && (
                  <p className="text-red-400 text-sm mt-1">{errors.subject.message}</p>
                )}
              </div>

              {/* Message */}
              <div className="form-field">
                <label className="block text-white font-medium mb-2">
                  Сообщение *
                </label>
                <textarea
                  {...register('message')}
                  rows={6}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors resize-vertical"
                  placeholder="Расскажите подробнее о вашем проекте или вопросе..."
                />
                {errors.message && (
                  <p className="text-red-400 text-sm mt-1">{errors.message.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="form-field">
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 disabled:from-gray-600 disabled:to-gray-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl disabled:shadow-none"
                  whileHover={!isSubmitting ? { scale: 1.05 } : {}}
                  whileTap={!isSubmitting ? { scale: 0.95 } : {}}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Отправляю...</span>
                    </div>
                  ) : (
                    'Отправить сообщение'
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary-900/20 to-accent-900/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Часто задаваемые вопросы
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                question: "Какие проекты вы разрабатываете?",
                answer: "Специализируюсь на интерактивных веб-приложениях, 3D визуализациях, корпоративных сайтах и SPA приложениях с современным дизайном."
              },
              {
                question: "Сколько времени занимает разработка?",
                answer: "В зависимости от сложности: простой сайт — 1-2 недели, сложное веб-приложение — 1-3 месяца. Точные сроки обсуждаем после анализа требований."
              },
              {
                question: "Предоставляете ли вы поддержку?",
                answer: "Да, предоставляю техническую поддержку и сопровождение проектов. Условия и сроки обсуждаются индивидуально."
              },
              {
                question: "Работаете ли вы с международными клиентами?",
                answer: "Конечно! Работаю с клиентами по всему миру. Общение ведется на английском или русском языке."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                className="bg-gray-900/30 backdrop-blur-sm p-6 rounded-xl border border-gray-700"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h3 className="text-xl font-bold text-white mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {faq.answer}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;