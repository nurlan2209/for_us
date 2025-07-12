// frontend/src/pages/Studio.js
import React from 'react';
import { motion } from 'framer-motion';

const Studio = () => {
  const clients = [
  ];

  const services = [
    "CREATIVE DIRECTION",
    "AI",
    "CGI",
    "GRAPHIC IDENTITY",
    "DIGITAL DESIGN",
    "STRATEGY"
  ];

  const recognitions = [
  ];

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="max-w-4xl px-6 lg:px-8">
        
        {/* About Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="max-w-lg">
            <p className="text-sm text-neutral-900 leading-relaxed">
              UNVEIL is a creative studio using technology to expand human creativity. The eye, 
              depicted in our logo, represents our most essential tool in a world overwhelmed with 
              visual stimuli. We collaborate across diverse industries and cultural landscapes, 
              working with brands to translate their vision into reality through innovation. It is 
              backed by thorough research, ensuring that our creative decisions are deliberate and 
              meaningful. No project is too small for us, we see each one as an opportunity to express 
              ourselves. We love what we do.
            </p>
          </div>
        </motion.div>

        {/* Clients Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-xs font-medium text-neutral-400 tracking-wide uppercase mb-6">
            CLIENTS
          </h2>
          <div className="max-w-lg space-y-1">
            {clients.map((client, index) => (
              <motion.div
                key={client}
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

        {/* Services Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-xs font-medium text-neutral-400 tracking-wide uppercase mb-6">
            SERVICES
          </h2>
          <div className="max-w-lg space-y-1">
            {services.map((service, index) => (
              <motion.div
                key={service}
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

        {/* Recognitions Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-12"
        >
          <div className="max-w-lg space-y-1">
            {recognitions.map((recognition, index) => (
              <motion.div
                key={recognition}
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

      </div>
    </div>
  );
};

export default Studio;