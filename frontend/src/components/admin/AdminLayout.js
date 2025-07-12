// frontend/src/components/admin/AdminLayout.js
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      current: location.pathname === '/admin'
    },
    {
      name: 'Projects',
      href: '/admin/projects',
      current: location.pathname.startsWith('/admin/projects')
    },
    {
      name: 'Studio',
      href: '/admin/studio',
      current: location.pathname === '/admin/studio'
    },
    {
      name: 'Contact',
      href: '/admin/contact',
      current: location.pathname === '/admin/contact'
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      current: location.pathname === '/admin/settings'
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out');
      navigate('/admin/login');
    } catch (error) {
      toast.error('Logout error');
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden bg-black/20"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ x: sidebarOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 lg:relative lg:translate-x-0 lg:static"
      >
        <div className="flex flex-col h-full">
          
          {/* Header */}
          <div className="h-16 px-4 border-b border-neutral-200 flex items-center justify-between">
            <Link to="/" className="text-sm font-medium text-neutral-900">
              ← BACK TO SITE
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-neutral-400"
            >
              ×
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`block px-3 py-2 text-xs font-medium tracking-wide uppercase transition-colors ${
                    item.current
                      ? 'text-neutral-900 bg-neutral-100'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-neutral-200">
            <div className="text-xs text-neutral-600 mb-2">
              Logged in as {user?.username}
            </div>
            <button
              onClick={handleLogout}
              className="text-xs font-medium text-neutral-900 hover:text-neutral-600 transition-colors"
            >
              LOG OUT
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-neutral-200 px-4 flex items-center">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-neutral-600"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 5H15" stroke="currentColor" strokeWidth="1"/>
              <path d="M3 9H15" stroke="currentColor" strokeWidth="1"/>
              <path d="M3 13H15" stroke="currentColor" strokeWidth="1"/>
            </svg>
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 bg-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;