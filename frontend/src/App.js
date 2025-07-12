// frontend/src/App.js - Оптимизированная версия
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

// Компоненты
import Navbar from './components/ui/Navbar';
import ProjectCursor from './components/ui/ProjectCursor';
import ScrollToTop from './components/ui/ScrollToTop';

// Ленивая загрузка страниц
const Home = React.lazy(() => import('./pages/Home'));
const Portfolio = React.lazy(() => import('./pages/Portfolio'));
const ProjectDetail = React.lazy(() => import('./pages/ProjectDetail'));
const Contact = React.lazy(() => import('./pages/Contact'));
const AdminLogin = React.lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProjects = React.lazy(() => import('./pages/admin/AdminProjects'));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings'));
const ProtectedRoute = React.lazy(() => import('./components/auth/ProtectedRoute'));

// Оптимизированный QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      suspense: false, // Отключаем suspense для избежания белых экранов
    },
    mutations: {
      retry: 0,
    },
  },
});

// Компонент плавной загрузки без черного экрана
const SmoothLoader = ({ text = "Loading..." }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    className="min-h-screen bg-white flex items-center justify-center"
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="text-center"
    >
      <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-neutral-600 text-sm">{text}</p>
    </motion.div>
  </motion.div>
);

// Обертка для плавных переходов страниц
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }}
    style={{ minHeight: '100vh' }}
  >
    {children}
  </motion.div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-white text-neutral-900">
            <ScrollToTop />
            <ProjectCursor />

            <Routes>
              {/* Публичные маршруты */}
              <Route path="/" element={
                <MainLayout>
                  <Suspense fallback={<SmoothLoader />}>
                    <PageTransition>
                      <Portfolio />
                    </PageTransition>
                  </Suspense>
                </MainLayout>
              } />
              
              <Route path="/portfolio/:id" element={
                <MainLayout>
                  <Suspense fallback={<SmoothLoader text="Loading project..." />}>
                    <PageTransition>
                      <ProjectDetail />
                    </PageTransition>
                  </Suspense>
                </MainLayout>
              } />
              
              <Route path="/studio" element={
                <MainLayout>
                  <PageTransition>
                    <StudioPage />
                  </PageTransition>
                </MainLayout>
              } />
              
              <Route path="/contact" element={
                <MainLayout>
                  <Suspense fallback={<SmoothLoader text="Loading contact..." />}>
                    <PageTransition>
                      <Contact />
                    </PageTransition>
                  </Suspense>
                </MainLayout>
              } />

              {/* Админ маршруты */}
              <Route path="/admin/login" element={
                <Suspense fallback={<SmoothLoader text="Loading admin..." />}>
                  <PageTransition>
                    <AdminLogin />
                  </PageTransition>
                </Suspense>
              } />
              
              <Route path="/admin" element={
                <Suspense fallback={<SmoothLoader text="Loading dashboard..." />}>
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <PageTransition>
                        <AdminDashboard />
                      </PageTransition>
                    </AdminLayout>
                  </ProtectedRoute>
                </Suspense>
              } />
              
              <Route path="/admin/projects" element={
                <Suspense fallback={<SmoothLoader text="Loading projects..." />}>
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <PageTransition>
                        <AdminProjects />
                      </PageTransition>
                    </AdminLayout>
                  </ProtectedRoute>
                </Suspense>
              } />
              
              <Route path="/admin/settings" element={
                <Suspense fallback={<SmoothLoader text="Loading settings..." />}>
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <PageTransition>
                        <AdminSettings />
                      </PageTransition>
                    </AdminLayout>
                  </ProtectedRoute>
                </Suspense>
              } />

              {/* 404 */}
              <Route path="*" element={
                <MainLayout>
                  <PageTransition>
                    <NotFound />
                  </PageTransition>
                </MainLayout>
              } />
            </Routes>

            {/* Глобальные уведомления */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#ffffff',
                  color: '#18181b',
                  border: '1px solid #e4e4e7',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                },
                success: {
                  style: {
                    border: '1px solid #00d4aa',
                    color: '#00d4aa',
                  },
                },
                error: {
                  style: {
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Основной макет с предзагрузкой
function MainLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="flex-1 relative">
        {children}
      </main>
    </>
  );
}

// Админ макет
function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-900">
      {children}
    </div>
  );
}

// Студия страница
function StudioPage() {
  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center">
          <h1 className="text-5xl lg:text-7xl font-light text-neutral-900 tracking-tight mb-8">
            STUDIO
          </h1>
          <p className="text-lg text-neutral-600 leading-relaxed max-w-2xl mx-auto">
            Creative studio information will be here.
          </p>
        </div>
      </div>
    </div>
  );
}

// 404 страница
function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white pt-20">
      <div className="text-center px-6">
        <div className="mb-8">
          <h1 className="text-8xl lg:text-9xl font-light text-neutral-200 mb-4">
            404
          </h1>
          <h2 className="text-3xl lg:text-4xl font-light text-neutral-900 tracking-tight mb-4">
            PAGE NOT FOUND
          </h2>
          <p className="text-lg text-neutral-600 mb-8 max-w-md mx-auto leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/" className="catalog-button-unveil catalog-button-primary">
            GO HOME
          </a>
          <a href="/portfolio" className="catalog-button-unveil">
            VIEW PROJECTS
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;