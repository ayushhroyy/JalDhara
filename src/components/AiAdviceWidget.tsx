import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Send, Volume2, VolumeX, Sparkles, HelpCircle, Mic } from 'lucide-react';
import { toast } from 'sonner';
import { processVoiceQuery } from '@/integrations/cohere';
import { initSpeechRecognition } from '@/integrations/speech/speech-recognition';
import { SupportedLanguage } from '@/App';

interface AiAdviceWidgetProps {
  language: SupportedLanguage | 'en' | 'hi';
}

const AiAdviceWidget: React.FC<AiAdviceWidgetProps> = ({ language }) => {
  // Normalize language to 'en' or 'hi' for now, since other languages aren't fully supported yet
  const normalizedLanguage: 'en' | 'hi' = language === 'hi' ? 'hi' : 'en';
  
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [microphoneAvailable, setMicrophoneAvailable] = useState(true);
  const [showSampleQuestions, setShowSampleQuestions] = useState(true);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sample questions based on language
  const sampleQuestions = {
    en: [
      "How can I reduce water usage for rice crops?",
      "Which crops are best for dry soil?",
      "How do I detect plant diseases early?",
      "What natural fertilizers can I use?",
    ],
    hi: [
      "मैं चावल की फसलों के लिए पानी के उपयोग को कैसे कम कर सकता हूँ?",
      "सूखी मिट्टी के लिए कौन सी फसलें सबसे अच्छी हैं?",
      "मैं जल्दी पौधों के रोगों का पता कैसे लगा सकता हूँ?",
      "मैं कौन से प्राकृतिक उर्वरक का उपयोग कर सकता हूँ?",
    ]
  };

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

  // Hide sample questions when advice is received
  useEffect(() => {
    if (advice) {
      setShowSampleQuestions(false);
    }
  }, [advice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast.error(
        normalizedLanguage === 'en' 
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
      const response = await processVoiceQuery(query, normalizedLanguage);
      
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
        normalizedLanguage === 'en' 
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
        normalizedLanguage === 'en'
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
    utterance.lang = normalizedLanguage === 'en' ? 'en-US' : 'hi-IN';
    
    // Handle speech events
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      toast.error(
        normalizedLanguage === 'en'
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

  // Handle clicking on a sample question
  const handleSampleQuestionClick = (question: string) => {
    setQuery(question);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle voice input
  const handleVoiceInput = async () => {
    if (!microphoneAvailable) {
      toast.error(
        normalizedLanguage === 'en'
          ? 'Microphone is not available.'
          : 'माइक्रोफोन उपलब्ध नहीं है।'
      );
      return;
    }

    try {
      const speechRecognition = initSpeechRecognition(
        normalizedLanguage,
        (result) => {
          // Handle successful recognition
          setQuery(result.text);
          
          // Auto submit after a short delay
          setTimeout(() => {
            const form = document.getElementById('advice-form') as HTMLFormElement;
            if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          }, 500);
        },
        (error) => {
          // Handle errors
          toast.error(
            normalizedLanguage === 'en'
              ? 'Error with voice recognition. Please try again.'
              : 'आवाज़ पहचान में त्रुटि। कृपया पुनः प्रयास करें।'
          );
        }
      );
      
      // Start listening
      speechRecognition.start();
      
    } catch (error) {
      console.error("Voice recognition error:", error);
      toast.error(
        normalizedLanguage === 'en'
          ? 'Voice recognition is not supported in your browser.'
          : 'आवाज़ पहचान आपके ब्राउज़र में समर्थित नहीं है।'
      );
    }
  };

  return (
    <Card className="border-water overflow-hidden group hover:shadow-lg transition-all duration-300 relative">
      <div className="absolute right-0 top-0 h-24 w-24 bg-gradient-radial from-water/10 to-transparent rounded-full -translate-y-12 translate-x-12 opacity-70"></div>
      <div className="absolute left-0 bottom-0 h-16 w-16 bg-gradient-radial from-water/10 to-transparent rounded-full translate-y-8 -translate-x-8 opacity-70"></div>
      
      <CardHeader className="bg-gradient-to-r from-water/20 to-water/10 pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-water-dark">
          <Sparkles className="h-5 w-5 text-water-dark" />
          {normalizedLanguage === 'en' ? 'Ask for Farming Advice' : 'कृषि सलाह के लिए पूछें'}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-4">
        <form id="advice-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              ref={inputRef}
              placeholder={
                normalizedLanguage === 'en'
                  ? 'Ask any farming question...'
                  : 'कोई भी कृषि प्रश्न पूछें...'
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
              className="pr-20 border-water focus:border-water-dark focus:ring-water/50 transition-all"
            />
            <div className="absolute right-1 top-1 flex gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={handleVoiceInput}
                className="h-7 w-7"
                disabled={isLoading || !microphoneAvailable}
                title={normalizedLanguage === 'en' ? 'Use voice input' : 'आवाज़ इनपुट का उपयोग करें'}
              >
                <Mic className={`h-4 w-4 ${!microphoneAvailable ? 'opacity-50' : ''}`} />
              </Button>
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-water hover:text-water-dark"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Show sample questions if no advice yet */}
          {showSampleQuestions && !advice && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2 flex items-center">
                <HelpCircle className="h-3 w-3 mr-1" />
                {normalizedLanguage === 'en' ? 'Try asking:' : 'इन्हें आजमाएं:'}
              </p>
              <div className="flex flex-wrap gap-2">
                {sampleQuestions[normalizedLanguage].map((question, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs py-1 h-auto bg-water/5 hover:bg-water/10 border-water/20"
                    onClick={() => handleSampleQuestionClick(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </form>
        
        {/* Display the AI advice */}
        {advice && (
          <div className="mt-4 relative">
            <div className="bg-water/5 rounded-lg p-3 text-sm">
              <p className="whitespace-pre-line">{advice}</p>
              
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-8 text-xs"
                onClick={toggleSpeaking}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="h-4 w-4 mr-1" />
                    {normalizedLanguage === 'en' ? 'Stop Speaking' : 'बोलना बंद करें'}
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4 mr-1" />
                    {normalizedLanguage === 'en' ? 'Speak Advice' : 'सलाह सुनें'}
                  </>
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