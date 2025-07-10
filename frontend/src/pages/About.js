// frontend/src/pages/About.js
import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, Sphere, Box } from '@react-three/drei';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// 3D Skills Visualization
const SkillsVisualization = () => {
  const skills = [
    { name: 'React', level: 0.9, color: '#61dafb', position: [-2, 1, 0] },
    { name: 'Three.js', level: 0.8, color: '#000000', position: [2, 1, 0] },
    { name: 'Node.js', level: 0.85, color: '#339933', position: [0, -1, 1] },
    { name: 'Docker', level: 0.7, color: '#2496ed', position: [-1, -1, -1] },
    { name: 'GSAP', level: 0.75, color: '#88ce02', position: [1, 0, -1] },
  ];

  return (
    <>
      {skills.map((skill, index) => (
        <Float key={skill.name} speed={2 + index * 0.3} rotationIntensity={0.5}>
          <group position={skill.position}>
            <Sphere args={[skill.level * 0.5, 32, 32]}>
              <meshStandardMaterial 
                color={skill.color} 
                transparent 
                opacity={0.8}
                emissive={skill.color}
                emissiveIntensity={0.2}
              />
            </Sphere>
            {/* Skill level indicator */}
            <Box position={[0, skill.level, 0]} args={[0.1, skill.level * 2, 0.1]}>
              <meshStandardMaterial color="#ffffff" />
            </Box>
          </group>
        </Float>
      ))}
    </>
  );
};

const About = () => {
  const heroRef = useRef(null);
  const skillsRef = useRef(null);
  const experienceRef = useRef(null);
  const personalRef = useRef(null);

  const skills = [
    {
      category: "Frontend",
      items: [
        { name: "React", level: 90 },
        { name: "Three.js", level: 80 },
        { name: "TypeScript", level: 85 },
        { name: "Tailwind CSS", level: 90 },
        { name: "GSAP", level: 75 },
        { name: "Framer Motion", level: 80 },
      ]
    },
    {
      category: "Backend",
      items: [
        { name: "Node.js", level: 85 },
        { name: "Express", level: 80 },
        { name: "MongoDB", level: 75 },
        { name: "PostgreSQL", level: 70 },
        { name: "JWT", level: 85 },
        { name: "REST API", level: 90 },
      ]
    },
    {
      category: "DevOps & Tools",
      items: [
        { name: "Docker", level: 70 },
        { name: "Git", level: 90 },
        { name: "Nginx", level: 65 },
        { name: "Linux", level: 75 },
        { name: "AWS", level: 60 },
        { name: "CI/CD", level: 65 },
      ]
    }
  ];

  const experience = [
    {
      year: "2023-2024",
      title: "Full-Stack разработчик",
      company: "Freelance",
      description: "Создание современных веб-приложений с использованием React, Node.js и 3D технологий. Специализация на интерактивных пользовательских интерфейсах."
    },
    {
      year: "2022-2023",
      title: "Frontend разработчик",
      company: "Digital Agency",
      description: "Разработка корпоративных сайтов и веб-приложений. Работа с React, Vue.js и современными инструментами сборки."
    },
    {
      year: "2021-2022",
      title: "Junior Developer",
      company: "Tech Startup",
      description: "Изучение современных технологий веб-разработки. Участие в создании MVP продуктов и прототипов."
    }
  ];

  useEffect(() => {
    // Hero section animation
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

    // Skills section animation
    if (skillsRef.current) {
      gsap.fromTo(skillsRef.current.querySelectorAll('.skill-item'),
        { opacity: 0, x: -50 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: skillsRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }

    // Experience timeline animation
    if (experienceRef.current) {
      gsap.fromTo(experienceRef.current.querySelectorAll('.experience-item'),
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: experienceRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <section className="relative py-20 px-4 min-h-screen flex items-center">
        {/* 3D Background */}
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
            <ambientLight intensity={0.6} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
            
            <SkillsVisualization />
            
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
        <div className="relative z-20 max-w-4xl mx-auto">
          <div ref={heroRef} className="text-center lg:text-left">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary-400 via-accent-500 to-primary-600 bg-clip-text text-transparent">
              Обо мне
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed max-w-3xl">
              Привет! Я <span className="text-primary-400 font-semibold">Full-Stack разработчик</span> с 
              страстью к созданию интерактивных веб-приложений и 3D визуализаций. 
              Специализируюсь на современных технологиях и люблю воплощать креативные идеи в жизнь.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a
                href="/portfolio"
                className="bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Мои работы
              </a>
              <a
                href="/contact"
                className="border-2 border-primary-500 text-primary-400 hover:bg-primary-500 hover:text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300"
              >
                Связаться
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section ref={skillsRef} className="py-20 px-4 bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Технические навыки
            </h2>
            <p className="text-xl text-gray-400">
              Технологии, с которыми я работаю
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {skills.map((skillGroup, groupIndex) => (
              <div key={skillGroup.category} className="skill-item">
                <h3 className="text-2xl font-bold text-primary-400 mb-6 text-center">
                  {skillGroup.category}
                </h3>
                <div className="space-y-4">
                  {skillGroup.items.map((skill, index) => (
                    <div key={skill.name} className="skill-item">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">{skill.name}</span>
                        <span className="text-primary-400 text-sm">{skill.level}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <motion.div
                          className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${skill.level}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                          viewport={{ once: true }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section ref={experienceRef} className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Опыт работы
            </h2>
            <p className="text-xl text-gray-400">
              Мой профессиональный путь
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-500 to-accent-500"></div>

            {experience.map((item, index) => (
              <div key={index} className={`experience-item relative flex items-center mb-12 ${
                index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
              }`}>
                {/* Timeline dot */}
                <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 w-4 h-4 bg-primary-500 rounded-full border-4 border-gray-900 z-10"></div>

                {/* Content */}
                <div className={`ml-12 md:ml-0 md:w-5/12 ${
                  index % 2 === 0 ? 'md:mr-auto md:pr-8' : 'md:ml-auto md:pl-8'
                }`}>
                  <motion.div
                    className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 hover:border-primary-500 transition-all duration-300"
                    whileHover={{ scale: 1.02, y: -5 }}
                  >
                    <div className="text-primary-400 font-semibold mb-2">
                      {item.year}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {item.title}
                    </h3>
                    <div className="text-accent-400 font-medium mb-3">
                      {item.company}
                    </div>
                    <p className="text-gray-400 leading-relaxed">
                      {item.description}
                    </p>
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Personal Section */}
      <section ref={personalRef} className="py-20 px-4 bg-gradient-to-r from-primary-900/20 to-accent-900/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Личное
            </h2>
            <p className="text-xl text-gray-400">
              Что меня вдохновляет
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              className="bg-gray-900/30 backdrop-blur-sm p-8 rounded-xl border border-gray-700"
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-2xl font-bold text-white mb-4">Творчество</h3>
              <p className="text-gray-400 leading-relaxed">
                Люблю экспериментировать с новыми технологиями и создавать 
                уникальные пользовательские интерфейсы. Черпаю вдохновение 
                в современном дизайне и 3D искусстве.
              </p>
            </motion.div>

            <motion.div
              className="bg-gray-900/30 backdrop-blur-sm p-8 rounded-xl border border-gray-700"
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold text-white mb-4">Инновации</h3>
              <p className="text-gray-400 leading-relaxed">
                Постоянно изучаю новые фреймворки и инструменты. 
                Интересуюсь WebGL, AR/VR технологиями и современными 
                подходами к веб-разработке.
              </p>
            </motion.div>

            <motion.div
              className="bg-gray-900/30 backdrop-blur-sm p-8 rounded-xl border border-gray-700"
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-4xl mb-4">🌱</div>
              <h3 className="text-2xl font-bold text-white mb-4">Развитие</h3>
              <p className="text-gray-400 leading-relaxed">
                Верю в непрерывное обучение и самосовершенствование. 
                Участвую в open-source проектах и делюсь знаниями 
                с сообществом разработчиков.
              </p>
            </motion.div>

            <motion.div
              className="bg-gray-900/30 backdrop-blur-sm p-8 rounded-xl border border-gray-700"
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-white mb-4">Цели</h3>
              <p className="text-gray-400 leading-relaxed">
                Стремлюсь создавать продукты, которые решают реальные 
                проблемы пользователей и приносят им радость от 
                взаимодействия с технологиями.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Готовы работать вместе?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Если у вас есть интересный проект или предложение о сотрудничестве
          </p>
          <a
            href="/contact"
            className="inline-block bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Связаться со мной
          </a>
        </div>
      </section>
    </div>
  );
};

export default About;