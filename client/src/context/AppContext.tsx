'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';
import { getCurrentUser } from '@/services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const defaultAuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  loading: true
};

const AuthContext = createContext<AuthContextType>(defaultAuthState);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Vérifier si un token existe dans le localStorage
        const storedToken = localStorage.getItem('token');
        console.log('Token au chargement:', storedToken);
        
        if (storedToken) {
          try {
            // Récupérer les informations utilisateur
            console.log('Tentative de récupération des informations utilisateur...');
            const userData = await getCurrentUser();
            console.log('Informations utilisateur récupérées:', userData);
            
            setUser(userData);
            setToken(storedToken);
            setIsAuthenticated(true);
          } catch (userError) {
            console.error('Erreur lors de la récupération des informations utilisateur:', userError);
            // Token invalide ou expiré
            localStorage.removeItem('token');
          }
        }
      } catch (error) {
        // En cas d'erreur, réinitialiser l'état
        console.error('Auth initialization error:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('token', newToken);
    setUser(userData);
    setToken(newToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};