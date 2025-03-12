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
  updateUserInContext: (updatedUser: User) => void;
  refreshUserData: () => Promise<void>; // Nouvelle fonction pour rafraîchir les données
}

const defaultAuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  loading: true,
  updateUserInContext: () => {},
  refreshUserData: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuthState);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fonction pour mettre à jour les données utilisateur
  const updateUserInContext = (updatedUser: User) => {
    setUser(updatedUser);
  };

  // Fonction pour rafraîchir les données utilisateur depuis le serveur
  const refreshUserData = async () => {
    try {
      if (isAuthenticated) {
        const userData = await getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des données utilisateur:', error);
    }
  };

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
            
            // S'assurer que toutes les données sont bien présentes
            if (userData) {
              console.log('Profile picture ID:', userData.profile_picture_id);
              console.log('Banner picture ID:', userData.banner_picture_id);
              console.log('Bio:', userData.bio);
            }
            
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
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isAuthenticated, 
      login, 
      logout, 
      loading, 
      updateUserInContext,
      refreshUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
};