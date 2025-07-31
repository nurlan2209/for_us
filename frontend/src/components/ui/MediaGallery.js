// frontend/src/components/ui/MediaGallery.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MediaGallery = ({ mediaFiles = [], projectTitle = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);

  // ✅ ИСПРАВЛЕНИЕ 1: Улучшенная функция определения типа медиа
  const getMediaType = (mediaFile) => {
    if (!mediaFile || !mediaFile.url) return 'image';
    
    // Проверяем тип из объекта медиафайла
    if (mediaFile.type) {
      return mediaFile.type;
    }
    
    // Определяем по расширению файла
    const url = mediaFile.url.toLowerCase();
    if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || url.includes('.avi')) {
      return 'video';
    }
    if (url.includes('.gif')) {
      return 'gif';
    }
    return 'image';
  };

  // ✅ ИСПРАВЛЕНИЕ 2: Проверка валидности URL
  const isValidVideoUrl = (url) => {
    if (!url) return false;
    
    try {
      const urlObj = new URL(url);
      // Проверяем, что это HTTP/HTTPS URL
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Навигация
  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % mediaFiles.length);
    setIsPlaying(false);
    setVideoError(false);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + mediaFiles.length) % mediaFiles.length);
    setIsPlaying(false);
    setVideoError(false);
  };

  // ✅ ИСПРАВЛЕНИЕ 3: Улучшенная обработка видео
  useEffect(() => {
    if (mediaFiles.length > 0 && videoRef.current) {
      const currentMedia = mediaFiles[currentIndex];
      const mediaType = getMediaType(currentMedia);
      
      if (mediaType === 'video' && isValidVideoUrl(currentMedia.url)) {
        const video = videoRef.current;
        
        // Сброс ошибок
        setVideoError(false);
        
        // Обработчики событий
        const handleLoadedData = () => {
          console.log('✅ Video loaded successfully:', currentMedia.url);
          if (isPlaying) {
            video.play().catch(err => {
              console.error('❌ Video play error:', err);
              setVideoError(true);
            });
          }
        };

        const handleError = (e) => {
          console.error('❌ Video error:', e, 'URL:', currentMedia.url);
          setVideoError(true);
          setIsPlaying(false);
        };

        const handleCanPlay = () => {
          console.log('✅ Video can play:', currentMedia.url);
        };

        // Добавляем обработчики
        video.addEventListener('loadeddata', handleLoadedData);
        video.addEventListener('error', handleError);
        video.addEventListener('canplay', handleCanPlay);
        
        // Загружаем видео
        video.load();

        // Очистка
        return () => {
          video.removeEventListener('loadeddata', handleLoadedData);
          video.removeEventListener('error', handleError);
          video.removeEventListener('canplay', handleCanPlay);
        };
      }
    }
  }, [currentIndex, mediaFiles]);

  // ✅ ИСПРАВЛЕНИЕ 4: Обработка воспроизведения
  useEffect(() => {
    if (mediaFiles.length > 0 && videoRef.current) {
      const currentMedia = mediaFiles[currentIndex];
      const mediaType = getMediaType(currentMedia);
      
      if (mediaType === 'video' && !videoError) {
        const video = videoRef.current;
        
        if (isPlaying) {
          video.play().catch(err => {
            console.error('❌ Play error:', err);
            setVideoError(true);
            setIsPlaying(false);
          });
        } else {
          video.pause();
        }
      }
    }
  }, [isPlaying, currentIndex, mediaFiles, videoError]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isFullscreen && mediaFiles.length > 0) {
        const currentMedia = mediaFiles[currentIndex];
        const mediaType = getMediaType(currentMedia);
        
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            goToPrevious();
            break;
          case 'ArrowRight':
            e.preventDefault();
            goToNext();
            break;
          case 'Escape':
            e.preventDefault();
            setIsFullscreen(false);
            break;
          case ' ':
            e.preventDefault();
            if (mediaType === 'video' && !videoError) {
              setIsPlaying(!isPlaying);
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, isPlaying, currentIndex, mediaFiles, videoError]);

  // Early return after all hooks
  if (!mediaFiles || mediaFiles.length === 0) {
    return null;
  }

  const currentMedia = mediaFiles[currentIndex];
  const currentMediaType = getMediaType(currentMedia);

  // ✅ ИСПРАВЛЕНИЕ 5: Улучшенный рендер медиа элемента
  const renderMedia = (media, className = '', isMainView = false) => {
    const mediaType = getMediaType(media);

    // Проверяем валидность URL
    if (!media.url) {
      return (
        <div className={`${className} bg-gray-200 flex items-center justify-center`}>
          <span className="text-gray-500">No media URL</span>
        </div>
      );
    }

    switch (mediaType) {
      case 'video':
        if (!isValidVideoUrl(media.url)) {
          return (
            <div className={`${className} bg-gray-200 flex items-center justify-center`}>
              <span className="text-gray-500">Invalid video URL</span>
            </div>
          );
        }

        return (
          <video
            ref={isMainView ? videoRef : null}
            className={className}
            controls={isMainView}
            loop
            muted={!isMainView}
            playsInline
            preload="metadata"
            poster={media.thumbnail}
            onError={(e) => {
              console.error('❌ Video render error:', e, 'URL:', media.url);
              if (isMainView) {
                setVideoError(true);
              }
            }}
            onLoadStart={() => {
              console.log('🔄 Video loading started:', media.url);
            }}
            onLoadedData={() => {
              console.log('✅ Video loaded data:', media.url);
              if (isMainView) {
                setVideoError(false);
              }
            }}
          >
            <source src={media.url} type={`video/${media.url.split('.').pop()}`} />
            <p>Your browser doesn't support HTML video. Here is a <a href={media.url}>link to the video</a> instead.</p>
          </video>
        );

      case 'gif':
        return (
          <img
            src={media.url}
            alt={media.alt || `${projectTitle} - Media ${media.id}`}
            className={className}
            loading="lazy"
            onError={(e) => {
              console.error('❌ GIF load error:', e, 'URL:', media.url);
            }}
          />
        );

      default:
        return (
          <img
            src={media.url}
            alt={media.alt || `${projectTitle} - Media ${media.id}`}
            className={className}
            loading="lazy"
            onError={(e) => {
              console.error('❌ Image load error:', e, 'URL:', media.url);
            }}
          />
        );
    }
  };

  return (
    <>
      {/* Main Gallery */}
      <section className="py-16 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          
          {/* Main Media Display */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative mb-8"
          >
            <div 
              className="relative aspect-video bg-neutral-100 rounded-2xl overflow-hidden shadow-card border border-neutral-200 cursor-pointer group"
              onClick={() => setIsFullscreen(true)}
            >
              {/* ✅ ИСПРАВЛЕНИЕ 6: Показываем ошибку видео */}
              {videoError && currentMediaType === 'video' ? (
                <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center">
                  <div className="text-center p-8">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Video Error</h3>
                    <p className="text-gray-600 mb-4">Unable to load video file</p>
                    <p className="text-xs text-gray-500 break-all">{currentMedia.url}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setVideoError(false);
                        if (videoRef.current) {
                          videoRef.current.load();
                        }
                      }}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : (
                renderMedia(
                  currentMedia,
                  "w-full h-full object-cover transition-transform duration-300 group-hover:scale-105",
                  true
                )
              )}

              {/* Overlay Controls */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ opacity: 1, scale: 1 }}
                  className="bg-white/90 backdrop-blur-sm p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                  <svg className="w-6 h-6 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </motion.div>
              </div>

              {/* Media Counter */}
              <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                {currentIndex + 1} / {mediaFiles.length}
              </div>

              {/* Navigation Arrows */}
              {mediaFiles.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goToPrevious();
                    }}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm text-neutral-900 p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white transition-all duration-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goToNext();
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm text-neutral-900 p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white transition-all duration-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </motion.div>

          {/* Thumbnails */}
          {mediaFiles.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex gap-4 justify-center flex-wrap"
            >
              {mediaFiles.map((media, index) => (
                <button
                  key={media.id || index}
                  onClick={() => {
                    setCurrentIndex(index);
                    setIsPlaying(false);
                    setVideoError(false);
                  }}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                    index === currentIndex
                      ? 'border-neutral-900 scale-105 shadow-lg'
                      : 'border-neutral-200 hover:border-neutral-400 hover:scale-102'
                  }`}
                >
                  {renderMedia(media, "w-full h-full object-cover")}
                  
                  {/* Video/GIF Indicator */}
                  {getMediaType(media) !== 'image' && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="bg-white/90 rounded-full p-1">
                        {getMediaType(media) === 'video' ? (
                          <svg className="w-3 h-3 text-neutral-900" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        ) : (
                          <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onClick={() => setIsFullscreen(false)}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-6 right-6 z-60 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Main Media */}
            <div className="max-w-[90vw] max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
              {videoError && currentMediaType === 'video' ? (
                <div className="bg-gray-800 text-white p-8 rounded-lg text-center">
                  <h3 className="text-xl mb-4">Video Error</h3>
                  <p className="mb-4">Unable to load video in fullscreen</p>
                  <button
                    onClick={() => setVideoError(false)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                renderMedia(
                  currentMedia,
                  "max-w-full max-h-full object-contain",
                  true
                )
              )}

              {/* Fullscreen Navigation */}
              {mediaFiles.length > 1 && (
                <>
                  <button
                    onClick={goToPrevious}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <button
                    onClick={goToNext}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Counter and Info */}
            <div className="absolute bottom-6 left-6 text-white">
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="text-sm font-medium">
                  {currentIndex + 1} / {mediaFiles.length}
                </span>
                {currentMedia.caption && (
                  <span className="ml-3 text-sm opacity-80">
                    {currentMedia.caption}
                  </span>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-6 right-6 text-white text-sm opacity-60">
              <div className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg">
                Press ESC to close • Arrow keys to navigate
                {currentMediaType === 'video' && !videoError && ' • Space to play/pause'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MediaGallery;