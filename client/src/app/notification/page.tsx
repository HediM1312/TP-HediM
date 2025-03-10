'use client';

import React, { useEffect } from 'react';
import { NotificationsPage } from '@/components/NotificationComponents';
import { useAuth } from '@/context/AppContext';
import { redirect } from 'next/navigation';
import Layout from '@/components/Layout';

export default function Notifications() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    // Rediriger si non authentifié
    if (!authLoading && !isAuthenticated) {
      redirect('/login');
    }
  }, [isAuthenticated, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <NotificationsPage />
    </Layout>
  );
}