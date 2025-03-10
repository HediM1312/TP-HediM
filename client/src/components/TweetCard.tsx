import React, { useState, useEffect } from 'react';
import { Tweet } from '@/types';
import Link from 'next/link';
import { likeTweet, unlikeTweet, checkLikeStatus } from '@/services/api';
import { CommentSection } from '@/components/CommentSection';

interface TweetCardProps {
  tweet: Tweet;
  onTweetUpdate?: (updatedTweet: Tweet) => void;
}

export const TweetCard: React.FC<TweetCardProps> = ({ tweet, onTweetUpdate }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(tweet.like_count);
  const [showComments, setShowComments] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
  }, [tweet.id]);

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
    <div className="border-b border-extralight p-4 hover:bg-gray-50">
      <div className="flex space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-gray-600 font-bold">
              {tweet.author_username.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <Link href={`/profile/${tweet.author_username}`} className="font-bold text-dark hover:underline">
              {tweet.author_username}
            </Link>
            <span className="ml-2 text-sm text-secondary">
              {formatDate(tweet.created_at)}
            </span>
          </div>
          <p className="mt-1 text-gray-900">{tweet.content}</p>
          
          {/* Actions */}
          <div className="mt-3 flex space-x-8">
            {/* Bouton commentaires */}
            <button 
              onClick={toggleComments}
              className="flex items-center text-gray-500 hover:text-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              <span>{tweet.comment_count}</span>
            </button>
            
            {/* Bouton like */}
            <button 
              onClick={handleLikeToggle}
              disabled={isLoading}
              className={`flex items-center ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-1" 
                viewBox="0 0 20 20" 
                fill={isLiked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={isLiked ? "0" : "1.5"}
              >
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              <span>{likeCount}</span>
            </button>
          </div>
          
          {/* Section commentaires */}
          {showComments && (
            <CommentSection 
              tweetId={tweet.id} 
              onCommentAdded={handleCommentAdded} 
            />
          )}
        </div>
      </div>
    </div>
  );
};