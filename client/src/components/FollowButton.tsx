'use client';

import React, { useState, useEffect } from 'react';
import { followUser, unfollowUser, checkFollowStatus } from '@/services/api';
import { useAuth } from '@/context/AppContext';

interface FollowButtonProps {
  username: string;
  onFollowChange?: (following: boolean) => void;
}

const FollowButton: React.FC<FollowButtonProps> = ({ username, onFollowChange }) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Vérifier le statut initial
  useEffect(() => {
    const checkFollowing = async () => {
      try {
        if (user && user.username !== username) {
          const status = await checkFollowStatus(username);
          setIsFollowing(status.following);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut de suivi:', error);
      }
    };

    checkFollowing();
  }, [username, user]);

  // Si c'est le profil de l'utilisateur connecté, ne pas afficher le bouton
  if (!user || user.username === username) {
    return null;
  }

  const handleFollowToggle = async () => {
    setIsLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(username);
      } else {
        await followUser(username);
      }
      setIsFollowing(!isFollowing);
      
      if (onFollowChange) {
        onFollowChange(!isFollowing);
      }
    } catch (error) {
      console.error('Erreur lors du changement de statut de suivi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollowToggle}
      disabled={isLoading}
      className={`px-4 py-2 rounded-full font-medium transition-colors ${
        isFollowing
          ? 'bg-transparent border border-purple-500 text-purple-500 hover:bg-purple-500/10'
          : 'bg-purple-500 text-white hover:bg-purple-600'
      }`}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>{isFollowing ? 'Désabonnement...' : 'Abonnement...'}</span>
        </span>
      ) : (
        <span>{isFollowing ? 'Abonné' : 'S\'abonner'}</span>
      )}
    </button>
  );
};

export default FollowButton;