import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { Tweet } from '@/types';
import { TweetCard } from '@/components/TweetCard';
import { TweetForm } from '@/components/TweetForm';
import { createTweet, getTweets } from '@/services/api';

export default function Home() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTweets();
  }, []);

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

  const handleNewTweet = async (content: string) => {
    try {
      const newTweet = await createTweet(content);
      setTweets([newTweet, ...tweets]);
    } catch (error) {
      console.error('Error creating tweet:', error);
    }
  };

  return (
    <>
      <Head>
        <title>Accueil | Twitter Clone</title>
        <meta name="description" content="Twitter Clone - Page d'accueil" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

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
    </>
  );
}