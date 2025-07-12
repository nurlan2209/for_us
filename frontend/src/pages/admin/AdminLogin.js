// frontend/src/pages/admin/AdminLogin.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const loginSchema = z.object({
  username: z.string().min(1, 'Username required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const AdminLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || '/admin';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, from]);

  const onSubmit = async (data) => {
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      setError('root', { message });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-neutral-600">Checking authentication...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-neutral-600">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8">
            <h1 className="text-2xl font-light text-neutral-900 mb-2">
              Admin Login
            </h1>
            <p className="text-sm text-neutral-600">
              Sign in to manage your portfolio
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Global Error */}
            {errors.root && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {errors.root.message}
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-neutral-900 mb-2 uppercase tracking-wide">
                Username
              </label>
              <input
                {...register('username')}
                type="text"
                className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:border-neutral-500 transition-colors"
                placeholder="admin"
              />
              {errors.username && (
                <p className="text-xs text-red-600 mt-1">{errors.username.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-neutral-900 mb-2 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:border-neutral-500 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-neutral-900 text-white py-2 px-4 rounded text-sm font-medium hover:bg-neutral-800 disabled:bg-neutral-400 transition-colors"
            >
              {isSubmitting ? 'Signing in...' : 'SIGN IN'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 p-4 bg-neutral-50 rounded">
            <div className="text-xs text-neutral-600 mb-2">Demo credentials:</div>
            <div className="text-xs font-mono">admin / admin123</div>
          </div>

          {/* Back link */}
          <div className="mt-8">
            <Link
              to="/"
              className="text-xs text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              ← Back to site
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex flex-1 bg-neutral-100 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-neutral-900 rounded-full mx-auto mb-6 flex items-center justify-center">
            <div className="text-white text-2xl font-light">A</div>
          </div>
          <h2 className="text-lg font-light text-neutral-900 mb-2">
            Portfolio Admin
          </h2>
          <p className="text-sm text-neutral-600 max-w-xs">
            Manage your projects, content, and settings from this admin panel.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLogin;