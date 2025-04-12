import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { processVoiceQuery } from '@/integrations/gemini';
import { transcribeAudio } from '@/integrations/assemblyai';

interface EnhancedVoiceButtonProps {
  onVoiceData: (text: string) => void;
  isListening: boolean;
  language: 'en' | 'hi'; 
  onListeningChange: (isListening: boolean) => void;
}

const EnhancedVoiceButton: React.FC<EnhancedVoiceButtonProps> = ({
  onVoiceData,
  isListening,
  language,
  onListeningChange
}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [microphoneAvailable, setMicrophoneAvailable] = useState<boolean>(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

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

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (isSpeaking && speechSynthesisRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSpeaking]);

  const startRecording = async () => {
    if (!microphoneAvailable) {
      const errorMessage = language === 'en'
        ? 'Microphone access not available. Please check permissions.'
        : 'माइक्रोफ़ोन एक्सेस उपलब्ध नहीं है। कृपया अनुमतियां जांचें।';
      toast.error(errorMessage);
      return;
    }

    audioChunksRef.current = [];
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = async () => {
        await processRecording();
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      toast.info(language === 'en' ? 'Listening...' : 'सुन रहा हूँ...');
    } catch (error) {
      console.error("Error accessing microphone:", error);
      const errorMessage = language === 'en'
        ? 'Failed to access microphone. Please check permissions.'
        : 'माइक्रोफ़ोन तक पहुंचने में विफल। कृपया अनुमतियां जांचें।';
      toast.error(errorMessage);
      setMicrophoneAvailable(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const processRecording = async () => {
    setIsProcessing(true);
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
      
      // Use the AssemblyAI API for real transcription
      const transcriptionResult = await transcribeAudio(audioBlob, language);
      
      if (transcriptionResult.error) {
        toast.error(transcriptionResult.error);
        setIsProcessing(false);
        return;
      }
      
      const transcription = transcriptionResult.text;
      
      if (!transcription.trim()) {
        toast.error(
          language === 'en'
            ? 'No speech detected. Please try again.'
            : 'कोई भाषण नहीं मिला। कृपया पुनः प्रयास करें।'
        );
        setIsProcessing(false);
        return;
      }
      
      // Process with Gemini
      const response = await processVoiceQuery(transcription, language);
      
      if (response.error) {
        toast.error(response.error);
        setIsProcessing(false);
        return;
      }
      
      // Send the transcription to parent
      onVoiceData(transcription);
      
      // Speak the response
      speakResponse(response.text || transcription);
      
      toast.success(language === 'en' ? 'Voice processed successfully!' : 'आवाज़ सफलतापूर्वक प्रोसेस की गई!');
    } catch (error) {
      console.error("Error processing recording:", error);
      const errorMessage = language === 'en'
        ? 'Error processing voice. Please try again.'
        : 'आवाज़ प्रोसेसिंग में त्रुटि। कृपया पुनः प्रयास करें।';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesisRef.current = utterance;
      
      // Set language for speech synthesis
      utterance.lang = language === 'en' ? 'en-US' : 'hi-IN';
      
      // Get available voices
      const voices = window.speechSynthesis.getVoices();
      
      // Find a voice for the selected language
      const languageVoices = voices.filter(voice => 
        voice.lang.startsWith(language === 'en' ? 'en' : 'hi')
      );
      
      // Use a language-specific voice if available, otherwise use the default
      if (languageVoices.length > 0) {
        utterance.voice = languageVoices[0];
      }
      
      // Events for tracking speech state
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => {
        setIsSpeaking(false);
        console.error('Speech synthesis error');
      };
      
      // Store user's language preference in localStorage
      localStorage.setItem('userLanguagePreference', language);
      
      // Speak the text
      window.speechSynthesis.speak(utterance);
    } else {
      const errorMessage = language === 'en'
        ? 'Speech synthesis not supported in this browser.'
        : 'इस ब्राउज़र में स्पीच सिंथेसिस समर्थित नहीं है।';
      toast.error(errorMessage);
    }
  };

  const toggleListening = async () => {
    if (isListening) {
      stopRecording();
      onListeningChange(false);
    } else {
      await startRecording();
      onListeningChange(true);
    }
  };

  return (
    <Button
      onClick={toggleListening}
      variant={isListening ? "destructive" : "default"}
      size="lg"
      className={`rounded-full h-16 w-16 p-0 ${isListening ? 'animate-pulse' : ''} ${isSpeaking ? 'bg-green-500 hover:bg-green-600' : ''} bg-water hover:bg-water-dark transition-all hover:shadow`}
      disabled={isProcessing || !microphoneAvailable}
      title={
        !microphoneAvailable 
          ? (language === 'en' ? 'Microphone not available' : 'माइक्रोफोन उपलब्ध नहीं है') 
          : isSpeaking 
          ? (language === 'en' ? 'Speaking...' : 'बोल रहा है...') 
          : ''
      }
    >
      {isProcessing ? (
        <Loader2 className="h-8 w-8 animate-spin" />
      ) : isSpeaking ? (
        <Volume2 className="h-8 w-8" />
      ) : isListening ? (
        <MicOff className="h-8 w-8" />
      ) : (
        <Mic className="h-8 w-8" />
      )}
    </Button>
  );
};

export default EnhancedVoiceButton; 