// frontend/src/App.js - Оптимизированная версия
import React, { Suspense, memo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { motion } from 'framer-motion';

// Компоненты (не ленивые)
import Navbar from './components/ui/Navbar';
import ProjectCursor from './components/ui/ProjectCursor';
import ScrollToTop from './components/ui/ScrollToTop';

// Ленивая загрузка страниц
const Portfolio = React.lazy(() => import('./pages/Portfolio'));
const ProjectDetail = React.lazy(() => import('./pages/ProjectDetail'));
const Studio = React.lazy(() => import('./pages/Studio'));
const Contact = React.lazy(() => import('./pages/Contact'));
const AdminLogin = React.lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProjects = React.lazy(() => import('./pages/admin/AdminProjects'));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings'));
const AdminStudioSettings = React.lazy(() => import('./pages/admin/AdminStudioSettings'));
const ProtectedRoute = React.lazy(() => import('./components/auth/ProtectedRoute'));

// Оптимизированный QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      suspense: false,
    },
    mutations: { retry: 0 },
  },
});

// Мемоизированный лоадер
const SmoothLoader = memo(({ text = "Loading..." }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="min-h-screen bg-white flex items-center justify-center"
  >
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-neutral-600 text-sm">{text}</p>
    </div>
  </motion.div>
));

// Мемоизированный переход
const PageTransition = memo(({ children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    style={{ minHeight: '100vh' }}
  >
    {children}
  </motion.div>
));

// Мемоизированные макеты
const MainLayout = memo(({ children }) => (
  <>
    <Navbar />
    <main className="flex-1 relative">{children}</main>
  </>
));

const AdminLayout = memo(({ children }) => (
  <div className="min-h-screen bg-gray-900">{children}</div>
));

// Вспомогательный компонент для роутов
const LazyRoute = memo(({ component: Component, fallbackText, layout: Layout = MainLayout, ...props }) => (
  <Layout>
    <Suspense fallback={<SmoothLoader text={fallbackText} />}>
      <PageTransition>
        <Component {...props} />
      </PageTransition>
    </Suspense>
  </Layout>
));

// 404 страница
const NotFound = memo(() => (
  <div className="min-h-screen flex items-center justify-center bg-white pt-20">
    <div className="text-center px-6">
      <h1 className="text-8xl lg:text-9xl font-light text-neutral-200 mb-4">404</h1>
      <h2 className="text-3xl lg:text-4xl font-light text-neutral-900 tracking-tight mb-4">
        PAGE NOT FOUND
      </h2>
      <p className="text-lg text-neutral-600 mb-8 max-w-md mx-auto leading-relaxed">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="/" className="catalog-button-unveil catalog-button-primary">GO HOME</a>
        <a href="/portfolio" className="catalog-button-unveil">VIEW PROJECTS</a>
      </div>
    </div>
  </div>
));

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
              <Route path="/" element={<LazyRoute component={Portfolio} />} />
              <Route path="/portfolio/:id" element={<LazyRoute component={ProjectDetail} fallbackText="Loading project..." />} />
              <Route path="/studio" element={<LazyRoute component={Studio} fallbackText="Loading studio..." />} />
              <Route path="/contact" element={<LazyRoute component={Contact} fallbackText="Loading contact..." />} />

              {/* Админ маршруты */}
              <Route path="/admin/login" element={
                <Suspense fallback={<SmoothLoader text="Loading admin..." />}>
                  <PageTransition><AdminLogin /></PageTransition>
                </Suspense>
              } />
              
              <Route path="/admin" element={
                <Suspense fallback={<SmoothLoader text="Loading dashboard..." />}>
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <PageTransition><AdminDashboard /></PageTransition>
                    </AdminLayout>
                  </ProtectedRoute>
                </Suspense>
              } />
              
              <Route path="/admin/projects" element={
                <Suspense fallback={<SmoothLoader text="Loading projects..." />}>
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <PageTransition><AdminProjects /></PageTransition>
                    </AdminLayout>
                  </ProtectedRoute>
                </Suspense>
              } />
              
              <Route path="/admin/settings" element={
                <Suspense fallback={<SmoothLoader text="Loading settings..." />}>
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <PageTransition><AdminSettings /></PageTransition>
                    </AdminLayout>
                  </ProtectedRoute>
                </Suspense>
              } />

              <Route path="/admin/studio" element={
                <Suspense fallback={<SmoothLoader text="Loading studio settings..." />}>
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <PageTransition><AdminStudioSettings /></PageTransition>
                    </AdminLayout>
                  </ProtectedRoute>
                </Suspense>
              } />

              <Route path="*" element={
                <MainLayout>
                  <PageTransition><NotFound /></PageTransition>
                </MainLayout>
              } />
            </Routes>

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
                success: { style: { border: '1px solid #00d4aa', color: '#00d4aa' } },
                error: { style: { border: '1px solid #ef4444', color: '#ef4444' } },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;