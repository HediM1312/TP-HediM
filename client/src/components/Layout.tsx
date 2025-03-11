'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AppContext';
import { usePathname, useRouter } from 'next/navigation';
import { FaHome, FaUser, FaSignOutAlt, FaBell, FaCamera } from 'react-icons/fa';
import WebcamCapture from './WebcamCapture';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showWebcam, setShowWebcam] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleImageCaptured = (imageData: string) => {
    console.log('Image capturée avec succès');
  };

  if (!isAuthenticated) {
    return <div className="container mx-auto max-w-lg p-4">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 min-h-screen">
          {/* Sidebar */}
          <div className="md:col-span-1 border-r border-extralight p-4">
            <div className="sticky top-0">
              <div className="flex flex-col space-y-6">
                <Link href="/" className="text-2xl font-bold text-primary">
                  Twitter Clone
                </Link>
                <nav className="flex flex-col space-y-4">
                  <Link href="/" className={`flex items-center space-x-3 p-2 rounded-full hover:bg-gray-100 text-lg ${pathname === '/' ? 'font-bold' : ''}`}>
                    <FaHome />
                    <span>Accueil</span>
                  </Link>
                  {user && (
                    <Link href={`/profile/${user.username}`} className={`flex items-center space-x-3 p-2 rounded-full hover:bg-gray-100 text-lg ${pathname.startsWith('/profile') ? 'font-bold' : ''}`}>
                      <FaUser />
                      <span>Profil</span>
                    </Link>
                  )}
                  <Link href="/notification" className={`flex items-center space-x-3 p-2 rounded-full hover:bg-gray-100 text-lg ${pathname.startsWith('/notification') ? 'font-bold' : ''}`}>
                    <FaBell />
                    <span>Notifications</span>
                  </Link>
                  <button 
                    onClick={() => setShowWebcam(!showWebcam)} 
                    className={`flex items-center space-x-3 p-2 rounded-full hover:bg-gray-100 text-lg text-left ${showWebcam ? 'bg-gray-100 font-bold' : ''}`}
                  >
                    <FaCamera />
                    <span>Caméra</span>
                  </button>
                  <button onClick={handleLogout} className="flex items-center space-x-3 p-2 rounded-full hover:bg-gray-100 text-lg text-left">
                    <FaSignOutAlt />
                    <span>Déconnexion</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {/* Main content */}
          <main className="md:col-span-3 border-l border-extralight">
            {showWebcam && (
              <div className="border-b border-extralight p-4">
                <h2 className="text-xl font-bold mb-4">Caméra</h2>
                <WebcamCapture onImageCaptured={handleImageCaptured} />
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}