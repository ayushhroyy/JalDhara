import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { processVoiceQuery } from '@/integrations/gemini';

interface VoiceButtonProps {
  onVoiceData: (text: string) => void;
  isListening: boolean;
  language: 'en' | 'hi';
  onListeningChange: (isListening: boolean) => void;
}

const VoiceButton: React.FC<VoiceButtonProps> = ({ 
  onVoiceData, 
  isListening, 
  language,
  onListeningChange
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [microphoneAvailable, setMicrophoneAvailable] = useState(true);

  // Check if microphone is available
  useEffect(() => {
    const checkMicrophoneAvailability = async () => {
      // Check if running in secure context (required for mediaDevices)
      if (!window.isSecureContext) {
        console.warn("Microphone access requires HTTPS (except on localhost)");
        setMicrophoneAvailable(false);
        return;
      }
      
      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn("Media devices API not available in this browser");
        setMicrophoneAvailable(false);
        return;
      }
      
      try {
        // Try to access the microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Stop all tracks in the stream after checking
        stream.getTracks().forEach(track => track.stop());
        setMicrophoneAvailable(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        setMicrophoneAvailable(false);
      }
    };
    
    checkMicrophoneAvailability();
  }, []);

  // Save language preference whenever it changes
  useEffect(() => {
    // Store user's language preference in localStorage
    localStorage.setItem('userLanguagePreference', language);
  }, [language]);

  // Simulate voice recording and process with Gemini
  const toggleListening = async () => {
    // If microphone is not available, show error toast
    if (!microphoneAvailable) {
      const errorMessage = language === 'en'
        ? 'Microphone access not available. Please check permissions and ensure you\'re using HTTPS.'
        : 'माइक्रोफ़ोन एक्सेस उपलब्ध नहीं है। कृपया अनुमतियां जांचें और सुनिश्चित करें कि आप HTTPS का उपयोग कर रहे हैं।';
      toast.error(errorMessage);
      return;
    }

    if (isListening) {
      onListeningChange(false);
      setIsProcessing(true);
      
      try {
        // Simulate recording delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simulate voice input (in a real app, this would come from speech recognition)
        const mockVoiceInputs = {
          en: [
            "I grow wheat and rice in my field.",
            "My soil is black and fertile.",
            "I use groundwater for irrigation.",
            "We get moderate rainfall in monsoon season."
          ],
          hi: [
            "मैं अपने खेत में गेहूं और चावल उगाता हूं।",
            "मेरी मिट्टी काली और उपजाऊ है।",
            "मैं सिंचाई के लिए भूजल का उपयोग करता हूं।",
            "मानसून के मौसम में हमें मध्यम वर्षा होती है।"
          ]
        };
        
        const randomIndex = Math.floor(Math.random() * mockVoiceInputs[language].length);
        const voiceInput = mockVoiceInputs[language][randomIndex];
        
        // Process with Gemini
        const response = await processVoiceQuery(voiceInput, language);
        
        if (response.error) {
          toast.error(response.error);
          return;
        }
        
        // Use the detected input as the response
        onVoiceData(voiceInput);
        
        toast.success(language === 'en' ? 'Voice recorded successfully!' : 'आवाज़ सफलतापूर्वक रिकॉर्ड की गई!');
      } catch (error) {
        console.error("Error processing voice:", error);
        toast.error(
          language === 'en' 
            ? 'Error processing voice. Please try again.' 
            : 'आवाज़ प्रोसेसिंग में त्रुटि। कृपया पुनः प्रयास करें।'
        );
      } finally {
        setIsProcessing(false);
      }
    } else {
      onListeningChange(true);
      toast.info(language === 'en' ? 'Listening...' : 'सुन रहा हूँ...');
    }
  };

  return (
    <Button
      onClick={toggleListening}
      variant={isListening ? "destructive" : "default"}
      size="lg"
      className={`rounded-full h-16 w-16 p-0 ${isListening ? 'animate-pulse' : ''}`}
      disabled={isProcessing || !microphoneAvailable}
      title={!microphoneAvailable ? (language === 'en' ? 'Microphone not available' : 'माइक्रोफोन उपलब्ध नहीं है') : ''}
    >
      {isProcessing ? (
        <Loader2 className="h-8 w-8 animate-spin" />
      ) : isListening ? (
        <MicOff className="h-8 w-8" />
      ) : (
        <Mic className="h-8 w-8" />
      )}
    </Button>
  );
};

export default VoiceButton;
