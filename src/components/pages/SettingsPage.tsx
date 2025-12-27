import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Trash2, Plus, Link, Eye, EyeOff } from 'lucide-react';
import { storageService } from '@/services/storageService';
import { generateStoriesFromHistory, generateMockStories } from '@/services/contentGenerator';
import type { LLMProvider, LLMConfig } from '@/types';
import { PROVIDER_NAMES, DEFAULT_MODELS } from '@/types';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export function SettingsPage() {
  const navigate = useNavigate();
  
  // API Configuration
  const [provider, setProvider] = useState<LLMProvider>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Browsing History
  const [urlInput, setUrlInput] = useState('');
  const [urls, setUrls] = useState<string[]>([]);
  
  // State
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load saved settings on mount
  useEffect(() => {
    const config = storageService.getApiConfig();
    if (config) {
      setProvider(config.provider);
      setApiKey(config.apiKey);
    }
    
    const savedUrls = storageService.getBrowsingHistory();
    setUrls(savedUrls);
  }, []);

  // Save API configuration
  const handleSaveConfig = () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    const config: LLMConfig = {
      provider,
      apiKey: apiKey.trim(),
      model: DEFAULT_MODELS[provider],
    };

    storageService.setApiConfig(config);
    setSuccess('API configuration saved!');
    setError('');
    
    setTimeout(() => setSuccess(''), 3000);
  };

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
    const config = storageService.getApiConfig();
    
    if (!config) {
      setError('Please configure your API key first');
      return;
    }

    if (urls.length === 0) {
      setError('Please add some URLs first');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const stories = await generateStoriesFromHistory(urls, config);
      storageService.setStories(stories);
      storageService.setHasStarted(true);
      navigate('/stories');
    } catch (err) {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-4 px-4 py-4 bg-white border-b">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold">Settings</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Error/Success Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 text-red-700 rounded-xl"
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-50 text-green-700 rounded-xl"
          >
            {success}
          </motion.div>
        )}

        {/* API Configuration Section */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">API Configuration</h2>
          
          {/* Provider Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              LLM Provider
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(PROVIDER_NAMES) as LLMProvider[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    provider === p
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {PROVIDER_NAMES[p]}
                </button>
              ))}
            </div>
          </div>

          {/* API Key Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Enter your ${PROVIDER_NAMES[provider]} API key`}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Your API key is stored locally in your browser and never sent to our servers.
            </p>
          </div>

          <button
            onClick={handleSaveConfig}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors"
          >
            <Save className="w-5 h-5" />
            Save Configuration
          </button>
        </section>

        {/* Browsing History Section */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Browsing History</h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add URLs
            </label>
            <textarea
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste URLs here (one per line or comma-separated)"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
            <button
              onClick={handleAddUrl}
              className="mt-2 w-full py-2 bg-gray-100 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
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
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
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
            <p className="text-gray-500 text-sm text-center py-4">
              No URLs added yet. Add some URLs to generate stories from your browsing history.
            </p>
          )}
        </section>

        {/* Generate Stories Button */}
        <section className="space-y-3">
          <button
            onClick={handleGenerateStories}
            disabled={isGenerating || urls.length === 0}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2 hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <LoadingSpinner size="sm" />
            ) : (
              'Generate Stories from URLs'
            )}
          </button>

          <button
            onClick={handleDemoMode}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Try Demo Mode (No API needed)
          </button>
        </section>
      </div>
    </div>
  );
}

