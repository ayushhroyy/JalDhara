import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, Loader2, Volume2, VolumeX, X, Bot, 
  MessageSquareText, HelpCircle, Send, Sprout, 
  CloudRain, Bug, ThermometerSun, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { processVoiceQuery } from '@/integrations/cohere';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import './KrishiMitraAI.css';
import { initSpeechRecognition, isSpeechRecognitionAvailable } from '@/integrations/speech/speech-recognition';
import { Input } from '@/components/ui/input';
import { SupportedLanguage } from '@/App';

interface KrishiMitraButtonProps {
  language: SupportedLanguage | 'en' | 'hi';
  className?: string;
}

// DropletIcon component
const DropletIcon = ({ size = 24, ...props }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

// Define suggested prompts
const SUGGESTED_PROMPTS = {
  en: [
    { label: "Weather Info", icon: <CloudRain size={14} />, text: "What's the weather forecast for farming next week?" },
    { label: "Pest Advice", icon: <Bug size={14} />, text: "How to handle pests attacking my wheat crop?" },
    { label: "Water Conservation", icon: <DropletIcon size={14} />, text: "How can I conserve water in my farm?" },
    { label: "Crop Rotation", icon: <Sprout size={14} />, text: "What crops should I rotate after growing rice?" }
  ],
  hi: [
    { label: "मौसम की जानकारी", icon: <CloudRain size={14} />, text: "अगले सप्ताह खेती के लिए मौसम का पूर्वानुमान क्या है?" },
    { label: "कीट सलाह", icon: <Bug size={14} />, text: "मेरी गेहूं की फसल पर हमला करने वाले कीटों से कैसे निपटें?" },
    { label: "जल संरक्षण", icon: <DropletIcon size={14} />, text: "मैं अपने खेत में पानी का संरक्षण कैसे कर सकता हूं?" },
    { label: "फसल चक्र", icon: <Sprout size={14} />, text: "चावल उगाने के बाद मुझे किन फसलों को घुमाना चाहिए?" }
  ]
};

// Rain Animation Component
const RainAnimation = () => {
  return (
    <div className="rain-container">
      {Array.from({ length: 20 }).map((_, i) => (
        <div 
          key={i} 
          className="raindrop"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${0.5 + Math.random() * 1}s`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  );
};

const KrishiMitraButton: React.FC<KrishiMitraButtonProps> = ({
  language,
  className = ''
}) => {
  // Normalize language to 'en' or 'hi' for now, since other languages aren't fully supported yet
  const normalizedLanguage: 'en' | 'hi' = language === 'hi' ? 'hi' : 'en';
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  
  // Processing and speaking states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [microphoneAvailable, setMicrophoneAvailable] = useState<boolean>(true);
  const [isListeningAfterSpeak, setIsListeningAfterSpeak] = useState<boolean>(false);
  
  // Conversation state
  const [conversation, setConversation] = useState<{
    role: 'user' | 'assistant';
    content: string;
    confidence?: 'high' | 'medium' | 'low';
  }[]>([
    { 
      role: 'assistant', 
      content: normalizedLanguage === 'en' 
        ? 'Hello! I am Krishi Mitra, your agricultural assistant. How can I help you today?' 
        : 'नमस्ते! मैं कृषि मित्र हूँ, आपका कृषि सहायक। आज मैं आपकी कैसे मदद कर सकता हूँ?',
      confidence: 'high'
    }
  ]);
  
  // Reset conversation when language changes
  useEffect(() => {
    clearConversation();
  }, [normalizedLanguage]);
  
  // Error handling state
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Show suggested prompts
  const [showSuggestions, setShowSuggestions] = useState<boolean>(true);

  // Refs
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const conversationContainerRef = useRef<HTMLDivElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Text input state
  const [textInput, setTextInput] = useState<string>('');
  
  // Active recording animation state
  const [isActivelyRecording, setIsActivelyRecording] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // Audio context for visualization
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // State to track if the conversation is related to water/rain
  const [isWaterRelated, setIsWaterRelated] = useState<boolean>(false);

  // Audio context and confirmation sound
  const [confirmationSound, setConfirmationSound] = useState<AudioBuffer | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Content based on language
  const content = {
    en: {
      buttonLabel: "Krishi Mitra",
      dialogTitle: "Krishi Mitra - Agricultural Assistant",
      processingText: "Processing...",
      listeningText: "Listening...",
      speakingText: "Speaking...",
      noMicrophoneText: "Microphone not available",
      errorProcessingText: "Error processing. Please try again.",
      noSpeechDetectedText: "No speech detected. Please try again.",
      clearConversationText: "Clear Conversation",
      successText: "Voice processed successfully!",
      suggestedPromptsTitle: "Try asking about:",
      retryText: "Retry",
      errorTitle: "I couldn't understand that",
      errorHelp: "Please try speaking clearly or use one of the suggested prompts"
    },
    hi: {
      buttonLabel: "कृषि मित्र",
      dialogTitle: "कृषि मित्र - कृषि सहायक",
      processingText: "प्रोसेसिंग...",
      listeningText: "सुन रहा हूँ...",
      speakingText: "बोल रहा हूँ...",
      noMicrophoneText: "माइक्रोफ़ोन उपलब्ध नहीं है",
      errorProcessingText: "प्रोसेसिंग में त्रुटि। कृपया पुनः प्रयास करें।",
      noSpeechDetectedText: "कोई भाषण नहीं मिला। कृपया पुनः प्रयास करें।",
      clearConversationText: "बातचीत साफ़ करें",
      successText: "आवाज़ सफलतापूर्वक प्रोसेस की गई!",
      suggestedPromptsTitle: "इसके बारे में पूछने की कोशिश करें:",
      retryText: "पुनः प्रयास करें",
      errorTitle: "मैं उसे नहीं समझ सका",
      errorHelp: "कृपया स्पष्ट रूप से बोलने या सुझाए गए प्रॉम्प्ट्स में से एक का उपयोग करने का प्रयास करें"
    }
  };

  // Use normalized language for UI text
  const uiContent = content[normalizedLanguage];

  // Scroll to bottom of conversation when it updates
  useEffect(() => {
    if (conversationContainerRef.current) {
      conversationContainerRef.current.scrollTop = conversationContainerRef.current.scrollHeight;
    }
  }, [conversation]);

  // Check if microphone is available
  useEffect(() => {
    const checkMicrophoneAvailability = async () => {
      if (!window.isSecureContext) {
        console.warn("Microphone access requires HTTPS (except on localhost)");
        setMicrophoneAvailable(false);
        return;
      }
      
      // Check if Web Speech API is available
      if (!isSpeechRecognitionAvailable()) {
        console.warn("Speech recognition not available in this browser");
        setMicrophoneAvailable(false);
        return;
      }
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setMicrophoneAvailable(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        setMicrophoneAvailable(false);
      }
    };
    
    checkMicrophoneAvailability();
  }, []);

  // Audio context and confirmation sound
  useEffect(() => {
    // Create audio context if it doesn't exist
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // Base64 encoded short beep sound
    const beepSound = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAB1qqqqQkJCQh8fHx8rKysrPz8/PwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE5TdHJlYW1lcgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQm9vRW5jb2RlciAxLjIuMQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    
    // Load and decode the beep sound
    const loadConfirmationSound = async () => {
      try {
        if (!audioContextRef.current) return;
        
        // Extract base64 data
        const base64Data = beepSound.split(',')[1];
        const binaryData = atob(base64Data);
        const byteArray = new Uint8Array(binaryData.length);
        
        for (let i = 0; i < binaryData.length; i++) {
          byteArray[i] = binaryData.charCodeAt(i);
        }
        
        // Decode audio data
        const audioBuffer = await audioContextRef.current.decodeAudioData(byteArray.buffer);
        setConfirmationSound(audioBuffer);
      } catch (err) {
        console.error("Error loading confirmation sound:", err);
      }
    };
    
    loadConfirmationSound();
    
    // Cleanup
    return () => {
      silenceTimeoutRef.current && clearTimeout(silenceTimeoutRef.current);
    };
  }, []);
  
  // Play confirmation sound
  const playConfirmationSound = () => {
    if (!audioContextRef.current || !confirmationSound) return;
    
    try {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = confirmationSound;
      source.connect(audioContextRef.current.destination);
      source.start();
    } catch (err) {
      console.error("Error playing confirmation sound:", err);
    }
  };
  
  // Silence detection during recording
  useEffect(() => {
    if (isActivelyRecording && audioLevel < 5) {
      // If silent for 6 seconds while recording, stop recording
      silenceTimeoutRef.current = setTimeout(() => {
        if (isActivelyRecording && speechRecognitionRef.current) {
          speechRecognitionRef.current.stop();
          cleanupAudioVisualization();
          setIsActivelyRecording(false);
          playConfirmationSound();
          toast.info(
            normalizedLanguage === 'en'
              ? "No speech detected, listening stopped."
              : "कोई आवाज़ नहीं मिली, सुनना बंद कर दिया गया।"
          );
        }
      }, 6000);
    } else if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    
    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    };
  }, [isActivelyRecording, audioLevel, normalizedLanguage]);

  // Cleanup speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      if (window.speechSynthesis && speechSynthesisRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Hide suggestions when there's a conversation
  useEffect(() => {
    if (conversation.length > 1) {
      setShowSuggestions(false);
    }
  }, [conversation]);

  // Text-to-speech function
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
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesisRef.current = utterance;
    
    // Set language
    utterance.lang = normalizedLanguage === 'en' ? 'en-US' : 'hi-IN';
    
    // Handle speech events
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      
      // Only automatically start listening after speaking ends if there has been user interaction
      // and if this isn't the initial greeting
      if (dialogOpen && microphoneAvailable && !isProcessing && conversation.length > 1) {
        setTimeout(() => {
          handleVoiceInput();
          setIsListeningAfterSpeak(true);
        }, 500); // Small delay for better user experience
      }
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      toast.error(
        normalizedLanguage === 'en'
          ? 'Error playing voice response.'
          : 'आवाज़ प्रतिक्रिया चलाने में त्रुटि।'
      );
    };
    
    // Speak the text
    window.speechSynthesis.speak(utterance);
  };

  // Toggle speaking the advice
  const toggleSpeaking = () => {
    if (isSpeaking) {
      // Stop speaking
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    } else {
      // Find the last assistant message to speak
      const lastAssistantMessage = [...conversation]
        .reverse()
        .find(msg => msg.role === 'assistant');
      
      if (lastAssistantMessage) {
        speakText(lastAssistantMessage.content);
      }
    }
  };

  // Clear conversation
  const clearConversation = () => {
    // Stop any ongoing speech
    if (window.speechSynthesis && isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    
    // Reset conversation to initial greeting
    setConversation([
      { 
        role: 'assistant', 
        content: normalizedLanguage === 'en' 
          ? 'Hello! I am Krishi Mitra, your agricultural assistant. How can I help you today?' 
          : 'नमस्ते! मैं कृषि मित्र हूँ, आपका कृषि सहायक। आज मैं आपकी कैसे मदद कर सकता हूँ?',
        confidence: 'high'
      }
    ]);
    
    // Show suggestions again
    setShowSuggestions(true);
    
    // Reset error state
    setHasError(false);
    setErrorMessage('');
    setIsWaterRelated(false);
  };

  // Function to handle dialog close
  const handleDialogClose = (open: boolean) => {
    // If dialog is being closed
    if (!open) {
      // Clean up resources
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      
      // Stop all animations to prevent duplicate elements 
      cancelAnimationFrame(animationFrameRef.current || 0);
      
      // Cleanup audio context
      cleanupAudioVisualization();
      
      // Set dialog state
      setDialogOpen(false);
    }
  };

  // Don't auto-activate microphone when dialog opens
  useEffect(() => {
    // Don't automatically activate microphone when dialog opens
    // User must manually click the speak button for first interaction
    
    // This is intentionally empty to prevent auto-activation
    // We'll rely on the speak button for initial interaction
  }, [dialogOpen]);

  // Initialize audio visualization
  const initAudioVisualization = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneStreamRef.current = stream;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyserRef.current = analyser;
      
      source.connect(analyser);
      analyser.fftSize = 256;
      
      const updateAudioLevel = () => {
        if (analyserRef.current && isActivelyRecording) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Calculate average level
          let sum = 0;
          dataArray.forEach(value => sum += value);
          const avg = sum / dataArray.length;
          
          // Scale to 0-100
          const scaledLevel = Math.min(100, Math.max(0, avg * 2));
          setAudioLevel(scaledLevel);
          
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
      
    } catch (err) {
      console.error("Error setting up audio visualization:", err);
    }
  };

  // Cleanup audio visualization
  const cleanupAudioVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach(track => track.stop());
      microphoneStreamRef.current = null;
    }
    
    setAudioLevel(0);
    setIsActivelyRecording(false);
  };

  // Function to handle voice input using Web Speech API
  const handleVoiceInput = () => {
    if (!microphoneAvailable || isProcessing || isSpeaking) {
      return;
    }
    
    // Cancel any ongoing speech
    if (window.speechSynthesis && isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    
    setHasError(false);
    setErrorMessage('');
    setIsActivelyRecording(true);
    
    // Clean up any existing stream before starting a new one
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach(track => track.stop());
      microphoneStreamRef.current = null;
    }
    
    // Initialize audio visualization only when starting recording
    initAudioVisualization();
    
    const speechRecognition = initSpeechRecognition(
      normalizedLanguage,
      (result) => {
        setIsListeningAfterSpeak(false);
        setIsActivelyRecording(false);
        cleanupAudioVisualization();
        
        // Process the recognized text
        if (result.text) {
          // Add user message to conversation ONLY HERE
          setConversation(prev => [
            ...prev,
            { role: 'user', content: result.text }
          ]);
          
          // Process with AI (without adding the message again)
          processWithAI(result.text);
        } else {
          toast.error(uiContent.noSpeechDetectedText);
        }
      },
      (error) => {
        setIsListeningAfterSpeak(false);
        setIsActivelyRecording(false);
        cleanupAudioVisualization();
        
        // Handle recognition errors
        toast.error(
          normalizedLanguage === 'en'
            ? `Recognition error: ${error}`
            : `मान्यता त्रुटि: ${error}`
        );
      }
    );
    
    // Save reference to the speech recognition instance
    speechRecognitionRef.current = speechRecognition;
    
    // Start listening
    speechRecognition.start();
  };

  // Handle text input submission
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!textInput.trim() || isProcessing) {
      return;
    }
    
    // Add user message to conversation ONLY HERE
    setConversation(prev => [
      ...prev,
      { role: 'user', content: textInput }
    ]);
    
    // Process with AI (without adding the message again)
    processWithAI(textInput);
    
    // Clear the input
    setTextInput('');
  };

  // Function to detect water-related content
  const detectWaterContent = (text: string): boolean => {
    const waterKeywords = [
      'rain', 'water', 'irrigation', 'monsoon', 'flood', 'drought', 'moisture', 'precipitation',
      'बारिश', 'पानी', 'सिंचाई', 'मानसून', 'बाढ़', 'सूखा', 'नमी', 'वर्षा'
    ];
    
    const lowerText = text.toLowerCase();
    return waterKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  };

  // Modify the processWithAI function to fix the duplicate message issue
  const processWithAI = async (text: string) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    setHasError(false);
    setShowSuggestions(false);
    
    // IMPORTANT: Don't add the user message to conversation here
    // It should only be added once before calling this function
    
    try {
      // Check if the query is related to water/rain to show animation
      const isAboutWater = detectWaterContent(text);
      setIsWaterRelated(isAboutWater);
      
      // Process the query
      const response = await processVoiceQuery(text, normalizedLanguage);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Determine confidence level based on response content
      const confidence = determineConfidence(response.text);
      
      // Add AI response to conversation
      setConversation(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: response.text,
          confidence
        }
      ]);
      
      // Speak the response if needed
      if (response.audioResponse && !isSpeaking) {
        speakText(response.audioResponse);
      }
    } catch (error) {
      console.error("Error processing with AI:", error);
      handleErrorFallback(error instanceof Error ? error.message : String(error));
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to determine confidence level based on content
  const determineConfidence = (text: string): 'high' | 'medium' | 'low' => {
    // Low confidence patterns indicate uncertainty
    const lowConfidencePatterns = [
      'i\'m not sure', 'i don\'t know', 'cannot help', 'sorry', 'unclear',
      'मुझे पता नहीं', 'क्षमा करें', 'मैं निश्चित नहीं', 'स्पष्ट नहीं',
      'unfortunately', 'unable to', 'not available', 'difficult to determine',
      'hard to say', 'insufficient information', 'lack of context'
    ];
    
    // Medium confidence patterns indicate possibility but not certainty
    const mediumConfidencePatterns = [
      'might be', 'possibly', 'perhaps', 'could be', 'consider',
      'शायद', 'संभवतः', 'विचार करें', 'हो सकता है',
      'generally', 'typically', 'often', 'usually', 'in most cases',
      'it depends', 'sometimes', 'may vary'
    ];
    
    const lowConfText = text.toLowerCase();
    
    // Check for very short responses
    if (text.length < 25) {
      return 'low';
    }
    
    // Check for generic responses that don't provide specific information
    if (text.length < 60 && (lowConfText.includes('can you provide') || 
        lowConfText.includes('please specify') || 
        lowConfText.includes('need more information'))) {
      return 'low';
    }
    
    // Check for low confidence indicators
    for (const pattern of lowConfidencePatterns) {
      if (lowConfText.includes(pattern.toLowerCase())) {
        return 'low';
      }
    }
    
    // Check for medium confidence indicators
    for (const pattern of mediumConfidencePatterns) {
      if (lowConfText.includes(pattern.toLowerCase())) {
        return 'medium';
      }
    }
    
    // Check for answers that are too short to be comprehensive
    if (text.length < 100) {
      return 'medium';
    }
    
    return 'high';
  };

  // Handle errors with friendly fallback
  const handleErrorFallback = (error: string) => {
    setHasError(true);
    setErrorMessage(error);
    
    const fallbackMessage = normalizedLanguage === 'en' 
      ? "I'm having trouble understanding. Could you try again or select a suggested topic?"
      : "मुझे समझने में परेशानी हो रही है। क्या आप फिर से प्रयास कर सकते हैं या एक सुझाया गया विषय चुन सकते हैं?";
    
    setConversation(prev => [
      ...prev,
      { 
        role: 'assistant', 
        content: fallbackMessage,
        confidence: 'low'
      }
    ]);
  };

  // Function to handle choosing a suggested prompt
  const handleSuggestedPrompt = (promptText: string) => {
    if (isProcessing) return;
    
    setHasError(false);
    setErrorMessage('');
    
    // Add user message to conversation ONLY HERE
    setConversation(prev => [
      ...prev,
      { role: 'user', content: promptText }
    ]);
    
    // Process with AI (without adding the message again)
    processWithAI(promptText);
  };

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        className={`krishimitra-ai-button ${className} bg-earth hover:bg-earth-dark text-white group relative overflow-hidden transition-all duration-300`}
      >
        <div className="absolute right-0 top-0 h-12 w-12 bg-gradient-radial from-earth-light/30 to-transparent rounded-full -translate-y-6 translate-x-6 opacity-70"></div>
        <div className="button-content relative z-10 flex items-center gap-2">
          <Bot className="h-4 w-4 bot-icon" />
          <span>{uiContent.buttonLabel}</span>
        </div>
      </Button>
      
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="kisan-dialog sm:max-w-[500px]">
          <DialogHeader className="kisan-dialog-header">
            <DialogTitle className="kisan-dialog-title">
              <Sprout className="h-5 w-5" />
              {uiContent.dialogTitle}
            </DialogTitle>
            <DialogClose 
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-white" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>
          
          {/* Add Rain Animation when water content is detected */}
          {isWaterRelated && <RainAnimation />}
          
          <div className="conversation-container h-[350px] overflow-y-auto" ref={conversationContainerRef}>
            {/* Conversation messages */}
            {conversation.map((msg, index) => {
              // Check if message is water-related
              const isWaterMsg = msg.role === 'assistant' && detectWaterContent(msg.content);
              
              return (
                <div
                  key={`msg-${index}`}
                  className={`mb-4 ${
                    msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'user-message'
                        : `assistant-message ${isWaterMsg ? 'water-message' : ''}`
                    }`}
                  >
                    <p className="text-base leading-relaxed break-words">{msg.content}</p>
                    
                    {/* Confidence indicator for assistant messages */}
                    {msg.role === 'assistant' && msg.confidence && (
                      <div className={`confidence-indicator confidence-${msg.confidence}`}>
                        {msg.confidence === 'high' && (
                          <>
                            <ThermometerSun size={12} />
                            <span>{normalizedLanguage === 'en' ? 'High confidence' : 'उच्च विश्वास'}</span>
                          </>
                        )}
                        {msg.confidence === 'medium' && (
                          <>
                            <HelpCircle size={12} />
                            <span>{normalizedLanguage === 'en' ? 'Medium confidence' : 'मध्यम विश्वास'}</span>
                          </>
                        )}
                        {msg.confidence === 'low' && (
                          <>
                            <AlertCircle size={12} />
                            <span>{normalizedLanguage === 'en' ? 'Low confidence' : 'कम विश्वास'}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Suggested prompts */}
            {showSuggestions && conversation.length <= 1 && (
              <div className="suggested-prompts my-4">
                <h4 className="text-sm text-muted-foreground mb-2">{uiContent.suggestedPromptsTitle}</h4>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_PROMPTS[normalizedLanguage].map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedPrompt(prompt.text)}
                      className="suggested-prompt text-xs bg-earth/10 hover:bg-earth/20 text-earth-dark px-3 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1"
                      disabled={isProcessing}
                    >
                      {prompt.icon}
                      <span>{prompt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Error state with retry option */}
            {hasError && (
              <div className="error-container">
                <p className="font-medium text-red-600">{uiContent.errorTitle}</p>
                <p className="text-sm text-gray-600 mt-1">{uiContent.errorHelp}</p>
                <button 
                  className="retry-button"
                  onClick={() => {
                    setHasError(false);
                    setErrorMessage('');
                  }}
                >
                  <span>{uiContent.retryText}</span>
                </button>
              </div>
            )}
            
            {/* Processing indicator */}
            {isProcessing && (
              <div className="flex justify-center my-4">
                <div className="processing-indicator flex items-center gap-2 px-4 py-2 bg-earth/5 rounded-full">
                  <Loader2 className="h-4 w-4 animate-spin text-earth" />
                  <span className="text-earth-dark text-sm">{uiContent.processingText}</span>
                </div>
              </div>
            )}
            
            {/* Listening after speak indicator */}
            {isListeningAfterSpeak && !isProcessing && (
              <div className="flex justify-center my-4">
                <div className="listening-indicator flex items-center gap-2 px-4 py-2 bg-earth/5 rounded-full animate-pulse">
                  <Mic className="h-4 w-4 text-earth" />
                  <span className="text-earth-dark text-sm">{uiContent.listeningText}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Add audio visualization for active recording */}
          {isActivelyRecording && (
            <div className="audio-visualization-container">
              <div className="audio-level-container">
                <div className="audio-level-bars">
                  {[...Array(10)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`audio-level-bar ${audioLevel >= (i + 1) * 10 ? 'active' : ''}`}
                      style={{ 
                        height: `${Math.min(100, Math.max(3, (i + 1) * 4 + (audioLevel >= (i + 1) * 10 ? 4 : 0)))}px`
                      }}
                    />
                  ))}
                </div>
                <div className="audio-pulse"></div>
              </div>
              <div className="recording-text">
                {normalizedLanguage === 'en' ? 'Listening...' : 'सुन रहा हूँ...'}
              </div>
            </div>
          )}
          
          <div className="border-t p-4 bg-gradient-to-r from-earth/5 to-transparent">
            {/* Text input form */}
            <form onSubmit={handleTextSubmit} className="mb-3 flex gap-2">
              <Input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={normalizedLanguage === 'en' ? "Type a message..." : "संदेश टाइप करें..."}
                className="flex-1 focus-visible:ring-earth"
                disabled={isProcessing}
              />
              <Button 
                type="submit" 
                disabled={!textInput.trim() || isProcessing}
                className="bg-earth hover:bg-earth-dark text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            
            <div className="flex flex-col gap-3">
              {/* Voice controls */}
              <div className="flex gap-2">
                <Button
                  onClick={handleVoiceInput}
                  className={`flex-1 bg-earth text-white hover:bg-earth-dark ${isListeningAfterSpeak || isActivelyRecording ? 'listening-active' : ''}`}
                  disabled={!microphoneAvailable || isProcessing || isSpeaking}
                >
                  <Mic className={`mr-2 h-4 w-4 ${isListeningAfterSpeak || isActivelyRecording ? 'animate-pulse' : ''}`} />
                  {normalizedLanguage === 'en' ? 'Speak' : 'बोलें'}
                </Button>
                
                <Button
                  onClick={toggleSpeaking}
                  variant="outline"
                  disabled={conversation.length <= 1 || isProcessing}
                  className={isSpeaking ? 'bg-earth/10 text-earth-dark' : 'text-earth-dark/70 hover:text-earth-dark hover:bg-earth/10'}
                >
                  {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                
                <Button
                  onClick={clearConversation}
                  variant="outline"
                  disabled={conversation.length <= 1 || isProcessing}
                  className="hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Speaking indicator */}
              {isSpeaking && (
                <div className="flex justify-center gap-1 mt-1 h-2">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1 bg-earth rounded-full animate-sound-wave"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    ></div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Farmer Avatar - Enhanced version */}
          <div className="farmer-avatar-container">
            <div className="farmer-avatar">
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-slight-bounce">
                {/* Sunny background */}
                <circle cx="50" cy="50" r="40" fill="#FFFDE7" />
                <circle cx="50" cy="50" r="35" fill="#F9FBE7" />
                
                {/* Sun rays */}
                <path d="M50 5 L50 15 M80 20 L70 28 M95 50 L85 50 M80 80 L70 72 M50 95 L50 85 M20 80 L28 72 M5 50 L15 50 M20 20 L28 28" 
                  stroke="#FFD54F" strokeWidth="2" strokeLinecap="round" />
                
                {/* Farmer head */}
                <circle cx="50" cy="42" r="18" fill="#FFDEAD" />
                <path d="M38 36C39.5 36 41 37 41 38.5C41 40 39.5 41 38 41C36.5 41 35 40 35 38.5C35 37 36.5 36 38 36Z" fill="#432" />
                <path d="M62 36C63.5 36 65 37 65 38.5C65 40 63.5 41 62 41C60.5 41 59 40 59 38.5C59 37 60.5 36 62 36Z" fill="#432" />
                <path d="M50 48C52 48 54 46 54 46C54 46 52 50 50 50C48 50 46 46 46 46C46 46 48 48 50 48Z" fill="#432" />
                <path d="M36 48C36 48 45 55 50 55C55 55 64 48 64 48" stroke="#432" strokeWidth="1.5" strokeLinecap="round" />
                
                {/* Farmer hat */}
                <path d="M28 36C28 36 38 25 50 25C62 25 72 36 72 36C72 36 66 30 50 30C34 30 28 36 28 36Z" fill="#4CAF50" />
                <ellipse cx="50" cy="30" rx="20" ry="5" fill="#4CAF50" />
                
                {/* Farmer body */}
                <path d="M40 60C40 60 35 80 35 85C35 90 65 90 65 85C65 80 60 60 60 60" fill="#4CAF50" />
                <path d="M40 60C40 60 45 65 50 65C55 65 60 60 60 60C60 60 55 55 50 55C45 55 40 60 40 60Z" fill="#4CAF50" />
                
                {/* Hands */}
                <path d="M38 65L30 75" stroke="#FFDEAD" strokeWidth="4" strokeLinecap="round" />
                <path d="M62 65L70 75" stroke="#FFDEAD" strokeWidth="4" strokeLinecap="round" />
                
                {/* Plant in hand */}
                <path d="M30 75C30 75 25 74 25 72C25 70 28 68 30 69" stroke="#4CAF50" strokeWidth="1.5" />
                <path d="M30 75C30 75 28 70 30 68C32 66 35 69 34 71" stroke="#4CAF50" strokeWidth="1.5" />
                <path d="M30 75L30 82" stroke="#8D6E63" strokeWidth="1.5" />
                
                {/* Water droplet in other hand */}
                <path d="M70 75C70 75 70 70 72 69C74 68 76 70 74 72" stroke="#2196F3" strokeWidth="1.5" fill="#BBDEFB" />
                <path d="M70 75C70 75 72 70 73 72C74 74 72 77 70 75Z" fill="#BBDEFB" stroke="#2196F3" strokeWidth="1.5" />
                
                {/* Sparkle effects */}
                <circle cx="25" cy="67" r="1" fill="#FFEB3B" className="sparkle1" />
                <circle cx="76" cy="71" r="1" fill="#FFEB3B" className="sparkle2" />
                <circle cx="70" cy="60" r="1" fill="#FFEB3B" className="sparkle3" />
              </svg>
            </div>
          </div>
          
          {/* App version and credits */}
          <div className="text-center text-xs text-muted-foreground mt-1 opacity-50 mb-2 pl-4">
            Powered by JalDhara v1.0 • Made with 💚 for Indian Farmers
          </div>
        </DialogContent>
      </Dialog>
      
      <style>
        {`
          @keyframes sound-wave {
            0%, 100% { height: 2px; }
            50% { height: 8px; }
          }
          .animate-sound-wave {
            animation: sound-wave 1s infinite;
          }
          .listening-active {
            background-color: var(--earth);
            box-shadow: 0 0 0 0 rgba(77, 124, 15, 0.7);
            animation: pulse-listening 2s infinite;
          }
          @keyframes pulse-listening {
            0% {
              box-shadow: 0 0 0 0 rgba(77, 124, 15, 0.7);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(77, 124, 15, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(77, 124, 15, 0);
            }
          }
          .farmer-avatar-container {
            position: absolute;
            right: -5px;
            bottom: -15px;
            width: 90px;
            height: 90px;
            z-index: 50;
            pointer-events: none;
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
            transform: translateY(15px);
          }
          .farmer-avatar {
            width: 100%;
            height: 100%;
            transform-origin: bottom center;
          }
          
          @keyframes slight-bounce {
            0%, 100% {
              transform: translateY(0) rotate(0deg);
            }
            50% {
              transform: translateY(-5px) rotate(3deg);
            }
          }
          
          .sparkle1 {
            animation: sparkle 2s infinite ease-in-out;
            animation-delay: 0s;
          }
          
          .sparkle2 {
            animation: sparkle 2s infinite ease-in-out;
            animation-delay: 0.5s;
          }
          
          .sparkle3 {
            animation: sparkle 2s infinite ease-in-out;
            animation-delay: 1s;
          }
          
          @keyframes sparkle {
            0%, 100% {
              opacity: 0;
              transform: scale(0);
            }
            50% {
              opacity: 1;
              transform: scale(1.5);
            }
          }
          
          /* Audio visualization styles */
          .audio-visualization-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 10px;
            background-color: rgba(237, 247, 237, 0.5);
            border-radius: 12px;
            margin: 10px 0;
            position: relative;
            overflow: hidden;
          }
          
          .audio-level-container {
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            width: 100%;
            height: 60px;
          }
          
          .audio-level-bars {
            display: flex;
            align-items: flex-end;
            justify-content: center;
            gap: 4px;
            height: 100%;
            padding: 0 20px;
          }
          
          .audio-level-bar {
            width: 6px;
            background-color: var(--earth-light);
            border-radius: 3px;
            transition: height 0.1s ease;
            opacity: 0.3;
          }
          
          .audio-level-bar.active {
            opacity: 0.9;
          }
          
          .audio-pulse {
            position: absolute;
            width: 90%;
            height: 90%;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0) 70%);
            animation: pulse 1.5s infinite ease-in-out;
          }
          
          @keyframes pulse {
            0%, 100% {
              transform: scale(0.8);
              opacity: 0.3;
            }
            50% {
              transform: scale(1.2);
              opacity: 0.6;
            }
          }
          
          .recording-text {
            font-size: 12px;
            color: var(--earth-dark);
            margin-top: 5px;
            font-weight: 500;
          }
          
          @media (max-width: 640px) {
            .farmer-avatar-container {
              right: 0;
              bottom: -10px;
              width: 70px;
              height: 70px;
            }
          }
          
          /* Rain Animation Styles */
          .rain-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 40;
            overflow: hidden;
          }
          
          .raindrop {
            position: absolute;
            top: -20px;
            width: 2px;
            height: 20px;
            background: linear-gradient(to bottom, rgba(0, 120, 255, 0), rgba(0, 120, 255, 0.6));
            border-radius: 0 0 5px 5px;
            filter: drop-shadow(0 0 5px rgba(0, 120, 255, 0.3));
            opacity: 0.7;
            animation: rain-fall linear infinite;
          }
          
          .raindrop:nth-child(even) {
            width: 3px;
            height: 25px;
            opacity: 0.5;
          }
          
          .raindrop:nth-child(3n) {
            width: 4px;
            height: 22px;
            opacity: 0.3;
          }
          
          @keyframes rain-fall {
            0% {
              transform: translateY(0) rotate(0deg);
              opacity: 0;
            }
            10% {
              opacity: 0.7;
            }
            90% {
              opacity: 0.7;
            }
            100% {
              transform: translateY(650px) rotate(5deg);
              opacity: 0;
            }
          }
          
          /* Water ripple effect */
          .water-message {
            position: relative;
            overflow: hidden;
          }
          
          .water-message::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 200px;
            height: 200px;
            background: radial-gradient(circle, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0) 60%);
            border-radius: 50%;
            transform: translate(-50%, -50%) scale(0);
            animation: water-ripple 3s ease-out infinite;
            pointer-events: none;
          }
          
          @keyframes water-ripple {
            0% {
              transform: translate(-50%, -50%) scale(0);
              opacity: 0.8;
            }
            100% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 0;
            }
          }
        `}
      </style>
    </>
  );
};

export default KrishiMitraButton;