// frontend/src/components/ui/ProjectCursor.js
import React, { useState, useEffect, useCallback } from 'react';

// Простое глобальное состояние без частых обновлений
let cursorState = {
  show: false,
  title: '',
  textColor: 'light',
  x: 0,
  y: 0
};

let updateCallback = null;

// Функция для обновления курсора из 3D компонентов
window.updateProjectCursor = (updates) => {
  Object.assign(cursorState, updates);
  if (updateCallback) {
    updateCallback(cursorState);
  }
};

const ProjectCursor = () => {
  const [state, setState] = useState(cursorState);

  // Мемоизированный callback для обновления состояния
  const updateState = useCallback((newState) => {
    setState({ ...newState });
  }, []);

  useEffect(() => {
    // Регистрируем callback для обновлений из 3D компонентов
    updateCallback = updateState;
    
    // Обработчик движения мыши - только если курсор активен
    const handleMouseMove = (e) => {
      if (cursorState.show) {
        cursorState.x = e.clientX;
        cursorState.y = e.clientY;
        setState(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
      }
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      updateCallback = null;
    };
  }, [updateState]);

  // Не рендерим, если курсор не активен
  if (!state.show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: state.x + 15,
        top: state.y - 30,
        zIndex: 10000,
        pointerEvents: 'none',
        backgroundColor: state.textColor === 'dark' 
          ? 'rgba(255, 255, 255, 0.95)' 
          : 'rgba(0, 0, 0, 0.85)',
        color: state.textColor === 'dark' ? '#000000' : '#ffffff',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        fontFamily: 'Inter, system-ui, sans-serif',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(8px)',
        border: `1px solid ${state.textColor === 'dark' 
          ? 'rgba(0, 0, 0, 0.2)' 
          : 'rgba(255, 255, 255, 0.2)'}`,
        transition: 'opacity 0.2s ease',
        transform: 'translate3d(0, 0, 0)',
        willChange: 'transform',
        whiteSpace: 'nowrap',
      }}
    >
      {state.title}
    </div>
  );
};

export default ProjectCursor;