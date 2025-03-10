'use client';

import React, { useEffect, useState } from 'react';
import { getUserTweets } from '@/services/api';
import { Tweet } from '@/types';
import { TweetCard } from '@/components/TweetCard';
import { useAuth } from '@/context/AppContext';
import { redirect } from 'next/navigation';
import Layout from '@/components/Layout';

export default function ProfilePage({ params }: { params: { username: string } }) {
  const { username } = params;
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    // Rediriger si non authentifié
    if (!authLoading && !isAuthenticated) {
      redirect('/login');
    }

    const fetchUserTweets = async () => {
      try {
        setLoading(true);
        const data = await getUserTweets(username);
        setTweets(data);
      } catch (error) {
        console.error('Error fetching user tweets:', error);
        setError('Impossible de charger les tweets de cet utilisateur.');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && username) {
      fetchUserTweets();
    }
  }, [username, isAuthenticated, authLoading]);

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
      <div className="border-b border-extralight">
        <div className="p-4">
          <h1 className="text-xl font-bold">Profil</h1>
        </div>

        <div className="bg-gray-100 h-32"></div>

        <div className="p-4 border-b border-extralight">
          <div className="relative">
            <div className="absolute -top-12 left-0">
              <div className="w-24 h-24 rounded-full bg-gray-300 border-4 border-white flex items-center justify-center">
                <span className="text-gray-600 font-bold text-4xl">
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="pt-16">
              <h2 className="text-xl font-bold">{username}</h2>
              <p className="text-secondary">@{username}</p>
              <div className="mt-2">
                <span className="text-secondary">
                  <strong className="text-dark">{tweets.length}</strong> Tweets
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="spinner w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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
        <div className="text-center p-8 text-gray-500">
          Cet utilisateur n'a pas encore tweeté.
        </div>
      )}
    </Layout>
  );
}