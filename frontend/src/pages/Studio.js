// frontend/src/pages/Studio.js
import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { settingsAPI } from '../utils/api';

const Studio = () => {
  // Fetch studio settings from API
  const { data: studioData, isLoading } = useQuery(
    'studio-settings',
    () => settingsAPI.getStudio(),
    {
      select: (response) => response.data.studio,
      staleTime: 5 * 60 * 1000,
    }
  );

  const studio = studioData || {
    aboutText: '',
    clients: [],
    services: [],
    recognitions: []
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-24" style={{ paddingTop: '300px' }}>
      <div className="px-4 pl-1">
        
        {/* About Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="max-w-lg">
            <p className="text-xs text-neutral-900 leading-relaxed">
              {studio.aboutText || ''}
            </p>
          </div>
        </motion.div>

        {/* Clients Section */}
        {studio.clients.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12 flex"
          >
            <h2 className="text-xs font-medium text-neutral-400 tracking-wide uppercase mb-6 w-48 flex-shrink-0">
              CLIENTS
            </h2>
            <div className="flex-1 space-y-1">
              {studio.clients.map((client, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.02 }}
                  className="text-xs text-neutral-600"
                >
                  {client}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Services Section */}
        {studio.services.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-12 flex"
          >
            <h2 className="text-xs font-medium text-neutral-400 tracking-wide uppercase mb-6 w-48 flex-shrink-0">
              SERVICES
            </h2>
            <div className="flex-1 space-y-1">
              {studio.services.map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  className="text-xs text-neutral-600"
                >
                  {service}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recognitions Section */}
        {studio.recognitions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-12"
          >
            <div className="max-w-lg space-y-1">
              {studio.recognitions.map((recognition, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                  className="text-xs text-neutral-600"
                >
                  {recognition}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default Studio;