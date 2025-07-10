// frontend/src/App.js
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
import About from './pages/About';
import Contact from './pages/Contact';

// Admin pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProjects from './pages/admin/AdminProjects';
import AdminSettings from './pages/admin/AdminSettings';

// Components
import Navbar from './components/ui/Navbar';
// УБРАЛИ Footer
import ScrollToTop from './components/ui/ScrollToTop';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Create a client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000, // 5 minutes
        },
    },
});

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <Router>
                    <div className="min-h-screen bg-gray-900 text-white">
                        <ScrollToTop />

                        <Routes>
                            {/* Public routes */}
                            <Route path="/" element={<MainLayout><Home /></MainLayout>} />
                            <Route path="/portfolio" element={<MainLayout><Portfolio /></MainLayout>} />
                            <Route path="/portfolio/:id" element={<MainLayout><ProjectDetail /></MainLayout>} />
                            <Route path="/about" element={<MainLayout><About /></MainLayout>} />
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

                        {/* Global components */}
                        <Toaster
                            position="top-right"
                            toastOptions={{
                                duration: 4000,
                                style: {
                                    background: '#1f2937',
                                    color: '#ffffff',
                                    border: '1px solid #374151',
                                },
                                success: {
                                    style: {
                                        border: '1px solid #10b981',
                                    },
                                },
                                error: {
                                    style: {
                                        border: '1px solid #ef4444',
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

// Main layout БЕЗ footer
function MainLayout({ children }) {
    return (
        <>
            <Navbar />
            <main className="flex-1">
                <React.Suspense fallback={<LoadingSpinner />}>
                    {children}
                </React.Suspense>
            </main>
            {/* УБРАЛИ <Footer /> */}
        </>
    );
}

// Admin layout без main navbar
function AdminLayout({ children }) {
    return (
        <div className="min-h-screen bg-gray-800">
            <React.Suspense fallback={<LoadingSpinner />}>
                {children}
            </React.Suspense>
        </div>
    );
}

// 404 component
function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-primary-500 mb-4">404</h1>
                <p className="text-xl text-gray-400 mb-8">Страница не найдена</p>
                <a
                    href="/"
                    className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg transition-colors"
                >
                    На главную
                </a>
            </div>
        </div>
    );
}

export default App;