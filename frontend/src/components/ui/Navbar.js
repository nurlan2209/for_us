// frontend/src/components/ui/Navbar.js - Точная копия стиля unveil.fr
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const navItems = [
    { name: 'PROJECTS', path: '/portfolio' },
    { name: 'RESEARCH', path: '/about' },
    { name: 'STUDIO', path: '/studio' },
    { name: 'CONTACT', path: '/contact' },
  ];

  const isActivePath = (path) => {
    if (path === '/portfolio' && location.pathname.startsWith('/portfolio')) return true;
    if (path === '/about' && location.pathname.startsWith('/about')) return true;
    if (path === '/studio' && location.pathname.startsWith('/studio')) return true;
    if (path === '/contact' && location.pathname.startsWith('/contact')) return true;
    return false;
  };

  return (
    <>
      {/* Navigation */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-out ${
          scrolled 
            ? 'bg-white/95 backdrop-blur-xl' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-screen-2xl mx-auto">
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex justify-between items-center px-8 py-6">
            
            {/* Logo */}
            <Link 
              to="/" 
              className="text-black font-medium text-sm tracking-[0.2em] hover:opacity-70 transition-opacity duration-300"
            >
              UNVEIL × PROJECTS
            </Link>

            {/* Center Navigation */}
            <div className="flex items-center space-x-16">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-xs font-medium tracking-[0.15em] transition-all duration-300 relative group ${
                    isActivePath(item.path)
                      ? 'text-black opacity-100'
                      : 'text-neutral-400 hover:text-black hover:opacity-100'
                  }`}
                >
                  {item.name}
                  
                  {/* Active indicator */}
                  {isActivePath(item.path) && (
                    <motion.div
                      layoutId="navbar-active"
                      className="absolute -bottom-2 left-0 right-0 h-px bg-black"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Right side - можно добавить доп элементы */}
            <div className="w-32"> {/* Spacer для симметрии */}
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="lg:hidden flex justify-between items-center px-6 py-5">
            <Link 
              to="/" 
              className="text-black font-medium text-sm tracking-[0.1em]"
            >
              UNVEIL
            </Link>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-black hover:opacity-70 transition-opacity duration-200"
              aria-label="Menu"
            >
              <motion.div
                animate={{ rotate: isOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  {isOpen ? (
                    <path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                  ) : (
                    <>
                      <path d="M3 5H15" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                      <path d="M3 9H15" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                      <path d="M3 13H15" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                    </>
                  )}
                </svg>
              </motion.div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="bg-white h-full pt-20 px-6">
              <div className="space-y-8">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Link
                      to={item.path}
                      className={`block text-2xl font-light tracking-wide transition-colors duration-300 ${
                        isActivePath(item.path)
                          ? 'text-black'
                          : 'text-neutral-400 hover:text-black'
                      }`}
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;