import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Send, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import { processVoiceQuery } from '@/integrations/gemini';

interface AiAdviceWidgetProps {
  language: 'en' | 'hi';
}

const AiAdviceWidget: React.FC<AiAdviceWidgetProps> = ({ language }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [microphoneAvailable, setMicrophoneAvailable] = useState(true);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check if microphone is available on component mount
  useEffect(() => {
    // Check if running in a secure context and if mediaDevices API is available
    const isSecureContext = window.isSecureContext;
    const hasMediaDevices = navigator.mediaDevices !== undefined;
    
    setMicrophoneAvailable(isSecureContext && hasMediaDevices);
    
    if (!isSecureContext && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      console.warn('Microphone access requires HTTPS. Voice features may not work.');
    }
  }, []);

  // Cleanup speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      if (speechSynthesis && speechSynthesisRef.current) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast.error(
        language === 'en' 
          ? 'Please enter a question' 
          : 'कृपया एक प्रश्न दर्ज करें'
      );
      return;
    }
    
    // Stop any ongoing speech
    if (speechSynthesis && isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    
    setIsLoading(true);
    
    try {
      const response = await processVoiceQuery(query, language);
      
      if (response.error) {
        toast.error(response.error);
        return;
      }
      
      setAdvice(response.text);
      
      // Automatically speak the response
      if (response.audioResponse) {
        speakText(response.audioResponse);
      }
    } catch (error) {
      console.error("Error getting advice:", error);
      toast.error(
        language === 'en' 
          ? 'Error getting advice. Please try again.' 
          : 'सलाह प्राप्त करने में त्रुटि। कृपया पुनः प्रयास करें।'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Text-to-speech function to speak advice
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      toast.error(
        language === 'en'
          ? 'Text-to-speech is not supported in your browser.'
          : 'टेक्स्ट-टू-स्पीच आपके ब्राउज़र में समर्थित नहीं है।'
      );
      return;
    }
    
    // Cancel any ongoing speech
    if (speechSynthesis) {
      speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesisRef.current = utterance;
    
    // Set language
    utterance.lang = language === 'en' ? 'en-US' : 'hi-IN';
    
    // Handle speech events
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      toast.error(
        language === 'en'
          ? 'Error playing voice response.'
          : 'आवाज़ प्रतिक्रिया चलाने में त्रुटि।'
      );
    };
    
    // Speak the text
    speechSynthesis.speak(utterance);
  };

  // Toggle speaking the advice
  const toggleSpeaking = () => {
    if (isSpeaking) {
      // Stop speaking
      if (speechSynthesis) {
        speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    } else if (advice) {
      // Speak advice
      speakText(advice);
    }
  };

  return (
    <Card className="border-water">
      <CardHeader className="bg-water/10">
        <CardTitle className="text-lg">
          {language === 'en' ? 'Ask for Farming Advice' : 'कृषि सलाह के लिए पूछें'}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder={
              language === 'en'
                ? 'e.g., How can I reduce water usage for rice crops?'
                : 'उदा., मैं चावल की फसलों के लिए पानी के उपयोग को कैसे कम कर सकता हूँ?'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
          />
          
          <Button 
            type="submit" 
            disabled={isLoading} 
            className="w-full bg-water hover:bg-water-dark"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {language === 'en' ? 'Getting advice...' : 'सलाह प्राप्त कर रहे हैं...'}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {language === 'en' ? 'Get Advice' : 'सलाह प्राप्त करें'}
              </>
            )}
          </Button>
        </form>
        
        {advice && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm flex-1">{advice}</p>
              <Button
                onClick={toggleSpeaking}
                variant="ghost"
                size="sm"
                className={`rounded-full h-6 w-6 p-0 ml-2 flex-shrink-0 ${isSpeaking ? 'bg-green-100 dark:bg-green-900' : ''}`}
                title={language === 'en' ? 'Play voice response' : 'आवाज़ प्रतिक्रिया चलाएं'}
              >
                {isSpeaking ? (
                  <VolumeX className="h-3 w-3" />
                ) : (
                  <Volume2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AiAdviceWidget; 