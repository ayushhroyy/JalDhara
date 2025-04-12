import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2, Bot, BrainCircuit, Wand2, Volume2, VolumeX, Droplets, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { transcribeAudio } from '@/integrations/assemblyai';
import { processVoiceQuery } from '@/integrations/gemini';

interface VoiceAssistantProps {
  language: 'en' | 'hi';
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ language }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversations, setConversations] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [visualizerData, setVisualizerData] = useState<number[]>(Array(20).fill(0));
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const autoRestartRef = useRef<boolean>(true);

  const content = {
    en: {
      title: "AI Voice Assistant",
      subtitle: "Your voice-powered farming assistant",
      initialMessage: "Hello! I'm your Kisan Jal Mitra AI assistant. How can I help you with water management and sustainable farming today?",
      recordButtonLabel: "Press to speak",
      processingText: "Processing...",
      recordingText: "Listening...",
      speakingText: "Speaking...",
      startOverText: "Clear conversation",
      noMicrophoneText: "Microphone not available",
      errorProcessingText: "Error processing audio. Please try again.",
      noSpeechDetectedText: "No speech detected. Please try again.",
    },
    hi: {
      title: "AI वॉयस असिस्टेंट",
      subtitle: "आपका वॉयस-संचालित कृषि सहायक",
      initialMessage: "नमस्ते! मैं आपका किसान जल मित्र AI सहायक हूँ। आज मैं जल प्रबंधन और टिकाऊ खेती के बारे में आपकी कैसे मदद कर सकता हूँ?",
      recordButtonLabel: "बोलने के लिए दबाएं",
      processingText: "प्रोसेसिंग...",
      recordingText: "सुन रहा हूँ...",
      speakingText: "बोल रहा हूँ...",
      startOverText: "बातचीत साफ़ करें",
      noMicrophoneText: "माइक्रोफ़ोन उपलब्ध नहीं है",
      errorProcessingText: "ऑडियो प्रोसेसिंग में त्रुटि। कृपया पुनः प्रयास करें।",
      noSpeechDetectedText: "कोई भाषण नहीं मिला। कृपया पुनः प्रयास करें।",
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

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, []);

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
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Get samples at different frequency points for visualization
    const samples = 20;
    const newData = Array(samples).fill(0);
    
    for (let i = 0; i < samples; i++) {
      const index = Math.floor(i * (dataArray.length / samples));
      // Normalize to 0-100 and add some minimum height
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
      
      // Set up audio context for visualization
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
      
      // Start recording with MediaRecorder
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
      
      // Use AssemblyAI for transcription with the provided API key
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
      
      // Add user message to conversation
      setConversations(prev => [...prev, { role: 'user', content: transcript }]);
      
      // Process with Gemini
      const aiResponse = await processVoiceQuery(transcript, language);
      
      if (aiResponse.error) {
        throw new Error(aiResponse.error);
      }
      
      // Add AI response to conversation
      setConversations(prev => [...prev, { role: 'assistant', content: aiResponse.text || 'No response' }]);
      
      // Speak the response - prevented from auto-starting recording again below
      autoRestartRef.current = true;
      speakText(aiResponse.text || '');
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
    utterance.onend = () => {
      setIsSpeaking(false);
      
      // Only auto-start recording if flag is true, helps prevent navigation issues
      if (autoRestartRef.current) {
        setTimeout(() => {
          if (!isRecording && !isProcessing && document.visibilityState === 'visible') {
            startRecording();
          }
        }, 1000);
      }
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      console.error('Speech synthesis error');
    };
    
    // Speak the text
    window.speechSynthesis.speak(utterance);
  };

  const toggleSpeaking = () => {
    if (isSpeaking) {
      // Stop speaking
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    } else {
      // Start speaking the last assistant message
      const lastAssistantMessage = conversations
        .filter(msg => msg.role === 'assistant')
        .pop();
        
      if (lastAssistantMessage) {
        // Don't auto-start recording after manual play
        autoRestartRef.current = false;
        speakText(lastAssistantMessage.content);
      }
    }
  };

  const clearConversation = () => {
    if (window.speechSynthesis && isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    
    setConversations([
      { role: 'assistant', content: content[language].initialMessage }
    ]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  // Add event listener for page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Page is hidden - stop auto recording
        autoRestartRef.current = false;
        
        // Stop any ongoing recording
        if (isRecording) {
          stopRecording();
        }
        
        // Stop any speech
        if (isSpeaking && window.speechSynthesis) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRecording, isSpeaking]);

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
              
              {/* Recording indicator */}
              {isRecording && (
                <div className="flex justify-center my-4">
                  <div className="flex items-center gap-2 bg-water/10 py-2 px-4 rounded-full">
                    <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">
                      {content[language].recordingText} {formatTime(recordingTime)}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Audio visualizer */}
              {isRecording && (
                <div className="flex justify-center items-end h-16 gap-1 px-4 mt-2">
                  {visualizerData.map((value, index) => (
                    <div 
                      key={index} 
                      className="w-1 bg-water rounded-t transition-all duration-75 ease-in-out"
                      style={{ height: `${value}%` }}
                    ></div>
                  ))}
                </div>
              )}
              
              {/* Processing indicator */}
              {isProcessing && (
                <div className="flex justify-center">
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 py-2 px-4 rounded-full">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">
                      {content[language].processingText}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Speaking indicator */}
              {isSpeaking && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 bg-water/10 py-2 px-4 rounded-full">
                    <Droplets className="h-4 w-4 text-water animate-pulse" />
                    <span className="text-sm">
                      {content[language].speakingText}
                    </span>
                  </div>
                </div>
              )}
              
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
                  disabled={conversations.length <= 1 || isProcessing || isRecording}
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  {content[language].startOverText}
                </Button>
                
                {/* Toggle speaking button - only show if we have assistant messages */}
                {conversations.some(msg => msg.role === 'assistant' && msg.content !== content[language].initialMessage) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSpeaking}
                    className={`${isSpeaking ? 'bg-water/10' : ''} text-water border-water hover:bg-water/10`}
                    disabled={isProcessing || isRecording}
                  >
                    {isSpeaking ? (
                      <VolumeX className="mr-2 h-4 w-4" />
                    ) : (
                      <Volume2 className="mr-2 h-4 w-4" />
                    )}
                    {isSpeaking ? 
                      (language === 'en' ? 'Stop Speaking' : 'बोलना बंद करें') : 
                      (language === 'en' ? 'Speak Response' : 'जवाब बोलें')
                    }
                  </Button>
                )}
              </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  variant={isRecording ? "destructive" : "default"}
                  size="lg"
                  className={`rounded-full h-16 w-16 ${
                    isRecording ? 
                      'bg-red-500 hover:bg-red-600' : 
                      'bg-water hover:bg-water-dark shadow-md water-button'
                  }`}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : isRecording ? (
                    <MicOff className="h-6 w-6" />
                  ) : (
                    <Mic className="h-6 w-6" />
                  )}
                </Button>
              </div>
              
              <p className="text-center text-sm text-muted-foreground">
                {isRecording ? 
                  (language === 'en' ? 'Click to stop recording' : 'रिकॉर्डिंग बंद करने के लिए क्लिक करें') : 
                  content[language].recordButtonLabel
                }
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default VoiceAssistant; 