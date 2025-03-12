'use client';

import React, { useState } from 'react';
import { FiImage, FiSmile, FiCamera } from 'react-icons/fi';
import { useAuth } from '@/context/AppContext';
import { motion } from 'framer-motion';

interface TweetFormProps {
  onSubmit: (content: string) => Promise<void>;
}

export const TweetForm: React.FC<TweetFormProps> = ({ onSubmit }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

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
    <motion.form 
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm"
    >
      <div className="flex">
        <motion.div 
          className="flex-shrink-0"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
        </motion.div>

        <div className="ml-3 flex-grow">
          <textarea
            className="w-full bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none min-h-[80px]"
            placeholder="Quoi de neuf ?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={280}
          />

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
            <div className="flex items-center space-x-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-purple-400 hover:bg-purple-500/20 rounded-full transition-colors"
              >
                <FiImage className="w-5 h-5" />
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-purple-400 hover:bg-purple-500/20 rounded-full transition-colors"
              >
                <FiSmile className="w-5 h-5" />
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-purple-400 hover:bg-purple-500/20 rounded-full transition-colors"
              >
                <FiCamera className="w-5 h-5" />
              </motion.button>

              <div className="h-8 w-[1px] bg-gray-800 mx-2" />

              <motion.div 
                className={`flex items-center px-3 py-1 rounded-full ${
                  content.length > 240 
                    ? 'bg-red-500/20 text-red-500' 
                    : content.length > 200 
                    ? 'bg-yellow-500/20 text-yellow-500' 
                    : 'bg-purple-500/20 text-purple-400'
                }`}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {280 - content.length}
              </motion.div>
            </div>

            <motion.button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              whileHover={!isSubmitting && content.trim() ? { scale: 1.05 } : {}}
              whileTap={!isSubmitting && content.trim() ? { scale: 0.95 } : {}}
              className={`
                px-6 py-2 rounded-full font-medium transition-all
                ${!content.trim() || isSubmitting
                  ? 'bg-purple-500/50 text-white/50 cursor-not-allowed'
                  : 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg hover:shadow-purple-500/25'
                }
              `}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  <span>Envoi...</span>
                </div>
              ) : (
                'Tweeter'
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.form>
  );
};