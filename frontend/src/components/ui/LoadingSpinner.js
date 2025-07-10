// frontend/src/components/ui/LoadingSpinner.js
import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 'default', text = 'Загрузка...', fullScreen = true }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  const textSizeClasses = {
    small: 'text-sm',
    default: 'text-base',
    large: 'text-lg',
  };

  const Container = fullScreen ? FullScreenContainer : InlineContainer;

  return (
    <Container>
      <div className="flex flex-col items-center justify-center space-y-4">
        {/* Animated Spinner */}
        <motion.div
          className="relative"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <div className={`${sizeClasses[size]} border-4 border-gray-600 rounded-full`}>
            <div className={`${sizeClasses[size]} border-4 border-transparent border-t-primary-500 rounded-full`} />
          </div>
        </motion.div>

        {/* Loading Text */}
        {text && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`${textSizeClasses[size]} text-gray-400 font-medium`}
          >
            {text}
          </motion.p>
        )}

        {/* Animated Dots */}
        <div className="flex space-x-1">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-2 h-2 bg-primary-500 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: index * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </Container>
  );
};

// Full screen container
const FullScreenContainer = ({ children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm">
    {children}
  </div>
);

// Inline container
const InlineContainer = ({ children }) => (
  <div className="flex items-center justify-center p-8">
    {children}
  </div>
);

// Mini spinner for buttons
export const MiniSpinner = ({ className = '' }) => (
  <motion.div
    className={`w-4 h-4 border-2 border-white/30 border-t-white rounded-full ${className}`}
    animate={{ rotate: 360 }}
    transition={{
      duration: 0.8,
      repeat: Infinity,
      ease: "linear"
    }}
  />
);

// Page transition spinner
export const PageSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <LoadingSpinner size="large" text="Загрузка страницы..." fullScreen={false} />
  </div>
);

export default LoadingSpinner;