// frontend/src/App.js - Обновленная версия без About
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Portfolio from './pages/Portfolio';
import ProjectDetail from './pages/ProjectDetail';
import Contact from './pages/Contact';

// Admin pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProjects from './pages/admin/AdminProjects';
import AdminSettings from './pages/admin/AdminSettings';

// Components
import Navbar from './components/ui/Navbar';
import ProjectCursor from './components/ui/ProjectCursor';
import ScrollToTop from './components/ui/ScrollToTop';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Create QueryClient with unveil.fr optimizations
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 10 * 60 * 1000, // 10 minutes
      cacheTime: 15 * 60 * 1000, // 15 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-white text-neutral-900">
            <ScrollToTop />

            {/* Global 3D Project Cursor */}
            <ProjectCursor />

            <Routes>
              {/* Public routes */}
              <Route path="/" element={<MainLayout><Portfolio /></MainLayout>} />
              <Route path="/portfolio/:id" element={<MainLayout><ProjectDetail /></MainLayout>} />
              <Route path="/studio" element={<MainLayout><StudioPage /></MainLayout>} />
              <Route path="/contact" element={<MainLayout><Contact /></MainLayout>} />

              {/* Admin routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout><AdminDashboard /></AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/projects"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout><AdminProjects /></AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout><AdminSettings /></AdminLayout>
                  </ProtectedRoute>
                }
              />

              {/* 404 page */}
              <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
            </Routes>

            {/* Global Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#ffffff',
                  color: '#18181b',
                  border: '1px solid #e4e4e7',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                },
                success: {
                  style: {
                    border: '1px solid #00d4aa',
                    color: '#00d4aa',
                  },
                  iconTheme: {
                    primary: '#00d4aa',
                    secondary: '#ffffff',
                  },
                },
                error: {
                  style: {
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                  },
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#ffffff',
                  },
                },
                loading: {
                  style: {
                    border: '1px solid #0066ff',
                    color: '#0066ff',
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

// Main layout for public pages
function MainLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="flex-1 relative">
        <React.Suspense 
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
              <LoadingSpinner text="Loading..." />
            </div>
          }
        >
          {children}
        </React.Suspense>
      </main>
    </>
  );
}

// Admin layout
function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-800">
      <React.Suspense 
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <LoadingSpinner text="Loading admin panel..." />
          </div>
        }
      >
        {children}
      </React.Suspense>
    </div>
  );
}

// Placeholder Studio page (минималистичная как Contact)
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

// 404 Not Found component
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
          <a
            href="/"
            className="catalog-button-unveil catalog-button-primary"
          >
            GO HOME
          </a>
          <a
            href="/portfolio"
            className="catalog-button-unveil"
          >
            VIEW PROJECTS
          </a>
        </div>
        
        {/* Decorative elements */}
        <div className="mt-16 flex justify-center space-x-8 opacity-30">
          <div className="w-2 h-2 bg-neutral-300 rounded-full"></div>
          <div className="w-2 h-2 bg-neutral-300 rounded-full"></div>
          <div className="w-2 h-2 bg-neutral-300 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

export default App;