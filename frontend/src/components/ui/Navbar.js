// frontend/src/components/ui/Navbar.js - Исправленная версия
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from 'react-query';
import { settingsAPI } from '../../utils/api';
import ContactOverlay from './ContactOverlay';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Fetch contact buttons
  const { data: contactData } = useQuery(
    'contact-settings',
    () => settingsAPI.getContact(),
    {
      select: (response) => response.data.contact?.contactButtons || [],
      staleTime: 5 * 60 * 1000,
    }
  );

  const contactButtons = contactData || [];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setContactOpen(false);
  }, [location]);

  const navItems = [
    { name: 'PROJECTS', path: '/', action: 'navigate' },
    { name: 'STUDIO', path: '/studio', action: 'navigate' },
    { name: 'CONTACT', path: '#', action: 'contact' },
  ];

  const isActivePath = (path) => {
    if (path === '/' && (location.pathname === '/' || location.pathname.startsWith('/portfolio'))) return true;
    if (path === '/studio' && location.pathname.startsWith('/studio')) return true;
    return false;
  };

  const handleNavClick = (item) => {
    if (item.action === 'contact') {
      setContactOpen(true);
    } else {
      window.location.href = item.path;
    }
  };

  return (
    <>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white">
        <div className="px-4 pt-0.5 pl-1">
          
          {/* Desktop Navigation */}
          <div className="flex items-center h-16">
            
            {/* Navigation buttons */}
            <div className="hidden lg:flex items-start gap-x-[2px]">
              {navItems.map((item, index) => (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item)}
                  className={`flex items-end justify-start rounded-[0.375rem] px-2 py-2 pb-1 h-[59.02px] ${
                    index === 0 ? 'w-[200px]' : 'w-[124.67px]'
                  } text-[10px] font-medium tracking-wider transition-all duration-200 border border-gray-300 ${
                    isActivePath(item.path)
                      ? 'bg-[#f2f2f2] text-black'
                      : 'bg-[#f2f2f2] text-[#c3c3c3] hover:text-black'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>

            {/* ✅ ИСПРАВЛЕННОЕ мобильное меню с правильной позицией и размером */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden text-black hover:opacity-70 transition-opacity duration-200 ml-4"
              aria-label="Menu"
            >
              <motion.div
                animate={{ rotate: isOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="transform">
                  {isOpen ? (
                    <path d="M16.5 5.5L5.5 16.5M5.5 5.5L16.5 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  ) : (
                    <>
                      <path d="M3 6H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M3 11H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M3 16H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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
              <div className="space-y-4">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    {item.action === 'contact' ? (
                      <button
                        onClick={() => setContactOpen(true)}
                        className="block w-full text-left px-4 py-3 text-lg font-medium tracking-wide transition-colors duration-300 border rounded bg-transparent text-gray-600 border-gray-300 hover:border-gray-400 hover:text-black"
                      >
                        {item.name}
                      </button>
                    ) : (
                      <Link
                        to={item.path}
                        className={`block px-4 py-3 text-lg font-medium tracking-wide transition-colors duration-300 border rounded ${
                          isActivePath(item.path)
                            ? 'bg-black text-white border-black'
                            : 'bg-transparent text-gray-600 border-gray-300 hover:border-gray-400 hover:text-black'
                        }`}
                      >
                        {item.name}
                      </Link>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Overlay */}
      <ContactOverlay 
        isOpen={contactOpen} 
        onClose={() => setContactOpen(false)} 
        contactButtons={contactButtons}
      />
    </>
  );
};

export default Navbar;