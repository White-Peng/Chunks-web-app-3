import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Send, BookOpen, ArrowLeft } from 'lucide-react';
import { storageService } from '@/services/storageService';
import { generateChatResponse } from '@/services/contentGenerator';
import type { Story, Chunk, Message, Reference } from '@/types';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export function ChatbotPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [story, setStory] = useState<Story | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [showMotivation, setShowMotivation] = useState(true);
  const [showReferences, setShowReferences] = useState(false);

  // Load story and chunks on mount
  useEffect(() => {
    const storedStory = storageService.getCurrentStory();
    const storedChunks = storageService.getCurrentChunks();
    
    if (storedStory) {
      setStory(storedStory);
      setChunks(storedChunks);
      
      // Show motivation message for 2 seconds, then send first bot message
      setTimeout(() => {
        setShowMotivation(false);
        
        // After motivation fades, send bot's first message
        setTimeout(() => {
          setMessages([{
            id: 1,
            text: `Great job completing "${storedStory.title}"! I'm here to help you reflect on what you've learned. Feel free to ask me any questions!`,
            sender: 'bot',
            timestamp: new Date()
          }]);
        }, 300);
      }, 2000);
    } else {
      navigate('/stories');
    }
  }, [navigate]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Generate references from story URLs
  const references: Reference[] = story?.relatedUrls?.map((url, index) => {
    try {
      const urlObj = new URL(url);
      return {
        id: index + 1,
        title: urlObj.hostname.replace('www.', ''),
        url: url,
        source: urlObj.hostname
      };
    } catch {
      return {
        id: index + 1,
        title: url,
        url: url,
        source: 'Unknown'
      };
    }
  }) || [];

  // Handle sending message
  const handleSend = async () => {
    if (!input.trim() || isTyping || !story) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const config = storageService.getApiConfig();
      
      let responseText: string;
      
      if (config) {
        // Use LLM for response
        responseText = await generateChatResponse(
          input,
          story.title,
          story.description,
          chunks,
          messages.map(m => ({ text: m.text, sender: m.sender })),
          config
        );
      } else {
        // Fallback to simple response
        responseText = generateFallbackResponse(input, story.title);
      }

      const botResponse: Message = {
        id: messages.length + 2,
        text: responseText,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: messages.length + 2,
        text: 'Sorry, I had trouble generating a response. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Fallback response generator
  const generateFallbackResponse = (userMessage: string, storyTitle: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('summary') || lowerMessage.includes('summarize')) {
      return `Great question! The key takeaway from "${storyTitle}" is understanding how different perspectives shape our view of this topic. The chunks you read covered various aspects from historical context to future trends.`;
    }
    
    if (lowerMessage.includes('why') || lowerMessage.includes('reason')) {
      return `That's an insightful question! This topic is important because it impacts how we think about and approach related concepts. Each chunk revealed different layers of understanding.`;
    }
    
    if (lowerMessage.includes('how') || lowerMessage.includes('what')) {
      return `Excellent question! Based on the chunks you've read, there are multiple approaches to this. The real-world applications we covered show practical ways this manifests in everyday life.`;
    }
    
    if (lowerMessage.includes('example')) {
      return `From what you've learned, you can apply these insights in various scenarios. The expert perspectives shared some compelling examples of implementation.`;
    }

    return `That's a thought-provoking question about "${storyTitle}". Based on the chunks you've read, this connects to the broader themes of understanding context, expert insights, and real-world applications. What specific aspect interests you most?`;
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle finishing and going home
  const handleFinish = () => {
    if (story) {
      storageService.addConsumedStory(story.id);
    }
    navigate('/stories');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-4 bg-white border-b">
        <button 
          onClick={() => navigate('/chunks')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Chunks</span>
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-sm font-medium text-gray-900 truncate px-4">
            {story?.title || 'Reflection'}
          </h1>
        </div>
        <button 
          onClick={handleFinish}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Home className="w-6 h-6" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {/* Motivation Message */}
        <AnimatePresence>
          {showMotivation && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center items-center h-full min-h-[200px]"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-4xl mb-4"
                >
                  🎉
                </motion.div>
                <p className="text-gray-800 text-lg font-medium">Great Job!</p>
                <p className="text-sm text-gray-500 mt-2">
                  You've completed all chunks. Let's reflect together
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Messages */}
        {!showMotivation && messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.sender === 'user'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
            </div>
          </motion.div>
        ))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-white border-t px-4 py-4">
        {/* References Button */}
        {references.length > 0 && (
          <div className="flex justify-center mb-3">
            <button
              onClick={() => setShowReferences(!showReferences)}
              className={`p-2 rounded-full transition-colors ${
                showReferences ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <BookOpen className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* References List */}
        <AnimatePresence>
          {showReferences && references.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-4 overflow-hidden"
            >
              <div className="bg-gray-50 rounded-xl p-4 max-h-64 overflow-y-auto">
                <h3 className="text-sm font-medium mb-3 text-gray-700">References</h3>
                <div className="space-y-2">
                  {references.map((ref) => (
                    <a
                      key={ref.id}
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                    >
                      <p className="text-sm text-gray-900 truncate">{ref.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{ref.source}</p>
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Field */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question..."
            disabled={isTyping}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-3 bg-purple-500 text-white rounded-full hover:bg-purple-600 disabled:opacity-50 disabled:hover:bg-purple-500 transition-colors"
          >
            {isTyping ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

