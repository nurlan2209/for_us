// frontend/src/components/ui/ContactOverlay.js
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ContactOverlay = ({ isOpen, onClose, contactButtons = [] }) => {
  const handleButtonClick = (url, event) => {
    // Open link
    window.open(url, '_blank', 'noopener,noreferrer');
    
    // Close overlay with delay for smooth UX
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Contact buttons */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="flex flex-wrap gap-4 justify-center pointer-events-auto">
              {contactButtons.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg px-6 py-3 text-xs font-medium text-neutral-500 tracking-wide uppercase"
                >
                  No contact buttons configured
                </motion.div>
              ) : (
                contactButtons.map((button, index) => (
                  <motion.button
                    key={index}
                    onClick={(e) => handleButtonClick(button.url, e)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg px-6 py-3 hover:bg-white hover:border-gray-400 transition-all duration-200 text-xs font-medium text-neutral-900 tracking-wide uppercase cursor-pointer"
                  >
                    {button.text}
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ContactOverlay;