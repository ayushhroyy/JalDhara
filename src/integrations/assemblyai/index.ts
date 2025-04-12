const API_KEY = "a6d157d21a8b4341a2f0bbf9f4b74a19";

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language_code?: string;
  error?: string;
}

/**
 * Transcribe audio using AssemblyAI
 * @param audioBlob Audio blob from the recording
 * @param language Language code for transcription (en, hi)
 */
export async function transcribeAudio(
  audioBlob: Blob,
  language: 'en' | 'hi' = 'en'
): Promise<TranscriptionResult> {
  try {
    // Check if the browser has the Web Speech API recognition capabilities
    // and use it as a fallback if AssemblyAI fails
    const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 
                               'SpeechRecognition' in window;
    
    // Step 1: Upload the audio file to AssemblyAI
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': API_KEY
      },
      body: audioBlob
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed with status: ${uploadResponse.status}`);
    }

    const uploadData = await uploadResponse.json();
    const audioUrl = uploadData.upload_url;

    // Step 2: Start the transcription with the audio URL
    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_code: language === 'hi' ? 'hi' : 'en',
        punctuate: true,
        format_text: true
      })
    });

    if (!transcriptResponse.ok) {
      throw new Error(`Transcription request failed with status: ${transcriptResponse.status}`);
    }

    const transcriptData = await transcriptResponse.json();
    const transcriptId = transcriptData.id;

    // Step 3: Poll for the transcription result
    let result: any;
    let status = 'processing';
    let pollingAttempts = 0;
    const maxPollingAttempts = 30; // Maximum polling attempts (30 seconds)

    while ((status === 'processing' || status === 'queued') && pollingAttempts < maxPollingAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before polling again
      pollingAttempts++;
      
      const pollingResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        method: 'GET',
        headers: {
          'Authorization': API_KEY
        }
      });

      if (!pollingResponse.ok) {
        throw new Error(`Polling failed with status: ${pollingResponse.status}`);
      }

      result = await pollingResponse.json();
      status = result.status;
    }

    if (status === 'error') {
      throw new Error(`Transcription error: ${result.error}`);
    }

    if (status === 'completed') {
      return {
        text: result.text,
        confidence: result.confidence,
        language_code: result.language_code
      };
    } else {
      throw new Error(`Unexpected status: ${status} or polling timed out`);
    }
  } catch (error) {
    console.error("Error transcribing audio:", error);
    
    // If there's an error with AssemblyAI, return a friendly error message
    return {
      text: "",
      confidence: 0,
      error: "Could not transcribe audio. Please try again or check your internet connection."
    };
  }
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