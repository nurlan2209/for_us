// frontend/src/components/ui/LoadingSpinner.js - Оптимизированная версия
import React from 'react';
import { motion } from 'framer-motion';

// Основной загрузочный компонент без черного фона
const LoadingSpinner = ({ size = 'default', text = 'Loading...', fullScreen = false, background = 'white' }) => {
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

  const bgClasses = {
    white: 'bg-white',
    transparent: 'bg-transparent',
    gray: 'bg-gray-50'
  };

  const Container = fullScreen ? FullScreenContainer : InlineContainer;

  return (
    <Container background={background}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center space-y-4"
      >
        {/* Минималистичный спиннер */}
        <motion.div
          className="relative"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <div className={`${sizeClasses[size]} border-2 border-neutral-200 rounded-full`}>
            <div className={`${sizeClasses[size]} border-2 border-transparent border-t-neutral-600 rounded-full`} />
          </div>
        </motion.div>

        {/* Текст загрузки */}
        {text && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`${textSizeClasses[size]} text-neutral-600 font-medium`}
          >
            {text}
          </motion.p>
        )}
      </motion.div>
    </Container>
  );
};

// Полноэкранный контейнер с белым фоном
const FullScreenContainer = ({ children, background = 'white' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    className={`fixed inset-0 z-50 flex items-center justify-center ${
      background === 'white' ? 'bg-white' : 
      background === 'gray' ? 'bg-gray-50' : 
      'bg-transparent'
    }`}
  >
    {children}
  </motion.div>
);

// Встроенный контейнер
const InlineContainer = ({ children, background = 'transparent' }) => (
  <div className={`flex items-center justify-center p-8 ${
    background === 'white' ? 'bg-white' : 
    background === 'gray' ? 'bg-gray-50' : 
    'bg-transparent'
  }`}>
    {children}
  </div>
);

// Мини спиннер для кнопок
export const MiniSpinner = ({ className = '', color = 'white' }) => (
  <motion.div
    className={`w-4 h-4 border-2 ${
      color === 'white' ? 'border-white/30 border-t-white' :
      color === 'dark' ? 'border-neutral-300 border-t-neutral-600' :
      'border-neutral-300 border-t-neutral-600'
    } rounded-full ${className}`}
    animate={{ rotate: 360 }}
    transition={{
      duration: 0.8,
      repeat: Infinity,
      ease: "linear"
    }}
  />
);

// Спиннер для переходов страниц
export const PageSpinner = ({ text = "Loading page..." }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
    className="min-h-screen bg-white flex items-center justify-center"
  >
    <LoadingSpinner size="large" text={text} fullScreen={false} background="transparent" />
  </motion.div>
);

// Скелетный лоадер для карточек
export const SkeletonCard = ({ className = '' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className={`animate-pulse ${className}`}
  >
    <div className="bg-neutral-200 rounded-lg h-48 mb-4"></div>
    <div className="space-y-3">
      <div className="bg-neutral-200 rounded h-4 w-3/4"></div>
      <div className="bg-neutral-200 rounded h-4 w-1/2"></div>
      <div className="bg-neutral-200 rounded h-4 w-2/3"></div>
    </div>
  </motion.div>
);

// Скелетный лоадер для списков
export const SkeletonList = ({ items = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: items }).map((_, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="animate-pulse flex items-center space-x-4"
      >
        <div className="bg-neutral-200 rounded-full h-12 w-12"></div>
        <div className="flex-1 space-y-2">
          <div className="bg-neutral-200 rounded h-4 w-3/4"></div>
          <div className="bg-neutral-200 rounded h-4 w-1/2"></div>
        </div>
      </motion.div>
    ))}
  </div>
);

// Плавный переход между состояниями загрузки
export const LoadingStateWrapper = ({ 
  isLoading, 
  error, 
  children, 
  loadingComponent = <LoadingSpinner />,
  errorComponent = null 
}) => {
  if (error && errorComponent) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {errorComponent}
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {loadingComponent}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

export default LoadingSpinner;