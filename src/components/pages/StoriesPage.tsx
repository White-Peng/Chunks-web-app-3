import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate, type PanInfo } from 'motion/react';
import { ArrowLeft, Settings, RefreshCw } from 'lucide-react';
import { storageService } from '@/services/storageService';
import { generateChunksFromStory, generateMockChunks } from '@/services/contentGenerator';
import type { Story } from '@/types';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface StoryCardProps {
  story: Story;
  isConsumed: boolean;
  onClick: () => void;
}

function StoryCard({ story, isConsumed, onClick }: StoryCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative w-24 h-40 flex-shrink-0 cursor-pointer"
    >
      {/* Story Ring */}
      <div className={`absolute inset-0 rounded-2xl p-[3px] ${
        isConsumed 
          ? 'bg-gray-300' 
          : 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600'
      }`}>
        <div 
          className="w-full h-full rounded-[14px] bg-cover bg-center"
          style={{ backgroundImage: `url(${story.image})` }}
        >
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 rounded-[14px]" />
        </div>
      </div>
      
      {/* Title */}
      <div className="absolute bottom-2 left-2 right-2">
        <p className="text-white text-xs font-medium truncate">
          {story.title}
        </p>
      </div>
    </motion.div>
  );
}

export function StoriesPage() {
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [consumedStories, setConsumedStories] = useState<number[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isLoading] = useState(false);
  const [isGeneratingChunks, setIsGeneratingChunks] = useState(false);
  const [error, setError] = useState('');
  
  // Swipe gesture state
  const y = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load stories on mount
  useEffect(() => {
    const savedStories = storageService.getStories();
    const consumed = storageService.getConsumedStories();
    
    if (savedStories.length > 0) {
      setStories(savedStories);
      setConsumedStories(consumed);
    } else {
      // Redirect to settings if no stories
      navigate('/settings');
    }
  }, [navigate]);

  // Handle story selection
  const handleStoryClick = async (story: Story) => {
    setSelectedStory(story);
    setIsGeneratingChunks(true);
    setError('');

    try {
      const config = storageService.getApiConfig();
      
      let chunks;
      if (config) {
        // Use LLM to generate chunks
        chunks = await generateChunksFromStory(story, config);
      } else {
        // Use mock data
        chunks = generateMockChunks(story);
      }
      
      storageService.setCurrentStory(story);
      storageService.setCurrentChunks(chunks);
      navigate('/chunks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate chunks');
      setSelectedStory(null);
    } finally {
      setIsGeneratingChunks(false);
    }
  };

  // Handle swipe down to dismiss
  const handleDragEnd = (_: never, info: PanInfo) => {
    if (info.offset.y > 100) {
      // Swipe down - navigate back
      navigate('/');
    } else {
      // Reset position
      animate(y, 0, { type: 'spring', stiffness: 300, damping: 30 });
    }
  };

  // Get next unconsumed story
  const getNextUnconsumedStory = () => {
    return stories.find(s => !consumedStories.includes(s.id));
  };

  const opacity = useTransform(y, [0, 200], [1, 0.5]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading stories..." />
      </div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      style={{ y, opacity }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 200 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      className="fixed inset-0 bg-black overflow-hidden"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h2 className="text-white font-medium">Stories</h2>
        <button
          onClick={() => navigate('/settings')}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <Settings className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute top-20 left-4 right-4 z-30 p-4 bg-red-500/90 text-white rounded-xl">
          {error}
        </div>
      )}

      {/* Loading Overlay for Chunk Generation */}
      {isGeneratingChunks && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" />
          <p className="text-white mt-4">Generating chunks for "{selectedStory?.title}"...</p>
        </div>
      )}

      {/* Main Content */}
      <div className="h-full flex flex-col">
        {/* Stories Row */}
        <div className="pt-20 px-4">
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {stories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                isConsumed={consumedStories.includes(story.id)}
                onClick={() => handleStoryClick(story)}
              />
            ))}
          </div>
        </div>

        {/* Featured Story / Next Up */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {getNextUnconsumedStory() ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <p className="text-white/60 text-sm mb-4">Tap a story to start learning</p>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const nextStory = getNextUnconsumedStory();
                  if (nextStory) handleStoryClick(nextStory);
                }}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-semibold"
              >
                Start Next Story
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <p className="text-white/60 text-lg mb-4">🎉 All stories completed!</p>
              <button
                onClick={() => navigate('/settings')}
                className="px-6 py-3 bg-white/10 text-white rounded-xl font-medium flex items-center gap-2 hover:bg-white/20 transition-colors mx-auto"
              >
                <RefreshCw className="w-5 h-5" />
                Add More URLs
              </button>
            </motion.div>
          )}
        </div>

        {/* Bottom Hint */}
        <div className="pb-8 text-center">
          <p className="text-white/40 text-sm">Swipe down to go back</p>
        </div>
      </div>
    </motion.div>
  );
}

