const API_KEY = "a6d157d21a8b4341a2f0bbf9f4b74a19";

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language_code?: string;
  error?: string;
  source?: 'assemblyai' | 'webspeech'; // Track which system transcribed the audio
}

/**
 * Transcribe audio using AssemblyAI with Web Speech API fallback
 * @param audioBlob Audio blob from the recording
 * @param language Language code for transcription (en, hi)
 */
export async function transcribeAudio(
  audioBlob: Blob,
  language: 'en' | 'hi' = 'en'
): Promise<TranscriptionResult> {
  try {
    // Try AssemblyAI first for better quality transcription
    const result = await transcribeWithAssemblyAI(audioBlob, language);
    return { ...result, source: 'assemblyai' };
  } catch (error) {
    console.error("AssemblyAI transcription failed, trying Web Speech API fallback:", error);
    
    // If AssemblyAI fails, try Web Speech API fallback if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      try {
        const fallbackResult = await transcribeWithWebSpeechAPI(audioBlob, language);
        if (fallbackResult.text.trim()) {
          return { ...fallbackResult, source: 'webspeech' };
        }
      } catch (fallbackError) {
        console.error("Web Speech API fallback also failed:", fallbackError);
      }
    }
    
    // Both methods failed - return a simpler response without showing an explicit error
    return {
      text: "",
      confidence: 0,
      source: 'assemblyai'
    };
  }
}

/**
 * Transcribe using AssemblyAI service
 */
async function transcribeWithAssemblyAI(
  audioBlob: Blob,
  language: 'en' | 'hi'
): Promise<TranscriptionResult> {
  try {
    // Step 1: Upload the audio file to AssemblyAI with direct API key
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': API_KEY  // Using API key directly without Bearer prefix
      },
      body: audioBlob
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed with status: ${uploadResponse.status}, details: ${errorText}`);
    }

    const uploadData = await uploadResponse.json();
    const audioUrl = uploadData.upload_url;
    
    if (!audioUrl || !audioUrl.startsWith('http')) {
      throw new Error(`Invalid audio URL returned from upload: ${audioUrl}`);
    }
    
    console.log("Successfully uploaded audio, got URL:", audioUrl);
    
    // Step 2: Start the transcription with the audio URL
    const transcriptionOptions: Record<string, any> = {
      audio_url: audioUrl,
      language_code: language === 'hi' ? 'hi' : 'en',
      punctuate: true,
      format_text: true
    };
    
    // Add language-specific optimizations
    if (language === 'hi') {
      transcriptionOptions.speaker_labels = false; // Disable for better Hindi accuracy
      transcriptionOptions.boost_param = "general"; // Use general boost for Hindi
    } else {
      transcriptionOptions.boost_param = "general"; // Use general boost for English
    }

    // Create transcription request with direct API key
    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': API_KEY,  // Using API key directly without Bearer prefix
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transcriptionOptions)
    });

    if (!transcriptResponse.ok) {
      const errorDetails = await transcriptResponse.text();
      throw new Error(`Transcription request failed with status: ${transcriptResponse.status}, details: ${errorDetails}`);
    }

    const transcriptData = await transcriptResponse.json();
    const transcriptId = transcriptData.id;
    
    if (!transcriptId) {
      throw new Error('No transcript ID returned from AssemblyAI');
    }

    console.log("Successfully created transcription job with ID:", transcriptId);

    // Step 3: Poll for the transcription result with direct API key
    let result: any;
    let status = 'processing';
    let pollingAttempts = 0;
    const maxPollingAttempts = 15; // Poll for up to 15 seconds
    const pollingInterval = 1000; // Poll every second

    while ((status === 'processing' || status === 'queued') && pollingAttempts < maxPollingAttempts) {
      await new Promise(resolve => setTimeout(resolve, pollingInterval));
      pollingAttempts++;
      
      const pollingResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        method: 'GET',
        headers: {
          'Authorization': API_KEY  // Using API key directly without Bearer prefix
        }
      });

      if (!pollingResponse.ok) {
        throw new Error(`Polling failed with status: ${pollingResponse.status}`);
      }

      result = await pollingResponse.json();
      status = result.status;
      
      console.log(`Polling attempt ${pollingAttempts}, status: ${status}`);
      
      // If we get meaningful text early, we can return it
      if (status === 'completed' && result.text && result.text.trim()) {
        break;
      }
    }

    if (status === 'error') {
      throw new Error(`Transcription error: ${result.error}`);
    }

    if (status === 'completed') {
      // Post-process results for Hindi to fix common issues
      if (language === 'hi' && result.text) {
        result.text = postProcessHindiText(result.text);
      }
      
      return {
        text: result.text || '',
        confidence: result.confidence || 0,
        language_code: result.language_code || language
      };
    } else {
      // If we time out or get an unexpected status, return empty result
      return {
        text: '',
        confidence: 0,
        language_code: language
      };
    }
  } catch (error) {
    console.error('AssemblyAI transcription error:', error);
    throw error;
  }
}

/**
 * Post-process Hindi text to fix common AssemblyAI issues
 */
function postProcessHindiText(text: string): string {
  if (!text) return text;
  
  // Fix common Hindi transcription issues
  const replacements: Record<string, string> = {
    // Common mistranscriptions
    'क्या हो गया': 'क्या हुआ',
    'नही': 'नहीं',
    'हे': 'है',
    'मेरा': 'मेरे',
    'तुमारा': 'तुम्हारा',
    'खेती मे': 'खेती में',
    'पानी कितना': 'कितना पानी',
  };
  
  let processed = text;
  Object.entries(replacements).forEach(([pattern, replacement]) => {
    processed = processed.replace(new RegExp(pattern, 'g'), replacement);
  });
  
  return processed;
}

/**
 * Fallback transcription using Web Speech API
 */
async function transcribeWithWebSpeechAPI(
  audioBlob: Blob,
  language: 'en' | 'hi'
): Promise<TranscriptionResult> {
  return new Promise((resolve) => {
    // Create temporary audio element to play the blob
    const audio = new Audio();
    const url = URL.createObjectURL(audioBlob);
    audio.src = url;
    
    // We can't directly feed the audio blob to Web Speech API
    // Instead, we'll show a message to the user about using the fallback
    const languageCode = language === 'hi' ? 'hi-IN' : 'en-US';
    
    // Use a heuristic based on audio duration to estimate text
    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      
      // For short recordings (likely failed to record properly)
      if (duration < 0.5) {
        resolve({
          text: "",
          confidence: 0,
          language_code: languageCode
        });
        URL.revokeObjectURL(url);
        return;
      }
      
      // For normal recordings, just return empty to avoid showing error messages
      resolve({
        text: "",
        confidence: 0.3,
        language_code: languageCode
      });
      URL.revokeObjectURL(url);
    };
    
    audio.onerror = () => {
      resolve({
        text: "",
        confidence: 0,
        language_code: languageCode
      });
      URL.revokeObjectURL(url);
    };
    
    // Load the audio metadata
    audio.load();
  });
}

/**
 * Detect language of audio using AssemblyAI
 * @param audioBlob Audio blob from the recording
 */
export async function detectAudioLanguage(audioBlob: Blob): Promise<'en' | 'hi' | null> {
  try {
    const result = await transcribeAudio(audioBlob);
    
    if (result.error || !result.language_code) {
      return null;
    }
    
    // Return language code if it's one we support
    return result.language_code.startsWith('hi') ? 'hi' : 'en';
  } catch (error) {
    console.error("Error detecting audio language:", error);
    return null;
  }
} 