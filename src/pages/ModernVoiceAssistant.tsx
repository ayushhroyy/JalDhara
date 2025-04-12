import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, BrainCircuit, Image, FileText, PenLine, BarChart3, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UnifiedVoiceButton from '@/components/UnifiedVoiceButton';

interface ModernVoiceAssistantProps {
  language: 'en' | 'hi';
}

const ModernVoiceAssistant: React.FC<ModernVoiceAssistantProps> = ({ language }) => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<{ role: 'user' | 'assistant'; content: string; timestamp?: string }[]>([]);
  const [showTools, setShowTools] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const content = {
    en: {
      title: "AI Voice Assistant",
      placeholder: "Write here...",
      initialMessage: "Hi, can I help you?",
      tools: {
        rewrite: "Rewrite",
        createImage: "Create an image",
        analyzeData: "Analyse the Data",
        makePlan: "Make a Plan"
      }
    },
    hi: {
      title: "AI वॉयस असिस्टेंट",
      placeholder: "यहां लिखें...",
      initialMessage: "नमस्ते, मैं आपकी कैसे मदद कर सकता हूँ?",
      tools: {
        rewrite: "फिर से लिखें",
        createImage: "एक छवि बनाएं",
        analyzeData: "डेटा का विश्लेषण करें",
        makePlan: "एक योजना बनाएं"
      }
    }
  };

  // Initialize with assistant welcome message
  useEffect(() => {
    if (conversations.length === 0) {
      setConversations([
        { role: 'assistant', content: content[language].initialMessage }
      ]);
    }
  }, [language]);

  // Scroll to bottom when conversations update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversations]);

  const handleVoiceData = (text: string) => {
    if (text.trim()) {
      const now = new Date();
      const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setConversations(prev => [...prev, { role: 'user', content: text, timestamp }]);
    }
  };

  const handleResponseData = (text: string) => {
    if (text.trim()) {
      const now = new Date();
      const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setConversations(prev => [...prev, { role: 'assistant', content: text, timestamp }]);
    }
  };

  const toggleTools = () => {
    setShowTools(prev => !prev);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-purple-950">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-purple-100 dark:border-purple-900">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5 text-purple-700 dark:text-purple-400" />
            </Button>
            <h1 className="text-lg font-medium text-purple-800 dark:text-purple-300">
              {content[language].title} <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full ml-2">v1.3.2</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content - Chat Area */}
      <main className="flex-1 container mx-auto px-4 py-6 overflow-auto">
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
          {conversations.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              {message.role === 'assistant' && (
                <div className="h-8 w-8 rounded-full bg-purple-600 text-white flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                  <BrainCircuit className="h-4 w-4" />
                </div>
              )}
              
              <div 
                className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                  message.role === 'user' 
                    ? 'bg-purple-600 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-slate-800 rounded-tl-none'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                {message.timestamp && (
                  <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-purple-200' : 'text-gray-400'}`}>
                    {message.timestamp}
                  </p>
                )}
              </div>
              
              {message.role === 'user' && (
                <div className="h-8 w-8 rounded-full bg-purple-300 dark:bg-purple-800 text-purple-800 dark:text-purple-200 flex items-center justify-center ml-2 flex-shrink-0 mt-1">
                  <MessageSquare className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Footer - Input Area */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-purple-100 dark:border-purple-900 p-4">
        <div className="container mx-auto max-w-3xl">
          {/* Tools Menu */}
          {showTools && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Button variant="outline" className="rounded-xl flex items-center gap-2 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                <PenLine className="h-4 w-4" />
                {content[language].tools.rewrite}
              </Button>
              <Button variant="outline" className="rounded-xl flex items-center gap-2 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                <Image className="h-4 w-4" />
                {content[language].tools.createImage}
              </Button>
              <Button variant="outline" className="rounded-xl flex items-center gap-2 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                <BarChart3 className="h-4 w-4" />
                {content[language].tools.analyzeData}
              </Button>
              <Button variant="outline" className="rounded-xl flex items-center gap-2 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                <FileText className="h-4 w-4" />
                {content[language].tools.makePlan}
              </Button>
            </div>
          )}

          {/* Input Area */}
          <div className="relative flex items-center">
            <div className="absolute left-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-purple-500"
                onClick={toggleTools}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>

            <input
              type="text"
              placeholder={content[language].placeholder}
              className="w-full py-3 px-12 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text:white text-sm"
            />

            <div className="absolute right-3">
              <UnifiedVoiceButton
                language={language}
                variant="circle"
                size="sm"
                onVoiceData={handleVoiceData}
                onResponseData={handleResponseData}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ModernVoiceAssistant; 