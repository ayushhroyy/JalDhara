import { toast } from 'sonner';

// Add proper types for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface SpeechRecognitionResult {
  text: string;
  confidence: number;
  error?: string;
}

/**
 * Check if speech recognition is available in the browser
 */
export function isSpeechRecognitionAvailable(): boolean {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Initialize speech recognition for direct user input
 * @param language Language code ('en' or 'hi')
 * @param onResult Callback when recognition result is available
 * @param onError Callback when an error occurs
 * @returns Object with start and stop methods
 */
export function initSpeechRecognition(
  language: 'en' | 'hi',
  onResult: (result: SpeechRecognitionResult) => void,
  onError?: (error: string) => void
): { start: () => void; stop: () => void } {
  if (!isSpeechRecognitionAvailable()) {
    const errorMsg = language === 'en'
      ? 'Speech recognition is not supported in your browser.'
      : 'आवाज़ पहचान आपके ब्राउज़र में समर्थित नहीं है।';
    
    toast.error(errorMsg);
    
    if (onError) {
      onError(errorMsg);
    }
    
    // Return dummy functions if speech recognition is not available
    return {
      start: () => { /* No-op */ },
      stop: () => { /* No-op */ }
    };
  }
  
  // Initialize speech recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  // Configure recognition
  recognition.lang = language === 'en' ? 'en-US' : 'hi-IN';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  
  // Set up event handlers
  recognition.onresult = (event) => {
    const result = event.results[0][0];
    onResult({
      text: result.transcript,
      confidence: result.confidence
    });
  };
  
  recognition.onerror = (event) => {
    const errorMessage = language === 'en'
      ? `Speech recognition error: ${event.error}`
      : `वाक् पहचान त्रुटि: ${event.error}`;
    
    if (onError) {
      onError(errorMessage);
    }
    
    console.error('Speech recognition error:', event.error);
  };
  
  // Return control functions
  return {
    start: () => {
      try {
        recognition.start();
        toast.info(
          language === 'en'
            ? 'Listening... Speak now'
            : 'सुन रहा हूँ... अब बोलिए'
        );
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        if (onError) {
          onError('Error starting speech recognition');
        }
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
  };
}

/**
 * Transcribe audio blob using Web Speech API
 * @param audioBlob Audio blob from recording
 * @param language Language code ('en' or 'hi')
 * @returns Promise with transcription result
 */
export function transcribeAudioWithWebSpeech(
  audioBlob: Blob,
  language: 'en' | 'hi'
): Promise<SpeechRecognitionResult> {
  return new Promise((resolve) => {
    // Check if speech recognition is available
    if (!isSpeechRecognitionAvailable()) {
      resolve({
        text: '',
        confidence: 0,
        error: 'Speech recognition not available'
      });
      return;
    }
    
    try {
      // Create audio URL from blob
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Configure recognition
      recognition.lang = language === 'en' ? 'en-US' : 'hi-IN';
      recognition.continuous = true;
      recognition.interimResults = false;
      
      let finalTranscript = '';
      
      // Set up event handlers
      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          }
        }
      };
      
      recognition.onerror = () => {
        audio.pause();
        URL.revokeObjectURL(audioUrl);
        recognition.stop();
        
        resolve({
          text: finalTranscript.trim(),
          confidence: 0.5,
          error: finalTranscript.trim() ? undefined : 'No speech detected'
        });
      };
      
      recognition.onend = () => {
        URL.revokeObjectURL(audioUrl);
        
        resolve({
          text: finalTranscript.trim(),
          confidence: finalTranscript.trim() ? 0.7 : 0,
          error: finalTranscript.trim() ? undefined : 'No speech detected'
        });
      };
      
      // Start recognition and play audio
      recognition.start();
      
      audio.play().catch(error => {
        console.error('Error playing audio for transcription:', error);
        recognition.stop();
        URL.revokeObjectURL(audioUrl);
        
        resolve({
          text: '',
          confidence: 0,
          error: 'Error playing audio'
        });
      });
      
      // Stop recognition when audio ends
      audio.onended = () => {
        setTimeout(() => {
          recognition.stop();
        }, 500); // Allow a little extra time for processing
      };
      
    } catch (error) {
      console.error('Error in Web Speech API transcription:', error);
      
      resolve({
        text: '',
        confidence: 0,
        error: 'Transcription error'
      });
    }
  });
} 