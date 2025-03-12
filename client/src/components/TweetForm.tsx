'use client';

import React, { useState, useRef } from 'react';
import { FiImage, FiSmile, FiCamera, FiVideo, FiX } from 'react-icons/fi';
import { useAuth } from '@/context/AppContext';
import { motion } from 'framer-motion';

interface TweetFormProps {
  onSubmit: (content: string, mediaFile?: File) => Promise<void>;
}

export const TweetForm: React.FC<TweetFormProps> = ({ onSubmit }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileType = file.type.split('/')[0];
      
      // Vérifier si le fichier est une image ou une vidéo
      if (fileType !== 'image' && fileType !== 'video') {
        alert('Seules les images et les vidéos sont acceptées');
        return;
      }
      
      // Vérifier la taille du fichier (10 MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('Le fichier est trop volumineux (max 10 MB)');
        return;
      }
      
      setMediaFile(file);
      setMediaType(fileType as 'image' | 'video');
      
      // Créer une prévisualisation
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !mediaFile) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(content, mediaFile || undefined);
      setContent('');
      removeMedia();
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

          {mediaPreview && (
            <div className="relative mt-2 mb-3 rounded-xl overflow-hidden bg-gray-800 border border-gray-700">
            <button
              type="button"
              onClick={removeMedia}
              className="absolute top-2 right-2 bg-gray-900/80 p-1 rounded-full text-white hover:bg-red-500 z-10"
            >
              <FiX className="w-5 h-5" />
            </button>
            
            {mediaType === 'image' && (
              <img
                src={mediaPreview}
                alt="Preview"
                className="max-h-80 w-auto mx-auto rounded-xl"
              />
            )}

            {mediaType === 'video' && (
                <video
                  src={mediaPreview}
                  controls
                  className="max-h-80 w-auto mx-auto rounded-xl"
                />
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
            <div className="flex items-center space-x-2">

            <input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaSelect}
                ref={fileInputRef}
                className="hidden"
                id="media-upload"
              />



              <motion.label
                htmlFor="media-upload"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-purple-400 hover:bg-purple-500/20 rounded-full transition-colors cursor-pointer"
              >
                <FiImage className="w-5 h-5" />
              </motion.label>


              <motion.label
                htmlFor="media-upload"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-purple-400 hover:bg-purple-500/20 rounded-full transition-colors cursor-pointer"
              >
                <FiVideo className="w-5 h-5" />
              </motion.label>

              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-purple-400 hover:bg-purple-500/20 rounded-full transition-colors"
              >
                <FiSmile className="w-5 h-5" />
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
              disabled={(!content.trim() && !mediaFile) || isSubmitting}
              whileHover={!isSubmitting && (content.trim() || mediaFile) ? { scale: 1.05 } : {}}
              whileTap={!isSubmitting && (content.trim() || mediaFile) ? { scale: 0.95 } : {}}
              className={`
                px-6 py-2 rounded-full font-medium transition-all
                ${(!content.trim() && !mediaFile) || isSubmitting
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