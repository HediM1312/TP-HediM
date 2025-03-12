'use client';

import React, { useEffect, useState } from 'react';
import { getUserTweets, getUserStats } from '@/services/api';
import { Tweet } from '@/types';
import { TweetCard } from '@/components/TweetCard';
import { useAuth } from '@/context/AppContext';
import { redirect } from 'next/navigation';
import FollowButton from '@/components/FollowButton';
import FollowersList from '@/components/FollowersList';
import FollowingList from '@/components/FollowingList';

export default function ProfilePage({ params }: { params: { username: string } }) {
  const { username } = params;
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [userStats, setUserStats] = useState({ followers_count: 0, following_count: 0 });
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  useEffect(() => {
    // Rediriger si non authentifié
    if (!authLoading && !isAuthenticated) {
      redirect('/login');
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        // Récupérer les tweets
        const tweetsData = await getUserTweets(username);
        setTweets(tweetsData);
        
        // Récupérer les statistiques
        const stats = await getUserStats(username);
        setUserStats(stats);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Impossible de charger les données de cet utilisateur.');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && username) {
      fetchUserData();
    }
  }, [username, isAuthenticated, authLoading]);

  // Gérer le changement d'état du bouton suivre
  const handleFollowChange = (following: boolean) => {
    // Mettre à jour le compteur d'abonnés localement
    setUserStats(prev => ({
      ...prev,
      followers_count: following ? prev.followers_count + 1 : prev.followers_count - 1
    }));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="spinner w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="border-b border-gray-800">
        <div className="p-4">
          <h1 className="text-xl font-bold text-white">Profil</h1>
        </div>

        <div className="bg-gray-800 h-32"></div>

        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <div className="absolute -top-12 left-0">
              <div className="w-24 h-24 rounded-full bg-purple-500 border-4 border-gray-900 flex items-center justify-center">
                <span className="text-white font-bold text-4xl">
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            
            {/* Actions (suivre/ne plus suivre) */}
            <div className="absolute top-0 right-0">
              <FollowButton 
                username={username} 
                onFollowChange={handleFollowChange}
              />
            </div>
            
            <div className="pt-16">
              <h2 className="text-xl font-bold text-white">{username}</h2>
              <p className="text-gray-400">@{username}</p>
              
              {/* Statistiques */}
              <div className="mt-2 flex space-x-4">
                <button 
                  onClick={() => setShowFollowing(true)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <span className="text-white font-bold">{userStats.following_count}</span> abonnements
                </button>
                <button 
                  onClick={() => setShowFollowers(true)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <span className="text-white font-bold">{userStats.followers_count}</span> abonnés
                </button>
                <span className="text-gray-400">
                  <span className="text-white font-bold">{tweets.length}</span> tweets
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des tweets */}
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="spinner w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="p-4 text-red-500 text-center">{error}</div>
      ) : tweets.length > 0 ? (
        <div className="tweets-container">
          {tweets.map((tweet) => (
            <TweetCard key={tweet.id} tweet={tweet} />
          ))}
        </div>
      ) : (
        <div className="text-center p-8 text-gray-400">
          Cet utilisateur n'a pas encore tweeté.
        </div>
      )}

      {/* Modales pour les listes d'abonnés/abonnements */}
      <FollowersList 
        username={username} 
        isVisible={showFollowers} 
        onClose={() => setShowFollowers(false)} 
      />
      
      <FollowingList 
        username={username} 
        isVisible={showFollowing} 
        onClose={() => setShowFollowing(false)} 
      />
    </div>
  );
}