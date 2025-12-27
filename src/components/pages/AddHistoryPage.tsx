import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Plus, Link, Trash2 } from 'lucide-react';
import { storageService } from '@/services/storageService';
import { generateStoriesFromHistory, generateMockStories } from '@/services/contentGenerator';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export function AddHistoryPage() {
  const navigate = useNavigate();
  
  const [urlInput, setUrlInput] = useState('');
  const [urls, setUrls] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  // Load saved URLs on mount
  useEffect(() => {
    const savedUrls = storageService.getBrowsingHistory();
    setUrls(savedUrls);
  }, []);

  // Add URL to browsing history
  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    
    // Parse multiple URLs (one per line or comma-separated)
    const newUrls = urlInput
      .split(/[\n,]/)
      .map(url => url.trim())
      .filter(url => url && url.startsWith('http'));
    
    if (newUrls.length === 0) {
      setError('Please enter valid URLs (starting with http:// or https://)');
      return;
    }

    const updatedUrls = [...new Set([...urls, ...newUrls])];
    setUrls(updatedUrls);
    storageService.setBrowsingHistory(updatedUrls);
    setUrlInput('');
    setError('');
  };

  // Remove URL
  const handleRemoveUrl = (urlToRemove: string) => {
    const updatedUrls = urls.filter(url => url !== urlToRemove);
    setUrls(updatedUrls);
    storageService.setBrowsingHistory(updatedUrls);
  };

  // Clear all URLs
  const handleClearUrls = () => {
    setUrls([]);
    storageService.clearBrowsingHistory();
  };

  // Generate Stories from URLs
  const handleGenerateStories = async () => {
    if (urls.length === 0) {
      setError('Please add some URLs first');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const stories = await generateStoriesFromHistory(urls);
      storageService.setStories(stories);
      storageService.setHasStarted(true);
      navigate('/stories');
    } catch (err) {
      console.error('Generate error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate stories');
    } finally {
      setIsGenerating(false);
    }
  };

  // Use Demo Mode (mock data)
  const handleDemoMode = () => {
    const mockStories = generateMockStories();
    storageService.setStories(mockStories);
    storageService.setHasStarted(true);
    navigate('/stories');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-4 px-4 py-4 bg-white border-b">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold">Add Browsing History</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 text-red-700 rounded-xl"
          >
            {error}
          </motion.div>
        )}

        {/* Instructions */}
        <div className="text-center py-4">
          <p className="text-gray-600">
            Paste URLs from your browsing history to generate personalized stories
          </p>
        </div>

        {/* URL Input Section */}
        <section className="bg-gray-50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your URLs</h2>
            {urls.length > 0 && (
              <button
                onClick={handleClearUrls}
                className="text-red-500 text-sm flex items-center gap-1 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>

          {/* URL Input */}
          <div className="mb-4">
            <textarea
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste URLs here (one per line or comma-separated)&#10;&#10;Example:&#10;https://www.example.com/article1&#10;https://www.example.com/article2"
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
            <button
              onClick={handleAddUrl}
              className="mt-2 w-full py-3 bg-black text-white rounded-full font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add URLs
            </button>
          </div>

          {/* URL List */}
          {urls.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {urls.map((url, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200"
                >
                  <Link className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate flex-1">{url}</span>
                  <button
                    onClick={() => handleRemoveUrl(url)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {urls.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-4">
              No URLs added yet
            </p>
          )}

          <p className="text-gray-400 text-xs mt-4 text-center">
            {urls.length} URL{urls.length !== 1 ? 's' : ''} added
          </p>
        </section>

        {/* Generate Stories Button */}
        <section className="space-y-3">
          <button
            onClick={handleGenerateStories}
            disabled={isGenerating || urls.length === 0}
            className="w-full py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-full font-semibold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Generating Stories...</span>
              </>
            ) : (
              'Generate Stories'
            )}
          </button>

          <div className="text-center text-gray-400 text-sm">or</div>

          <button
            onClick={handleDemoMode}
            className="w-full py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors"
          >
            Try Demo Mode
          </button>
        </section>
      </div>
    </div>
  );
}

