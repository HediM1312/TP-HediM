"use client"

import type { AppProps } from 'next/app';
import { AppProvider, useAuth } from '@/context/AppContext';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AppProvider>
      <AuthWrapper>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </AuthWrapper>
    </AppProvider>
  );
}

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { auth, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const publicPaths = ['/login', '/register'];
    const isPublicPath = publicPaths.includes(router.pathname);

    if (!auth.isAuthenticated && !isPublicPath) {
      router.push('/login');
    } else if (auth.isAuthenticated && isPublicPath) {
      router.push('/');
    }
  }, [auth.isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default MyApp;