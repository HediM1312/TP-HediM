import React from 'react';
import { Tweet } from '@/types';
import Link from 'next/link';

interface TweetFormProps {
    onSubmit: (content: string) => Promise<void>;
  }
  
  export const TweetForm: React.FC<TweetFormProps> = ({ onSubmit }) => {
    const [content, setContent] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!content.trim()) return;
      
      setIsSubmitting(true);
      try {
        await onSubmit(content);
        setContent('');
      } catch (error) {
        console.error('Error submitting tweet:', error);
      } finally {
        setIsSubmitting(false);
      }
    };
  
    return (
      <form onSubmit={handleSubmit} className="border-b border-extralight p-4">
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          placeholder="Quoi de neuf ?"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={280}
        />
        <div className="flex justify-between items-center mt-3">
          <div className="text-sm text-secondary">
            {content.length}/280
          </div>
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="bg-primary hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Tweeter
          </button>
        </div>
      </form>
    );
  };