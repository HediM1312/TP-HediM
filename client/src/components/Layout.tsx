'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FiHome, FiUser, FiBell, FiLogOut } from 'react-icons/fi';
import { useAuth } from '@/context/AppContext';
import { motion } from 'framer-motion';

// Changez l'export pour un export par défaut
export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  const sidebarLinks = [
    {
      icon: FiHome,
      label: 'Accueil',
      href: '/',
    },
    {
      icon: FiBell,
      label: 'Notifications',
      href: '/notification',
    },
    {
      icon: FiUser,
      label: 'Profil',
      href: `/profile/${user?.username}`,
    },
  ];

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <div className="fixed h-screen w-64 bg-gray-900 border-r border-gray-800">
        <div className="flex flex-col h-full p-4">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-purple-500">Twitter Clone</h1>
          </div>

          <nav className="flex-1">
            <ul className="space-y-2">
              {sidebarLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;

                return (
                  <motion.li
                    key={link.href}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href={link.href}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-full transition-colors ${
                        isActive
                          ? 'bg-purple-500 text-white'
                          : 'text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="font-medium">{link.label}</span>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-gray-800 pt-4">
            <div className="flex items-center space-x-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{user?.username}</p>
                <p className="text-gray-400 text-sm">@{user?.username}</p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => logout()}
              className="w-full mt-2 flex items-center space-x-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
            >
              <FiLogOut className="w-6 h-6" />
              <span className="font-medium">Déconnexion</span>
            </motion.button>
          </div>
        </div>
      </div>
      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  );
}