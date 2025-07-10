// frontend/src/components/ui/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: 'GitHub',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
        </svg>
      ),
      href: 'https://github.com',
      color: 'hover:text-gray-300'
    },
    {
      name: 'LinkedIn',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      href: 'https://linkedin.com',
      color: 'hover:text-blue-400'
    },
    {
      name: 'Twitter',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      ),
      href: 'https://twitter.com',
      color: 'hover:text-blue-400'
    },
    {
      name: 'Dribbble',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0zm9.568 5.302c.896 1.464 1.43 3.174 1.43 5.005 0 .734-.088 1.448-.251 2.131-.456-.094-5.043-1.025-9.608-.484.023-.056.044-.112.067-.171.062-.156.129-.323.196-.49 2.646-.343 5.267-.343 7.795.009zM12 2.252c2.173 0 4.174.744 5.759 1.992-1.898 1.676-4.926 3.314-8.759 3.77V2.252zM5.878 3.458A10.136 10.136 0 0112 2.252v5.762c-3.833-.456-6.861-2.094-8.759-3.77A9.968 9.968 0 015.878 3.458zM2.252 12c0-.178.01-.355.025-.532.456.008 5.32.066 10.608-1.992.178.348.349.7.505 1.052-4.178.848-7.518 3.176-9.885 6.374A9.968 9.968 0 012.252 12zm1.53 8.413c2.012-2.613 4.986-4.686 8.685-5.416.896 2.32 1.464 4.785 1.464 7.004 0 .734-.088 1.448-.251 2.131A9.973 9.973 0 013.782 20.413zm8.966.984c-.062-2.012-.456-3.95-1.098-5.759 4.178-.67 8.356.225 9.306.413a9.973 9.973 0 01-8.208 5.346z"/>
        </svg>
      ),
      href: 'https://dribbble.com',
      color: 'hover:text-pink-400'
    }
  ];

  const footerLinks = [
    {
      title: 'Навигация',
      links: [
        { name: 'Главная', href: '/' },
        { name: 'Портфолио', href: '/portfolio' },
        { name: 'Обо мне', href: '/about' },
        { name: 'Контакты', href: '/contact' },
      ]
    },
    {
      title: 'Проекты',
      links: [
        { name: 'Веб-приложения', href: '/portfolio?filter=react' },
        { name: '3D Визуализации', href: '/portfolio?filter=three.js' },
        { name: 'Мобильные', href: '/portfolio?filter=mobile' },
        { name: 'Избранные', href: '/portfolio?filter=featured' },
      ]
    },
    {
      title: 'Технологии',
      links: [
        { name: 'React', href: '/portfolio?filter=react' },
        { name: 'Three.js', href: '/portfolio?filter=three.js' },
        { name: 'Node.js', href: '/portfolio?filter=node.js' },
        { name: 'Docker', href: '/portfolio?filter=docker' },
      ]
    }
  ];

  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand section */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="w-10 h-10 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg flex items-center justify-center"
              >
                <span className="text-white font-bold text-lg">P</span>
              </motion.div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                Portfolio
              </span>
            </Link>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Создаю современные интерактивные веб-приложения и 3D визуализации 
              с использованием передовых технологий.
            </p>
            
            {/* Social links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-gray-500 ${social.color} transition-colors duration-200`}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={social.name}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Navigation links */}
          {footerLinks.map((section, index) => (
            <div key={section.title}>
              <h3 className="text-white font-semibold mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-gray-400 hover:text-primary-400 transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © {currentYear} Portfolio. Все права защищены.
            </div>
            
            <div className="flex items-center space-x-6 text-sm">
              <Link 
                to="/privacy" 
                className="text-gray-400 hover:text-primary-400 transition-colors"
              >
                Политика конфиденциальности
              </Link>
              <Link 
                to="/terms" 
                className="text-gray-400 hover:text-primary-400 transition-colors"
              >
                Условия использования
              </Link>
              <a 
                href="mailto:contact@portfolio.com"
                className="text-gray-400 hover:text-primary-400 transition-colors"
              >
                contact@portfolio.com
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Back to top button */}
      <motion.button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 bg-primary-500 hover:bg-primary-600 text-white p-3 rounded-full shadow-lg z-50 transition-colors duration-200"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </motion.button>
    </footer>
  );
};

export default Footer;