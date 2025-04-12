import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { processVoiceQuery } from '@/integrations/gemini';
import { transcribeAudio } from '@/integrations/assemblyai';

interface UnifiedVoiceButtonProps {
  onVoiceData?: (text: string) => void;
  onResponseData?: (text: string) => void;
  language: 'en' | 'hi';
  variant?: 'primary' | 'secondary' | 'circle' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  showText?: boolean;
  withVisualizer?: boolean;
  className?: string;
}

const UnifiedVoiceButton: React.FC<UnifiedVoiceButtonProps> = ({
  onVoiceData,
  onResponseData,
  language,
  variant = 'primary',
  size = 'default',
  showText = false,
  withVisualizer = false,
  className = ''
}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [microphoneAvailable, setMicrophoneAvailable] = useState<boolean>(true);
  const [recordingTime, setRecordingTime] = useState(0);
  const [visualizerData, setVisualizerData] = useState<number[]>(Array(10).fill(0));
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  const content = {
    en: {
      recordButtonLabel: "Speak",
      processingText: "Processing...",
      recordingText: "Listening...",
      speakingText: "Speaking...",
      noMicrophoneText: "Microphone not available",
      errorProcessingText: "Error processing audio. Please try again.",
      noSpeechDetectedText: "No speech detected. Please try again.",
      stopRecordingText: "Stop",
      successText: "Voice processed successfully!"
    },
    hi: {
      recordButtonLabel: "बोलें",
      processingText: "प्रोसेसिंग...",
      recordingText: "सुन रहा हूँ...",
      speakingText: "बोल रहा हूँ...",
      noMicrophoneText: "माइक्रोफ़ोन उपलब्ध नहीं है",
      errorProcessingText: "ऑडियो प्रोसेसिंग में त्रुटि। कृपया पुनः प्रयास करें।",
      noSpeechDetectedText: "कोई भाषण नहीं मिला। कृपया पुनः प्रयास करें।",
      stopRecordingText: "रोकें",
      successText: "आवाज़ सफलतापूर्वक प्रोसेस की गई!"
    }
  };

  // Check if microphone is available
  useEffect(() => {
    const checkMicrophoneAvailability = async () => {
      if (!window.isSecureContext) {
        console.warn("Microphone access requires HTTPS (except on localhost)");
        setMicrophoneAvailable(false);
        return;
      }
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn("Media devices API not available in this browser");
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

  // Cleanup all resources on unmount
  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, []);

  // Save language preference whenever it changes
  useEffect(() => {
    localStorage.setItem('userLanguagePreference', language);
  }, [language]);

  const cleanupResources = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    
    if (window.speechSynthesis && isSpeaking) {
      window.speechSynthesis.cancel();
    }
  };

  const updateVisualizerData = () => {
    if (!analyserRef.current || !withVisualizer) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const samples = 10;
    const newData = Array(samples).fill(0);
    
    for (let i = 0; i < samples; i++) {
      const index = Math.floor(i * (dataArray.length / samples));
      newData[i] = Math.max(10, (dataArray[index] / 255) * 100);
    }
    
    setVisualizerData(newData);
    animationFrameRef.current = requestAnimationFrame(updateVisualizerData);
  };

  const startRecording = async () => {
    if (isRecording || isProcessing || isSpeaking) return;
    
    try {
      if (window.speechSynthesis && isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio context for visualization if needed
      if (withVisualizer) {
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }
        
        if (audioContextRef.current && !analyserRef.current) {
          const source = audioContextRef.current.createMediaStreamSource(stream);
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          source.connect(analyserRef.current);
        }
        
        // Start visualization
        if (analyserRef.current) {
          updateVisualizerData();
        }
      }
      
      // Start recording
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = async () => {
        await processRecording();
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast.info(content[language].recordingText, { duration: 2000 });
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error(content[language].noMicrophoneText);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Stop visualization
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      setIsRecording(false);
    }
  };

  const processRecording = async () => {
    setIsProcessing(true);
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Use AssemblyAI for transcription
      const transcriptionResult = await transcribeAudio(audioBlob, language);
      
      if (transcriptionResult.error) {
        throw new Error(transcriptionResult.error);
      }
      
      const transcript = transcriptionResult.text;
      
      if (!transcript.trim()) {
        toast.error(content[language].noSpeechDetectedText);
        setIsProcessing(false);
        return;
      }
      
      // Provide the transcription to parent component
      if (onVoiceData) {
        onVoiceData(transcript);
      }
      
      // Process with Gemini
      const aiResponse = await processVoiceQuery(transcript, language);
      
      if (aiResponse.error) {
        throw new Error(aiResponse.error);
      }
      
      // Provide the AI response to parent component
      if (onResponseData) {
        onResponseData(aiResponse.text || '');
      }
      
      // Speak the response
      speakText(aiResponse.text || '');
      
      toast.success(content[language].successText);
    } catch (error) {
      console.error("Error processing recording:", error);
      toast.error(content[language].errorProcessingText);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      toast.error(language === 'en' 
        ? 'Text-to-speech is not supported in your browser.' 
        : 'टेक्स्ट-टू-स्पीच आपके ब्राउज़र में समर्थित नहीं है।');
      return;
    }
    
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
    
    // Speak the text
    window.speechSynthesis.speak(utterance);
  };

  const toggleRecording = async () => {
    if (!microphoneAvailable) {
      toast.error(content[language].noMicrophoneText);
      return;
    }
    
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  const toggleSpeaking = () => {
    if (isSpeaking && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  // Button style classes based on variant
  let buttonClasses = '';
  let iconSize = 'h-5 w-5';
  let buttonSize = '';
  
  switch (variant) {
    case 'primary':
      buttonClasses = `bg-water hover:bg-water-dark text-white ${isRecording ? 'bg-red-500 hover:bg-red-600' : ''} ${isSpeaking ? 'bg-green-500 hover:bg-green-600' : ''}`;
      break;
    case 'secondary':
      buttonClasses = `bg-earth hover:bg-earth-dark text-white ${isRecording ? 'bg-red-500 hover:bg-red-600' : ''} ${isSpeaking ? 'bg-green-500 hover:bg-green-600' : ''}`;
      break;
    case 'outline':
      buttonClasses = `border border-water text-water hover:bg-water/10 ${isRecording ? 'border-red-500 text-red-500 hover:bg-red-50' : ''} ${isSpeaking ? 'border-green-500 text-green-500 hover:bg-green-50' : ''}`;
      break;
    case 'circle':
      buttonClasses = `rounded-full p-0 bg-water hover:bg-water-dark text-white shadow-md ${isRecording ? 'bg-red-500 hover:bg-red-600' : ''} ${isSpeaking ? 'bg-green-500 hover:bg-green-600' : ''} ${isRecording ? 'animate-pulse' : ''}`;
      break;
  }
  
  switch (size) {
    case 'sm':
      buttonSize = variant === 'circle' ? 'h-12 w-12' : '';
      iconSize = 'h-4 w-4';
      break;
    case 'default':
      buttonSize = variant === 'circle' ? 'h-14 w-14' : '';
      iconSize = 'h-5 w-5';
      break;
    case 'lg':
      buttonSize = variant === 'circle' ? 'h-16 w-16' : '';
      iconSize = 'h-6 w-6';
      break;
  }
  
  const buttonLabel = isRecording 
    ? content[language].stopRecordingText 
    : content[language].recordButtonLabel;

  const getStatusText = () => {
    if (isProcessing) return content[language].processingText;
    if (isRecording) return `${content[language].recordingText} ${formatTime(recordingTime)}`;
    if (isSpeaking) return content[language].speakingText;
    return '';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {withVisualizer && isRecording && (
        <div className="flex justify-center items-end h-12 gap-1 mb-2">
          {visualizerData.map((value, index) => (
            <div 
              key={index} 
              className="w-1 bg-water rounded-t transition-all duration-75 ease-in-out"
              style={{ height: `${value}%` }}
            ></div>
          ))}
        </div>
      )}
      
      <Button
        onClick={isProcessing ? undefined : toggleRecording}
        variant="default"
        size={size}
        className={`${buttonClasses} ${buttonSize} transition-all ${className}`}
        disabled={isProcessing || !microphoneAvailable}
        title={
          !microphoneAvailable 
            ? content[language].noMicrophoneText
            : getStatusText()
        }
      >
        {isProcessing ? (
          <Loader2 className={`${iconSize} animate-spin`} />
        ) : isSpeaking ? (
          <Volume2 className={iconSize} onClick={toggleSpeaking} />
        ) : isRecording ? (
          <MicOff className={iconSize} />
        ) : (
          <Mic className={iconSize} />
        )}
        
        {showText && !variant.includes('circle') && (
          <span className="ml-2">{buttonLabel}</span>
        )}
      </Button>
      
      {getStatusText() && showText && (
        <div className="text-xs text-muted-foreground mt-1">
          {getStatusText()}
        </div>
      )}
    </div>
  );
};

export default UnifiedVoiceButton; 