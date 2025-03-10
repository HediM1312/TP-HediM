'use client';

import React, { useEffect, useState } from 'react';
import { TweetCard } from '@/components/TweetCard';
import { TweetForm } from '@/components/TweetForm';
import { getTweets, createTweet } from '@/services/api';
import { Tweet } from '@/types';
import { useAuth } from '@/context/AppContext';
import { redirect } from 'next/navigation';
import Layout from '@/components/Layout';

export default function Home() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    // Rediriger si non authentifié
    if (!authLoading && !isAuthenticated) {
      redirect('/login');
    }

    const fetchTweets = async () => {
      try {
        setLoading(true);
        const data = await getTweets();
        setTweets(data);
      } catch (error) {
        console.error('Error fetching tweets:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchTweets();
    }
  }, [isAuthenticated, authLoading]);

  const handleNewTweet = async (content: string) => {
    try {
      const newTweet = await createTweet(content);
      setTweets([newTweet, ...tweets]);
    } catch (error) {
      console.error('Error creating tweet:', error);
    }
  };

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
        <h1 className="text-xl font-bold p-4">Accueil</h1>
      </div>

      <TweetForm onSubmit={handleNewTweet} />

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="spinner w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : tweets.length > 0 ? (
        <div className="tweets-container">
          {tweets.map((tweet) => (
            <TweetCard key={tweet.id} tweet={tweet} />
          ))}
        </div>
      ) : (
        <div className="text-center p-8 text-gray-500">
          Aucun tweet à afficher. Soyez le premier à tweeter !
        </div>
      )}
    </Layout>
  );
}