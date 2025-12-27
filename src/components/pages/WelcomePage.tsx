import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sparkles, Settings, ArrowRight } from 'lucide-react';
import { storageService } from '@/services/storageService';

export function WelcomePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = () => {
    setIsLoading(true);
    
    // Check if API is configured
    const config = storageService.getApiConfig();
    
    if (!config) {
      // Redirect to settings to configure API
      navigate('/settings');
    } else {
      // Mark as started and go to stories
      storageService.setHasStarted(true);
      navigate('/stories');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md"
      >
        {/* Logo/Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 mx-auto mb-8 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm"
        >
          <Sparkles className="w-10 h-10 text-white" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-bold text-white mb-4"
        >
          Chunks
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white/80 text-lg mb-8"
        >
          Transform your browsing history into bite-sized knowledge stories
        </motion.p>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-white/60 text-sm mb-12 space-y-2"
        >
          <p>📱 Stories format for easy learning</p>
          <p>🤖 AI-powered content generation</p>
          <p>💬 Reflect and chat about what you learned</p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <button
            onClick={handleGetStarted}
            disabled={isLoading}
            className="w-full py-4 bg-white text-purple-700 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              'Loading...'
            ) : (
              <>
                Get Started
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="w-full py-3 bg-white/10 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
          >
            <Settings className="w-5 h-5" />
            Configure API
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

