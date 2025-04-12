import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wand2, MessageSquare, BrainCircuit, Bot, Droplets } from 'lucide-react';
import { toast } from 'sonner';
import UnifiedVoiceButton from '@/components/UnifiedVoiceButton';

interface VoiceAssistantProps {
  language: 'en' | 'hi';
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ language }) => {
  const [conversations, setConversations] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const content = {
    en: {
      title: "AI Voice Assistant",
      subtitle: "Your voice-powered farming assistant",
      initialMessage: "Hello! I'm your Kisan Jal Mitra AI assistant. How can I help you with water management and sustainable farming today?",
      startOverText: "Clear conversation",
    },
    hi: {
      title: "AI वॉयस असिस्टेंट",
      subtitle: "आपका वॉयस-संचालित कृषि सहायक",
      initialMessage: "नमस्ते! मैं आपका किसान जल मित्र AI सहायक हूँ। आज मैं जल प्रबंधन और टिकाऊ खेती के बारे में आपकी कैसे मदद कर सकता हूँ?",
      startOverText: "बातचीत साफ़ करें",
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

  const clearConversation = () => {
    setConversations([
      { role: 'assistant', content: content[language].initialMessage }
    ]);
  };

  const handleVoiceData = (text: string) => {
    if (text.trim()) {
      setConversations(prev => [...prev, { role: 'user', content: text }]);
    }
  };

  const handleResponseData = (text: string) => {
    if (text.trim()) {
      setConversations(prev => [...prev, { role: 'assistant', content: text }]);
    }
  };

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="relative overflow-hidden bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-slate-800 border-water/30 shadow-lg">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-water-light via-water to-water-dark"></div>
          
          <CardHeader className="border-b border-water/20 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-water/10 rounded-full">
                <Bot className="h-6 w-6 text-water" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-water-dark flex items-center gap-2">
                  {content[language].title}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{content[language].subtitle}</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="h-[60vh] overflow-y-auto p-6 space-y-6">
              {conversations.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  {message.role === 'assistant' && (
                    <div className="h-8 w-8 rounded-full bg-water text-white flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <BrainCircuit className="h-4 w-4" />
                    </div>
                  )}
                  
                  <div 
                    className={`max-w-[80%] p-4 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-water text-white rounded-tr-none shadow-sm'
                        : 'bg-white dark:bg-slate-800 border border-water/20 rounded-tl-none shadow-sm'
                    }`}
                  >
                    <p>{message.content}</p>
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="h-8 w-8 rounded-full bg-earth-light dark:bg-earth text-white flex items-center justify-center ml-2 flex-shrink-0 mt-1">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
          
          <CardFooter className="border-t border-water/20 p-4 bg-white/50 dark:bg-slate-900/50">
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearConversation}
                  className="text-water border-water hover:bg-water/10"
                  disabled={conversations.length <= 1}
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  {content[language].startOverText}
                </Button>
              </div>
              
              <div className="flex justify-center">
                <UnifiedVoiceButton
                  language={language}
                  variant="circle"
                  size="lg"
                  withVisualizer={true}
                  onVoiceData={handleVoiceData}
                  onResponseData={handleResponseData}
                  className="shadow-md water-button"
                />
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default VoiceAssistant; 