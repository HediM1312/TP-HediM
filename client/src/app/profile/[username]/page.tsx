'use client';

import React, { useEffect, useState } from 'react';
import { getUserTweets, getUserStats, getUserLikedTweets, getUserRetweetedTweets } from '@/services/api';
import { Tweet } from '@/types';
import { TweetCard } from '@/components/TweetCard';
import { useAuth } from '@/context/AppContext';
import { redirect } from 'next/navigation';
import FollowButton from '@/components/FollowButton';
import FollowersList from '@/components/FollowersList';
import FollowingList from '@/components/FollowingList';

type TabType = 'tweets' | 'likes' | 'retweets';

export default function ProfilePage({ params }: { params: { username: string } }) {
  const { username } = params;
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [likedTweets, setLikedTweets] = useState<Tweet[]>([]);
  const [retweetedTweets, setRetweetedTweets] = useState<Tweet[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('tweets');
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
        
        // Récupérer les statistiques
        const stats = await getUserStats(username);
        setUserStats(stats);
        
        // Récupérer les tweets selon l'onglet actif
        await fetchTweetsForActiveTab(activeTab);
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

  // Charger les tweets en fonction de l'onglet actif
  const fetchTweetsForActiveTab = async (tab: TabType) => {
    try {
      setLoading(true);
      
      // Charger les données selon l'onglet
      switch (tab) {
        case 'tweets':
          if (tweets.length === 0) {
            const tweetsData = await getUserTweets(username);
            setTweets(tweetsData);
          }
          break;
          
        case 'likes':
          if (likedTweets.length === 0) {
            const likedData = await getUserLikedTweets(username);
            setLikedTweets(likedData);
          }
          break;
          
        case 'retweets':
          if (retweetedTweets.length === 0) {
            const retweetedData = await getUserRetweetedTweets(username);
            setRetweetedTweets(retweetedData);
          }
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${tab}:`, error);
      setError(`Impossible de charger les ${tab}.`);
    } finally {
      setLoading(false);
    }
  };

  // Changer d'onglet
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    fetchTweetsForActiveTab(tab);
  };

  // Gérer le changement d'état du bouton suivre
  const handleFollowChange = (following: boolean) => {
    // Mettre à jour le compteur d'abonnés localement
    setUserStats(prev => ({
      ...prev,
      followers_count: following ? prev.followers_count + 1 : prev.followers_count - 1
    }));
  };

  // Afficher le contenu actif selon l'onglet
  const renderActiveContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center p-8">
          <div className="spinner w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    
    if (error) {
      return <div className="p-4 text-red-500 text-center">{error}</div>;
    }
    
    let currentTweets: Tweet[] = [];
    let emptyMessage = "";
    
    switch (activeTab) {
      case 'tweets':
        currentTweets = tweets;
        emptyMessage = "Cet utilisateur n'a pas encore tweeté.";
        break;
      case 'likes':
        currentTweets = likedTweets;
        emptyMessage = "Cet utilisateur n'a pas encore liké de tweets.";
        break;
      case 'retweets':
        currentTweets = retweetedTweets;
        emptyMessage = "Cet utilisateur n'a pas encore retweeté.";
        break;
    }
    
    if (currentTweets.length === 0) {
      return (
        <div className="text-center p-8 text-gray-400">
          {emptyMessage}
        </div>
      );
    }
    
    return (
      <div className="tweets-container">
        {currentTweets.map((tweet) => (
          <TweetCard key={tweet.id} tweet={tweet} />
        ))}
      </div>
    );
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

      {/* Onglets de navigation */}
      <div className="flex border-b border-gray-800">
        <button 
          onClick={() => handleTabChange('tweets')}
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            activeTab === 'tweets' 
              ? 'text-purple-500 border-b-2 border-purple-500' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Tweets
        </button>
        <button 
          onClick={() => handleTabChange('likes')}
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            activeTab === 'likes' 
              ? 'text-purple-500 border-b-2 border-purple-500' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          J'aime
        </button>
        <button 
          onClick={() => handleTabChange('retweets')}
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            activeTab === 'retweets' 
              ? 'text-purple-500 border-b-2 border-purple-500' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Retweets
        </button>
      </div>

      {/* Contenu selon l'onglet actif */}
      {renderActiveContent()}

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