import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Loader2, X, Pause, RotateCw, Send, Droplets, Waves } from 'lucide-react';
import { toast } from 'sonner';
import { processVoiceQuery } from '@/integrations/gemini';
import { transcribeAudio } from '@/integrations/assemblyai';

// Add the necessary type declarations for the Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: 'en' | 'hi';
  onVoiceData?: (text: string) => void;
}

const VoiceDialog: React.FC<VoiceDialogProps> = ({
  open,
  onOpenChange,
  language,
  onVoiceData
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant'; content: string}[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [visualizerData, setVisualizerData] = useState<number[]>(Array(20).fill(0));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language === 'en' ? 'en-US' : 'hi-IN';
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          // Process the transcript
          processTranscription(transcript);
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        toast.error(
          language === 'en'
            ? `Speech recognition error: ${event.error}`
            : `वाक् पहचान त्रुटि: ${event.error}`
        );
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    } else {
      toast.error(
        language === 'en'
          ? 'Speech recognition is not supported in your browser.'
          : 'आपके ब्राउज़र में वाक् पहचान समर्थित नहीं है।'
      );
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    };
  }, [language]);

  // Clean up when dialog closes
  useEffect(() => {
    if (!open) {
      if (isRecording) {
        stopRecording();
      }
      if (isSpeaking) {
        stopSpeaking();
      }
      // Reset states when dialog closes
      setTimeout(() => {
        setMessages([]);
        setTextInput('');
        setRecordingTime(0);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      }, 300);
    } else if (open && messages.length === 0) {
      // Auto-start recording when opened
      setTimeout(() => {
        startRecording();
      }, 1000);
    }
  }, [open, isRecording, isSpeaking]);

  // Auto-restart mic after speaking finishes
  useEffect(() => {
    if (!isSpeaking && messages.length > 0 && !isRecording && !isProcessing && open) {
      // Delay a bit before restarting the mic
      const timer = setTimeout(() => {
        if (open) startRecording();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isSpeaking, messages.length, isRecording, isProcessing, open]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isRecording && recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
      }
      if (isSpeaking) {
        window.speechSynthesis.cancel();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [isRecording, isSpeaking]);

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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        await processAudioBlob(audioBlob);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast.info(
        language === 'en' 
          ? 'Listening... Tell me about your farm.' 
          : 'सुन रहा हूँ... मुझे अपने खेत के बारे में बताएं।',
        { duration: 2000 }
      );
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error(
        language === 'en' 
          ? 'Failed to access microphone. Please check permissions.'
          : 'माइक्रोफ़ोन तक पहुंचने में विफल। कृपया अनुमतियां जांचें।'
      );
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

  const processAudioBlob = async (blob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Use AssemblyAI for transcription
      const transcriptionResult = await transcribeAudio(blob, language);
      
      if (transcriptionResult.error) {
        throw new Error(transcriptionResult.error);
      }
      
      const transcript = transcriptionResult.text;
      
      if (!transcript.trim()) {
        toast.error(
          language === 'en'
            ? 'Could not detect any speech. Please try again.'
            : 'कोई भाषण नहीं मिला। कृपया पुनः प्रयास करें।'
        );
        setIsProcessing(false);
        return;
      }
      
      // Process the transcript
      await processTranscription(transcript);
    } catch (error) {
      console.error("Error processing audio:", error);
      toast.error(
        language === 'en'
          ? 'Error processing audio. Please try again.'
          : 'ऑडियो प्रोसेसिंग में त्रुटि। कृपया पुनः प्रयास करें।'
      );
      setIsProcessing(false);
    }
  };

  const processTranscription = async (transcript: string) => {
    try {
      // Add user message
      setMessages(prev => [...prev, { role: 'user', content: transcript }]);
      
      // Notify parent component if callback is provided
      if (onVoiceData) {
        onVoiceData(transcript);
      }
      
      // Process with Gemini
      const aiResponse = await processVoiceQuery(transcript, language);
      
      // Add AI response
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse.text || 'No response received' }]);
      
      // Speak the response
      speakText(aiResponse.text || '');
    } catch (error) {
      console.error("Error processing voice:", error);
      toast.error(
        language === 'en'
          ? 'Error processing voice. Please try again.'
          : 'आवाज़ प्रोसेसिंग में त्रुटि। कृपया पुनः प्रयास करें।'
      );
      
      // Add error message
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: language === 'en' 
          ? 'Sorry, I encountered an error. Please try again.' 
          : 'क्षमा करें, मुझे एक त्रुटि मिली। कृपया पुनः प्रयास करें।' 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!textInput.trim()) return;
    
    // Stop recording and speaking if active
    if (isRecording) {
      stopRecording();
    }
    if (isSpeaking) {
      stopSpeaking();
    }
    
    const userInput = textInput.trim();
    setTextInput('');
    setIsProcessing(true);
    
    await processTranscription(userInput);
  };

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
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    if (isSpeaking) {
      stopSpeaking();
    }
    setTimeout(() => {
      startRecording();
    }, 500);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-hidden flex flex-col bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-slate-800 border-water">
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-water" />
            <h2 className="text-xl font-semibold text-water-dark">
              {language === 'en' ? 'Water Assistant' : 'जल सहायक'}
            </h2>
          </div>
          <Button
            variant="ghost" 
            size="icon"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Welcome message shown at the start */}
          {messages.length === 0 && (
            <div className="bg-water/10 p-4 rounded-lg mb-4 border border-water/20">
              <p>
                {language === 'en' 
                  ? 'Hello! I\'m your Water Assistant. Tell me about your farm and I\'ll help you analyze your water usage and provide recommendations.'
                  : 'नमस्ते! मैं आपका जल सहायक हूँ। मुझे अपने खेत के बारे में बताएं और मैं आपके जल उपयोग का विश्लेषण करने और सिफारिशें प्रदान करने में आपकी मदद करूँगा।'}
              </p>
            </div>
          )}
          
          {/* Conversation messages */}
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-water text-white rounded-tr-none'
                    : 'bg-gray-100 dark:bg-slate-700 rounded-tl-none'
                }`}
              >
                <p>{message.content}</p>
              </div>
            </div>
          ))}
          
          {/* Recording indicator */}
          {isRecording && (
            <div className="flex justify-center my-4">
              <div className="flex items-center gap-2 bg-water/10 py-2 px-4 rounded-full">
                <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm">
                  {language === 'en' ? 'Recording' : 'रिकॉर्डिंग'} {formatTime(recordingTime)}
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
                  {language === 'en' ? 'Processing...' : 'प्रोसेसिंग...'}
                </span>
              </div>
            </div>
          )}
          
          {/* Speaking indicator */}
          {isSpeaking && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 py-2 px-4 rounded-full">
                <Waves className="h-4 w-4 text-water animate-pulse" />
                <span className="text-sm">
                  {language === 'en' ? 'Speaking...' : 'बोल रहा है...'}
                </span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="flex flex-col gap-2 pt-2 border-t">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={clearConversation}
              className="rounded-full"
              title={language === 'en' ? 'Clear conversation' : 'वार्तालाप साफ़ करें'}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            
            <form onSubmit={handleTextSubmit} className="flex-1 flex gap-2">
              <Input
                placeholder={language === 'en' ? 'Type a message...' : 'एक संदेश लिखें...'}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="flex-1 focus-visible:ring-water"
                disabled={isProcessing}
              />
              <Button 
                type="submit"
                disabled={!textInput.trim() || isProcessing}
                className="bg-water hover:bg-water-dark rounded-full"
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
          
          <div className="flex justify-center">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? "destructive" : "default"}
              size="lg"
              className={`rounded-full h-12 w-12 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-water hover:bg-water-dark'}`}
              disabled={isProcessing || isSpeaking}
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceDialog; 