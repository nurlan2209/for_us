// frontend/src/components/3d/index.js
// Файл для удобного импорта всех 3D компонентов

export { default as ProjectCard3D, ProjectGrid3D, ProjectCarousel3D, ProjectSpiral3D } from './ProjectCard3D';
export { ProjectCatalog3D } from './ProjectCatalog3D'; // ✅ ИСПРАВЛЕНО - named export
export { default as Scene3D, HeroScene, PortfolioScene } from './Scene';