# API Integration Documentation

This document outlines the API integrations used in the JalDhara application.

## AssemblyAI Integration

The application uses AssemblyAI for accurate voice recognition and transcription.

### Configuration

- API Key: `075e9e5bb22845b9bec2894522623be9`
- Endpoint: `https://api.assemblyai.com/v2/`

### Integration Files

- `src/integrations/assemblyai/index.ts`: Contains the core API integration logic

### Functions

1. **transcribeAudio**
   - Purpose: Transcribe recorded audio to text
   - Parameters: 
     - `audioBlob`: The audio blob from recording
     - `language`: 'en' or 'hi' to specify language
   - Returns:
     - Transcribed text
     - Confidence score
     - Language code
     - Error (if any)

2. **detectAudioLanguage**
   - Purpose: Automatically detect the language in an audio recording
   - Parameters:
     - `audioBlob`: The audio blob from recording
   - Returns:
     - Detected language code ('en', 'hi', or null if detection failed)

### Usage Examples

```typescript
// Transcribe audio
const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
const result = await transcribeAudio(audioBlob, 'en');
console.log(result.text); // Transcribed text

// Detect language in audio
const language = await detectAudioLanguage(audioBlob);
console.log(language); // 'en', 'hi', or null
```

## Google Gemini AI Integration

The application uses Google's Gemini AI API to provide intelligent farming advice and recommendations.

### Configuration

- API Key: `AIzaSyCxtX277t00OvICr27PnKKDYsWHE_WqAjY`
- Model: `gemini-1.0-pro`

### Integration Files

- `src/integrations/gemini/index.ts`: Contains the core API integration logic

### Functions

1. **processVoiceQuery**
   - Purpose: Process farmer's input and provide relevant sustainable farming advice
   - Parameters: 
     - `query`: The text from the farmer's voice input
     - `language`: 'en' or 'hi' to determine response language

2. **analyzeWaterUsage**
   - Purpose: Analyze farming practices and provide water conservation recommendations
   - Parameters:
     - `conversations`: Array of question/answer pairs about farming practices
     - `language`: 'en' or 'hi' to determine response language
   - Returns:
     - Recommendations for water conservation
     - Water usage data for visualization
     - Potential water savings percentage

### Usage Examples

```typescript
// Process a voice query
const response = await processVoiceQuery("I grow wheat and rice in my field", "en");
console.log(response.text); // Gemini's response

// Analyze water usage
const analysis = await analyzeWaterUsage(conversations, "en");
console.log(analysis.recommendations); // Water conservation recommendations
console.log(analysis.waterData); // Water usage data
console.log(analysis.potentialSavings); // Potential water savings percentage
```

## Weather API Integration

The application uses the WeatherAPI.com service to provide real-time weather information.

### Configuration

- API Key: `02ec49771af24aaa8e890937251204`
- Endpoint: `https://api.weatherapi.com/v1/`

### Integration Files

- `src/integrations/weather/index.ts`: Contains the weather API integration logic

### Functions

1. **getWeatherData**
   - Purpose: Fetch current weather data for a location
   - Parameters:
     - `location`: City name or coordinates
   - Returns:
     - Location name
     - Temperature (°C)
     - Weather condition
     - Humidity (%)
     - Rainfall (mm)

2. **getRainfallForecast**
   - Purpose: Get 7-day rainfall forecast data
   - Parameters:
     - `location`: City name or coordinates
   - Returns:
     - Daily rainfall data
     - Total rainfall forecast

### Usage Examples

```typescript
// Get current weather
const weather = await getWeatherData("Mumbai");
console.log(weather.temperature); // Current temperature
console.log(weather.rainfall_mm); // Current rainfall

// Get rainfall forecast
const forecast = await getRainfallForecast("Delhi");
console.log(forecast.daily); // Daily rainfall forecast
console.log(forecast.total); // Total rainfall forecast
```

## Components Using APIs

1. **EnhancedVoiceButton**: Uses AssemblyAI for voice recognition and transcription
2. **AiAdviceWidget**: Provides farming advice using Gemini API
3. **WeatherWidget**: Displays weather information using Weather API
4. **Calculator**: Uses Gemini API for analyzing water usage

## Error Handling

All API integrations include robust error handling:

1. API connection errors are caught and friendly error messages are displayed
2. Fallback data is provided when API calls fail
3. Loading states are managed to provide feedback during API calls