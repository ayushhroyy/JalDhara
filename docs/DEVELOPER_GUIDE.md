# Developer Guide - API Integrations

This guide explains how to work with the API integrations in the JalDhara application.

## AssemblyAI Integration

### Setting Up

The AssemblyAI integration is located in `src/integrations/assemblyai/index.ts`. To work with this integration:

1. The API key is already configured in the integration file:
   ```typescript
   const API_KEY = "075e9e5bb22845b9bec2894522623be9";
   ```

2. Import the necessary functions in your component:
   ```typescript
   import { transcribeAudio, detectAudioLanguage } from '@/integrations/assemblyai';
   ```

3. To use the API, you need to capture audio using the Web Audio API:
   ```typescript
   // Example: Recording audio
   const mediaRecorder = new MediaRecorder(stream);
   const audioChunks = [];
   
   mediaRecorder.ondataavailable = (event) => {
     if (event.data.size > 0) {
       audioChunks.push(event.data);
     }
   };
   
   mediaRecorder.onstop = async () => {
     const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
     const result = await transcribeAudio(audioBlob, 'en');
     console.log(result.text); // Transcribed text
   };
   
   mediaRecorder.start();
   // Later, call mediaRecorder.stop() to end recording
   ```

### Adding New Voice Recognition Features

To add a new voice recognition feature:

1. Define a new function in `src/integrations/assemblyai/index.ts`:
   ```typescript
   export async function customVoiceFeature(
     audioBlob: Blob,
     options: any
   ): Promise<CustomResultType> {
     try {
       // Step 1: Upload the audio file to AssemblyAI
       const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
         method: 'POST',
         headers: {
           'Authorization': API_KEY
         },
         body: audioBlob
       });
       
       // Add your custom implementation here...
       
       return { /* your response data */ };
     } catch (error) {
       console.error("Error with custom voice feature:", error);
       return { /* fallback response */ };
     }
   }
   ```

2. Use the new function in your component:
   ```typescript
   const result = await customVoiceFeature(audioBlob, options);
   ```

## Google Gemini AI Integration

### Setting Up

The Gemini API integration is located in `src/integrations/gemini/index.ts`. To work with this integration:

1. Ensure you have the Google Generative AI SDK installed:
   ```
   npm install @google/generative-ai
   ```

2. The API key is already configured in the integration file:
   ```typescript
   const API_KEY = "AIzaSyCxtX277t00OvICr27PnKKDYsWHE_WqAjY";
   const genAI = new GoogleGenerativeAI(API_KEY);
   ```

3. Import the necessary functions in your component:
   ```typescript
   import { processVoiceQuery, analyzeWaterUsage } from '@/integrations/gemini';
   ```

### Adding New AI Features

To add a new AI feature:

1. Define a new function in `src/integrations/gemini/index.ts`:
   ```typescript
   export async function newAiFeature(
     input: string,
     language: 'en' | 'hi'
   ): Promise<SomeResponseType> {
     try {
       const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
       
       const languageInstruction = language === 'en' 
         ? "Please respond in English." 
         : "कृपया हिंदी में जवाब दें।";
       
       const prompt = `Your prompt instructions here...
       
       User input: "${input}"
       
       ${languageInstruction}`;
       
       const result = await model.generateContent(prompt);
       const response = await result.response;
       const text = response.text();
       
       // Process the response as needed
       
       return { /* your response data */ };
     } catch (error) {
       console.error("Error calling Gemini API:", error);
       return { /* fallback response */ };
     }
   }
   ```

2. Use the new function in your component:
   ```typescript
   const response = await newAiFeature(userInput, language);
   ```

## Weather API Integration

### Setting Up

The Weather API integration is located in `src/integrations/weather/index.ts`. To work with this integration:

1. Import the necessary functions in your component:
   ```typescript
   import { getWeatherData, getRainfallForecast } from '@/integrations/weather';
   ```

2. The API key is already configured in the integration functions.

### Adding New Weather Features

To add a new weather feature:

1. Define a new function in `src/integrations/weather/index.ts`:
   ```typescript
   export async function newWeatherFeature(
     location: string
   ): Promise<SomeResponseType> {
     try {
       const API_KEY = "02ec49771af24aaa8e890937251204";
       const url = `https://api.weatherapi.com/v1/some-endpoint?key=${API_KEY}&q=${encodeURIComponent(location)}&additional-params`;
       
       const response = await fetch(url);
       const data = await response.json();
       
       if (data.error) {
         throw new Error(data.error.message);
       }
       
       // Process the data as needed
       
       return { /* your response data */ };
     } catch (error) {
       console.error("Error fetching weather data:", error);
       return { /* fallback response */ };
     }
   }
   ```

2. Use the new function in your component:
   ```typescript
   const weatherData = await newWeatherFeature(location);
   ```

## Best Practices

1. **Error Handling**: Always include try-catch blocks and provide fallback data
2. **Loading States**: Manage loading states in your components to provide visual feedback
3. **Caching**: Consider caching responses to reduce API calls
4. **Bilingual Support**: Ensure all user-facing responses support both English and Hindi
5. **Respect API Limits**: Be mindful of API rate limits

## Testing

When testing API integrations:

1. Create mock responses for testing components that use the APIs
2. Test error handling by simulating network errors
3. Verify that fallback data is provided when APIs fail
4. Test both language options to ensure bilingual support works correctly

## Example Component

Here's an example of a component that uses voice recognition with AssemblyAI:

```typescript
import React, { useState, useRef } from 'react';
import { transcribeAudio } from '@/integrations/assemblyai';
import { processVoiceQuery } from '@/integrations/gemini';

interface VoiceComponentProps {
  language: 'en' | 'hi';
}

const VoiceComponent: React.FC<VoiceComponentProps> = ({ language }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = processRecording;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const processRecording = async () => {
    setIsProcessing(true);
    
    try {
      // Create audio blob from chunks
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Use AssemblyAI to transcribe audio
      const transcriptionResult = await transcribeAudio(audioBlob, language);
      
      if (transcriptionResult.error) {
        throw new Error(transcriptionResult.error);
      }
      
      if (!transcriptionResult.text.trim()) {
        throw new Error('No speech detected');
      }

      // Process the transcribed text with Gemini
      const geminiResponse = await processVoiceQuery(transcriptionResult.text, language);
      setResponse(geminiResponse.text);
    } catch (error) {
      console.error("Error processing voice:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      {/* Component UI */}
    </div>
  );
};

export default VoiceComponent;
``` 