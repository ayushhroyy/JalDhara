/**
 * Speech services using Google Translate's unofficial APIs
 * for both text-to-speech and speech recognition
 */

import { transcribeAudioWithWebSpeech, SpeechRecognitionResult } from './speech-recognition';

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language_code?: string;
  error?: string;
}

/**
 * Play text using Google Translate's TTS service
 * @param text Text to speak
 * @param language Language code ('en' or 'hi')
 */
export function playTTS(text: string, language: 'en' | 'hi' = 'en'): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Clear any existing audio
      window.speechSynthesis?.cancel();
      
      // Convert language code for Google Translate
      const langCode = language === 'hi' ? 'hi' : 'en';
      
      // Since direct access to Google Translate TTS might have CORS issues,
      // we'll use a more compatible approach
      
      // APPROACH 1: Use Web Speech API first if available (most browsers)
      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Try to find a voice for the specified language
        const voices = window.speechSynthesis.getVoices();
        
        // Filter for voices in the specified language
        const languageVoices = voices.filter(voice => 
          voice.lang.startsWith(langCode === 'hi' ? 'hi' : 'en')
        );
        
        // Use a voice in the specified language if available
        if (languageVoices.length > 0) {
          utterance.voice = languageVoices[0];
          utterance.lang = languageVoices[0].lang;
        } else {
          // Fallback to setting just the language
          utterance.lang = langCode === 'hi' ? 'hi-IN' : 'en-US';
        }
        
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        utterance.onend = () => {
          resolve();
        };
        
        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          // If Web Speech API fails, fall back to approach 2
          fallbackToAudioElement(text, langCode, resolve, reject);
        };
        
        window.speechSynthesis.speak(utterance);
        return;
      }
      
      // If Web Speech API is not available, use audio element directly
      fallbackToAudioElement(text, langCode, resolve, reject);
      
    } catch (error) {
      console.error('Error in TTS playback:', error);
      // If all else fails, try the final fallback
      try {
        finalFallback(text, language, resolve, reject);
      } catch (err) {
        reject(error);
      }
    }
  });
}

/**
 * Fallback method using audio element with proxy
 */
function fallbackToAudioElement(
  text: string, 
  langCode: string, 
  resolve: () => void, 
  reject: (error: any) => void
) {
  try {
    // Encode text to make it URL-safe
    const encodedText = encodeURIComponent(text);
    
    // Use CORS proxy to avoid direct request issues
    // We'll use a simple client-side approach rather than requiring a proxy server
    // The only proxy approach that actually works in browsers consistently is using 
    // a custom proxy server or a direct API call to a service
    
    // Use data URI approach - Convert text to speech on the client side
    // This uses browser's speech synthesis API but wrapped in a way to avoid CORS
    const audio = document.createElement('audio');
    audio.style.display = 'none';
    document.body.appendChild(audio);
    
    audio.onended = () => {
      document.body.removeChild(audio);
      resolve();
    };
    
    audio.onerror = (error) => {
      document.body.removeChild(audio);
      console.error('Fallback audio playback failed:', error);
      finalFallback(text, langCode === 'hi' ? 'hi' : 'en', resolve, reject);
    };
    
    // Try loading the audio
    // Note: This may fail due to CORS, but we're trying multiple approaches
    try {
      // Try AllOrigins proxy (may work in some cases)
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
        `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${langCode}&client=tw-ob`
      )}`;
      
      audio.src = proxyUrl;
      audio.play().catch(error => {
        console.error('Proxy audio playback failed:', error);
        document.body.removeChild(audio);
        finalFallback(text, langCode === 'hi' ? 'hi' : 'en', resolve, reject);
      });
    } catch (error) {
      document.body.removeChild(audio);
      finalFallback(text, langCode === 'hi' ? 'hi' : 'en', resolve, reject);
    }
  } catch (error) {
    console.error('Error in audio element fallback:', error);
    finalFallback(text, langCode === 'hi' ? 'hi' : 'en', resolve, reject);
  }
}

/**
 * Final fallback using Web Speech API without Google's voices
 */
function finalFallback(
  text: string, 
  language: 'en' | 'hi', 
  resolve: () => void, 
  reject: (error: any) => void
) {
  if (!window.speechSynthesis) {
    console.error('Speech synthesis not available');
    reject(new Error('Speech synthesis not available'));
    return;
  }
  
  // Use simple speech synthesis as final fallback
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
  
  utterance.onend = () => {
    resolve();
  };
  
  utterance.onerror = (event) => {
    console.error('Final fallback speech synthesis error:', event);
    reject(event);
  };
  
  window.speechSynthesis.speak(utterance);
}

/**
 * Transcribe audio blob using Web Speech API
 * This is a simplified implementation that works directly with the audio blob
 * @param audioBlob Audio blob from recording
 * @param language Language code ('en' or 'hi')
 */
export async function transcribeAudio(
  audioBlob: Blob,
  language: 'en' | 'hi' = 'en'
): Promise<TranscriptionResult> {
  try {
    // Use our standardized WebSpeech implementation
    const result = await transcribeAudioWithWebSpeech(audioBlob, language);
    
    return {
      text: result.text,
      confidence: result.confidence,
      language_code: language === 'hi' ? 'hi-IN' : 'en-US',
      error: result.error
    };
    
  } catch (error) {
    console.error("Speech recognition failed:", error);
    
    // Return empty result on failure
    return {
      text: "",
      confidence: 0,
      language_code: language === 'hi' ? 'hi-IN' : 'en-US'
    };
  }
}

// Replace simplified Speech to Text with our standardized implementation
// This will be kept for backward compatibility
// but will now delegate to the new standardized version
async function simplifiedSpeechToText(audioBlob: Blob, language: 'en' | 'hi'): Promise<TranscriptionResult> {
  try {
    const result = await transcribeAudioWithWebSpeech(audioBlob, language);
    
    return {
      text: result.text,
      confidence: result.confidence,
      language_code: language === 'hi' ? 'hi-IN' : 'en-US',
      error: result.error
    };
  } catch (error) {
    console.error("Error in simplified speech to text:", error);
    return {
      text: "",
      confidence: 0,
      language_code: language === 'hi' ? 'hi-IN' : 'en-US'
    };
  }
}

/**
 * Convert Blob to base64 string
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Direct transcription method for development and testing
 * This simulates Google Translation by using fixed common phrases
 */
export function simulateTranscription(audioBlob: Blob, language: 'en' | 'hi'): Promise<TranscriptionResult> {
  return new Promise((resolve) => {
    // For development purposes, return a fake transcription
    // In production, this would be replaced with actual Google API calls
    
    setTimeout(() => {
      // Randomly select a farming-related phrase based on language
      const enPhrases = [
        "What crops are good for water conservation?",
        "How much water does rice need?",
        "When should I plant wheat?",
        "Tell me about drip irrigation",
        "How to prevent pest attacks on my farm?",
        "What fertilizer should I use for tomatoes?"
      ];
      
      const hiPhrases = [
        "पानी संरक्षण के लिए कौन सी फसलें अच्छी हैं?",
        "चावल को कितने पानी की आवश्यकता होती है?",
        "मुझे गेहूं कब लगाना चाहिए?",
        "ड्रिप सिंचाई के बारे में बताएं",
        "अपने खेत पर कीट हमलों को कैसे रोकें?",
        "टमाटर के लिए कौन सा उर्वरक इस्तेमाल करना चाहिए?"
      ];
      
      const phrases = language === 'hi' ? hiPhrases : enPhrases;
      const randomIndex = Math.floor(Math.random() * phrases.length);
      
      resolve({
        text: phrases[randomIndex],
        confidence: 0.8,
        language_code: language === 'hi' ? 'hi-IN' : 'en-US'
      });
    }, 1500); // Simulate API delay
  });
}

/**
 * Detect language of speech (placeholder function)
 * In a real implementation, you would use Google's language detection API
 */
export async function detectSpeechLanguage(audioBlob: Blob): Promise<'en' | 'hi' | null> {
  // For simplicity, we'll just return the default language
  // In a real app, you would use Google's language detection API
  return 'en';
} 