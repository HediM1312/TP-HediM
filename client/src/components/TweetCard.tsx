'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Tweet } from '@/types';
import Link from 'next/link';
import { likeTweet, unlikeTweet, checkLikeStatus, retweetTweet, unretweetTweet, checkRetweetStatus } from '@/services/api';
import { CommentSection } from '@/components/CommentSection';
import WebcamCapture from '@/components/WebcamCapture';
import EmotionReactions from '@/components/EmotionReactions';
import { useAuth } from '@/context/AppContext';
import { FiMessageCircle, FiHeart, FiRepeat, FiSmile } from 'react-icons/fi';

interface TweetCardProps {
  tweet: Tweet;
  onTweetUpdate?: (updatedTweet: Tweet) => void;
}

export const TweetCard: React.FC<TweetCardProps> = ({ tweet, onTweetUpdate }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(tweet.like_count);
  const [showComments, setShowComments] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [userReaction, setUserReaction] = useState<string | undefined>(undefined);
  const [isReacting, setIsReacting] = useState(false);
  const [isRetweeted, setIsRetweeted] = useState(false);
  const [retweetCount, setRetweetCount] = useState(tweet.retweet_count || 0);
  const webcamContainerRef = useRef<HTMLDivElement>(null);

  // Format date without date-fns
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Vérifier le statut de like au chargement
  useEffect(() => {
    const checkLiked = async () => {
      try {
        const response = await checkLikeStatus(tweet.id);
        setIsLiked(response.liked);
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };

    checkLiked();
    fetchUserReaction();
  }, [tweet.id]);

  useEffect(() => {
    const checkRetweeted = async () => {
      try {
        const response = await checkRetweetStatus(tweet.id);
        setIsRetweeted(response.retweeted);
      } catch (error) {
        console.error('Error checking retweet status:', error);
      }
    };
  
    checkRetweeted();
  }, [tweet.id]);

  const handleRetweetToggle = async () => {
    setIsLoading(true);
    try {
      if (isRetweeted) {
        await unretweetTweet(tweet.id);
        setRetweetCount(prev => prev - 1);
      } else {
        await retweetTweet(tweet.id);
        setRetweetCount(prev => prev + 1);
      }
      setIsRetweeted(!isRetweeted);
      
      // Mettre à jour le tweet si callback fourni
      if (onTweetUpdate) {
        onTweetUpdate({
          ...tweet,
          retweet_count: isRetweeted ? retweetCount - 1 : retweetCount + 1
        });
      }
    } catch (error) {
      console.error('Error toggling retweet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Récupérer la réaction de l'utilisateur pour ce tweet
  const fetchUserReaction = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`http://localhost:8000/api/tweets/${tweet.id}/reactions`);
      if (response.ok) {
        const reactions = await response.json();
        const userReaction = reactions.find((r: any) => r.user_id === user.id);
        if (userReaction) {
          setUserReaction(userReaction.emotion);
        }
      }
    } catch (error) {
      console.error('Error fetching user reaction:', error);
    }
  };

  // Gérer le clic sur le bouton de like
  const handleLikeToggle = async () => {
    setIsLoading(true);
    try {
      if (isLiked) {
        await unlikeTweet(tweet.id);
        setLikeCount(prev => prev - 1);
      } else {
        await likeTweet(tweet.id);
        setLikeCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
      
      // Mettre à jour le tweet si callback fourni
      if (onTweetUpdate) {
        onTweetUpdate({
          ...tweet,
          like_count: isLiked ? likeCount - 1 : likeCount + 1
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer l'affichage des commentaires
  const toggleComments = () => {
    setShowComments(!showComments);
  };

  // Gérer l'affichage de la webcam pour réagir
  const toggleReaction = () => {
    setShowWebcam(!showWebcam);
    
    // Scroll to the webcam if opening
    if (!showWebcam && webcamContainerRef.current) {
      setTimeout(() => {
        webcamContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  };

  // Gérer la capture d'image pour réaction
  const handleImageCaptured = async (imageData: string) => {
    if (!user) return;
    
    try {
      setIsReacting(true);
      
      const response = await fetch(`http://localhost:8000/api/tweets/${tweet.id}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tweet_id: tweet.id,
          user_id: user.id,
          image: imageData
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const reaction = await response.json();
      console.log('Réaction enregistrée:', reaction);
      setUserReaction(reaction.emotion);
      
      // Fermer la webcam après quelques secondes
      setTimeout(() => {
        setShowWebcam(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error registering reaction:', error);
    } finally {
      setIsReacting(false);
    }
  };

  // Mettre à jour le compteur de commentaires
  const handleCommentAdded = () => {
    if (onTweetUpdate) {
      onTweetUpdate({
        ...tweet,
        comment_count: tweet.comment_count + 1
      });
    }
  };

  return (
    <div className="p-4 border-b border-gray-800 hover:bg-purple-500/5 transition-all">
      {tweet.is_retweet && (
        <div className="flex items-center text-sm text-purple-400 mb-2">
          <FiRepeat className="w-4 h-4 mr-2" />
          <span>Retweeté par {tweet.author_username}</span>
        </div>
      )}

      <div className="flex">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
            {tweet.author_username.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="ml-3 flex-grow">
          <div className="flex items-center">
            <Link 
              href={`/profile/${tweet.author_username}`} 
              className="font-semibold text-white hover:text-purple-400 transition-colors"
            >
              {tweet.author_username}
            </Link>
            <span className="ml-2 text-sm text-purple-400">
              {formatDate(tweet.created_at)}
            </span>
          </div>

          <p className="mt-2 text-white">{tweet.content}</p>

          {/* Affichage des réactions émotionnelles */}
          <div className="mt-2">
            <EmotionReactions tweetId={tweet.id} userReaction={userReaction} />
          </div>

          <div className="mt-3 flex space-x-6">
            {/* Bouton commentaires */}
            <button 
              onClick={toggleComments}
              className="flex items-center text-gray-400 hover:text-purple-400 transition-colors group"
            >
              <FiMessageCircle className="w-5 h-5 mr-2 group-hover:text-purple-400" />
              <span>{tweet.comment_count}</span>
            </button>

            {/* Bouton retweet */}
            <button 
              onClick={handleRetweetToggle}
              disabled={isLoading}
              className={`flex items-center transition-colors group ${
                isRetweeted ? 'text-green-500' : 'text-gray-400 hover:text-green-400'
              }`}
            >
              <FiRepeat className={`w-5 h-5 mr-2 ${
                isRetweeted ? 'text-green-500' : 'group-hover:text-green-400'
              }`} />
              <span>{retweetCount}</span>
            </button>

            {/* Bouton like */}
            <button 
              onClick={handleLikeToggle}
              disabled={isLoading}
              className={`flex items-center transition-colors group ${
                isLiked ? 'text-pink-500' : 'text-gray-400 hover:text-pink-400'
              }`}
            >
              <FiHeart className={`w-5 h-5 mr-2 ${
                isLiked ? 'text-pink-500 fill-current' : 'group-hover:text-pink-400'
              }`} />
              <span>{likeCount}</span>
            </button>

            {/* Bouton réaction */}
            <button 
              onClick={toggleReaction}
              className={`flex items-center transition-colors group ${
                showWebcam ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-400'
              }`}
            >
              <FiSmile className="w-5 h-5 mr-2 group-hover:text-yellow-400" />
              <span>Réagir</span>
            </button>
          </div>

          {/* Webcam pour réaction émotionnelle */}
          {showWebcam && (
            <div 
              ref={webcamContainerRef} 
              className="mt-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700"
            >
              <div className="text-sm font-medium mb-2 text-purple-400">
                {isReacting ? 
                  "Analyse de votre réaction en cours..." : 
                  "Exprimez votre réaction à ce tweet"
                }
              </div>
              <WebcamCapture 
                onImageCaptured={handleImageCaptured} 
                autoSendToBackend={false}
                compact={true} 
              />
            </div>
          )}

          {/* Section commentaires */}
          {showComments && (
            <div className="mt-4 border-t border-gray-800 pt-4">
              <CommentSection 
                tweetId={tweet.id} 
                onCommentAdded={handleCommentAdded} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};