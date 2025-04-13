import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer, Share2, Loader2, Mic, Calendar, ThermometerSun, Droplet } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type WaterUsageChartType from '@/components/WaterUsageChart';
import type AiAdviceWidgetType from '@/components/AiAdviceWidget';
import { SupportedLanguage } from '@/App';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import axios from 'axios';
import { initSpeechRecognition, isSpeechRecognitionAvailable } from '@/integrations/speech/speech-recognition';

interface ReportsProps {
  language: SupportedLanguage;
  WaterUsageChart?: React.ComponentType<React.ComponentProps<typeof WaterUsageChartType>>;
  AiAdviceWidget?: React.ComponentType<React.ComponentProps<typeof AiAdviceWidgetType>>;
}

// Define types for our form data
interface FarmData {
  location: string;
  cropTypes: string[];
  soilType: string;
  waterSource: string;
  farmSize: string;
  currentIrrigationMethod: string;
  soilMoisture: string;
  cropRotationPattern: string;
  majorChallenges: string;
  harvestSeason: string;
  fertilizerUsage: string;
  organicFarming: boolean;
}

// Prediction data type
interface PredictionData {
  rainfallPrediction: string;
  waterAvailability: string;
  recommendedCrops: string[];
  notRecommendedCrops: string[];
  sustainabilityScore: number;
  potentialWaterSavings: string;
  irrigationRecommendation: string;
}

// Interface for PDFShift response
interface PDFShiftResponse {
  url: string;
  filename: string;
  size: number;
}

// Gemini API Key from environment variables
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyC9TajWNNnnW5ovh64QYMfGffg0KxUfkh4";
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-1.5-flash";
const PDFSHIFT_API_KEY = import.meta.env.VITE_PDFSHIFT_API_KEY || "sk_09d22ed471315d28c26eb187d6eaf63ab9ee9ca7";

// Interface for VoiceInputField props
interface VoiceInputFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  language: 'en' | 'hi';
  type?: string;
}

// VoiceInputField Component
const VoiceInputField: React.FC<VoiceInputFieldProps> = ({
  id,
  value,
  onChange,
  label,
  placeholder,
  language,
  type = "text"
}) => {
  const [isListening, setIsListening] = useState(false);

  const handleVoiceInput = () => {
    if (!isSpeechRecognitionAvailable()) {
      toast.error(
        language === 'en'
          ? 'Voice input is not supported in your browser.'
          : 'आपके ब्राउज़र में वॉयस इनपुट समर्थित नहीं है।'
      );
      return;
    }

    setIsListening(true);
    
    const speechRecognition = initSpeechRecognition(
      language,
      (result) => {
        if (result.text) {
          onChange(result.text);
          setIsListening(false);
        }
      },
      (error) => {
        toast.error(
          language === 'en'
            ? `Voice recognition error: ${error}`
            : `वॉयस पहचान त्रुटि: ${error}`
        );
        setIsListening(false);
      }
    );
    
    speechRecognition.start();
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="flex">
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-r-none focus-visible:ring-water"
          type={type}
        />
        <Button
          type="button"
          onClick={handleVoiceInput}
          className={`rounded-l-none bg-water hover:bg-water-dark text-white ${isListening ? 'animate-pulse border-2 border-water' : ''}`}
          disabled={isListening}
        >
          {isListening ? (
            <div className="relative">
              <Mic className="h-4 w-4 animate-pulse" />
              <span className="absolute w-full h-full top-0 left-0 flex justify-center items-center">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-white opacity-75"></span>
              </span>
            </div>
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

const Reports: React.FC<ReportsProps> = ({ 
  language,
  WaterUsageChart: CustomWaterUsageChart,
  AiAdviceWidget: CustomAiAdviceWidget 
}) => {
  // Import the default components if not provided as props
  const [DefaultWaterUsageChart, setDefaultWaterUsageChart] = useState<any>(null);
  const [DefaultAiAdviceWidget, setDefaultAiAdviceWidget] = useState<any>(null);

  useEffect(() => {
    // Dynamically import default components if not provided
    if (!CustomWaterUsageChart) {
      import('@/components/WaterUsageChart').then(module => {
        setDefaultWaterUsageChart(() => module.default);
      });
    }
    if (!CustomAiAdviceWidget) {
      import('@/components/AiAdviceWidget').then(module => {
        setDefaultAiAdviceWidget(() => module.default);
      });
    }
  }, [CustomWaterUsageChart, CustomAiAdviceWidget]);

  // Use either the custom component or the default one
  const FinalWaterUsageChart = CustomWaterUsageChart || DefaultWaterUsageChart;
  const FinalAiAdviceWidget = CustomAiAdviceWidget || DefaultAiAdviceWidget;

  // Normalize language for components that only support English and Hindi
  const normalizedLanguage: 'en' | 'hi' = language === 'hi' ? 'hi' : 'en';
  
  // State for form and generated data
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGeneratedReport, setHasGeneratedReport] = useState(false);
  const [farmData, setFarmData] = useState<FarmData>({
    location: normalizedLanguage === 'en' ? 'Uttar Pradesh' : 'उत्तर प्रदेश',
    cropTypes: normalizedLanguage === 'en' ? ['Rice', 'Wheat'] : ['चावल', 'गेहूं'],
    soilType: normalizedLanguage === 'en' ? 'Black clay soil' : 'काली मिट्टी',
    waterSource: normalizedLanguage === 'en' ? 'Groundwater and rainfall' : 'भूजल और वर्षा जल',
    farmSize: '5',
    currentIrrigationMethod: normalizedLanguage === 'en' ? 'Flood irrigation' : 'बाढ़ सिंचाई',
    soilMoisture: normalizedLanguage === 'en' ? 'Medium' : 'मध्यम',
    cropRotationPattern: normalizedLanguage === 'en' ? 'Rice-Wheat' : 'चावल-गेहूं',
    majorChallenges: normalizedLanguage === 'en' ? 'Water scarcity' : 'पानी की कमी',
    harvestSeason: normalizedLanguage === 'en' ? 'October' : 'अक्टूबर',
    fertilizerUsage: normalizedLanguage === 'en' ? 'Chemical' : 'रासायनिक',
    organicFarming: false
  });
  
  // State for AI-generated predictions
  const [predictions, setPredictions] = useState<PredictionData>({
    rainfallPrediction: normalizedLanguage === 'en' ? 'Below average (750mm expected)' : 'औसत से कम (750 मिमी अपेक्षित)',
    waterAvailability: normalizedLanguage === 'en' ? 'Moderate decline in groundwater levels expected' : 'भूजल स्तर में मध्यम गिरावट की उम्मीद है',
    recommendedCrops: normalizedLanguage === 'en' 
      ? ['Sorghum', 'Millet', 'Pulses', 'Drought-resistant Rice'] 
      : ['ज्वार', 'बाजरा', 'दालें', 'सूखा-प्रतिरोधी चावल'],
    notRecommendedCrops: normalizedLanguage === 'en' 
      ? ['Traditional Rice', 'Sugarcane', 'Cotton'] 
      : ['पारंपरिक चावल', 'गन्ना', 'कपास'],
    sustainabilityScore: 68,
    potentialWaterSavings: '42%',
    irrigationRecommendation: normalizedLanguage === 'en' 
      ? 'Drip irrigation system with soil moisture sensors' 
      : 'मिट्टी की नमी संवेदकों के साथ ड्रिप सिंचाई प्रणाली',
  });

  // Sample water usage data for visualization
  const [waterData, setWaterData] = useState([
    {
      name: normalizedLanguage === 'en' ? 'Rice' : 'चावल',
      current: 4500,
      recommended: 3200,
    },
    {
      name: normalizedLanguage === 'en' ? 'Wheat' : 'गेहूं',
      current: 2300,
      recommended: 1800,
    },
    {
      name: normalizedLanguage === 'en' ? 'Total' : 'कुल',
      current: 6800,
      recommended: 5000,
    },
  ]);
  
  // State for PDF generation
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [geminiResponse, setGeminiResponse] = useState<string>("");
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Function to query Gemini for real crop recommendations
  const queryGemini = async (queryData: FarmData): Promise<PredictionData | null> => {
    try {
      // Construct the prompt for Gemini
      const prompt = `
        As an agricultural expert, provide sustainable farming recommendations for a farm with the following details:
        
        Location: ${queryData.location}
        Current Crops: ${queryData.cropTypes.join(', ')}
        Soil Type: ${queryData.soilType}
        Water Source: ${queryData.waterSource}
        Farm Size: ${queryData.farmSize} hectares
        Current Irrigation Method: ${queryData.currentIrrigationMethod}
        
        Based on this information and considering water sustainability, provide the following:
        1. Rainfall prediction for this region (including estimated amount in mm)
        2. Water availability outlook
        3. List of recommended crops that are water-efficient for this farm (exactly 5 crops)
        4. List of crops to avoid due to high water requirements (exactly 3 crops)
        5. A sustainability score (0-100) for the current farm setup
        6. Potential water savings percentage if recommendations are followed
        7. Specific irrigation recommendation for better water efficiency
        
        Format your response as a JSON object with the following structure:
        {
          "rainfallPrediction": "string",
          "waterAvailability": "string",
          "recommendedCrops": ["crop1", "crop2", "crop3", "crop4", "crop5"],
          "notRecommendedCrops": ["crop1", "crop2", "crop3"],
          "sustainabilityScore": number,
          "potentialWaterSavings": "string with percentage",
          "irrigationRecommendation": "string"
        }
        
        Explain your recommendations briefly but keep the JSON structure intact.
      `;

      console.log("Sending prompt to Gemini:", prompt);

      // Make API call to Gemini API with updated model
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }
      );

      console.log("Received response from Gemini:", response.data);

      // Store the full text response for debugging
      if (response.data && response.data.candidates && response.data.candidates[0] && 
          response.data.candidates[0].content && response.data.candidates[0].content.parts) {
        const fullResponse = response.data.candidates[0].content.parts[0].text;
        setGeminiResponse(fullResponse);
        
        // Extract the JSON part from the response
        try {
          // Try different patterns to find JSON
          const jsonMatch = fullResponse.match(/```json\n([\s\S]*)\n```/) || 
                          fullResponse.match(/```\n([\s\S]*)\n```/) ||
                          fullResponse.match(/{[\s\S]*}/);
                          
          if (jsonMatch) {
            let jsonStr = jsonMatch[1] || jsonMatch[0];
            // Clean up the JSON string
            jsonStr = jsonStr.replace(/```json|```/g, '').trim();
            
            console.log("Extracted JSON string:", jsonStr);
            
            // Parse the JSON
            const geminiData = JSON.parse(jsonStr);
            
            // Check if we have all required properties
            if (geminiData.rainfallPrediction && geminiData.waterAvailability && 
                geminiData.recommendedCrops && geminiData.notRecommendedCrops &&
                geminiData.sustainabilityScore && geminiData.potentialWaterSavings &&
                geminiData.irrigationRecommendation) {
              
              return {
                rainfallPrediction: geminiData.rainfallPrediction,
                waterAvailability: geminiData.waterAvailability,
                recommendedCrops: geminiData.recommendedCrops,
                notRecommendedCrops: geminiData.notRecommendedCrops,
                sustainabilityScore: geminiData.sustainabilityScore,
                potentialWaterSavings: geminiData.potentialWaterSavings,
                irrigationRecommendation: geminiData.irrigationRecommendation
              };
            } else {
              console.error("Missing required properties in Gemini response");
              throw new Error("Invalid response format from Gemini API");
            }
          } else {
            console.error("No JSON found in Gemini response");
            
            // Try to parse the entire response as JSON
            try {
              const geminiData = JSON.parse(fullResponse);
              if (geminiData.rainfallPrediction) {
                return geminiData;
              } else {
                throw new Error("Invalid JSON format");
              }
            } catch (e) {
              console.error("Failed to parse Gemini response as JSON:", e);
              throw new Error("Invalid response format from Gemini API");
            }
          }
        } catch (e) {
          console.error("Error parsing Gemini response:", e);
          throw new Error("Error parsing Gemini response");
        }
      } else {
        console.error("Unexpected Gemini response structure:", response.data);
        throw new Error("Unexpected response structure from Gemini API");
      }
    } catch (error) {
      console.error("Error querying Gemini:", error);
      return null;
    }
  };

  // Generate data based on location and farm inputs
  const generatePredictions = async () => {
    setIsGenerating(true);
    
    try {
      // Get real recommendations from Gemini
      let geminiPredictions: PredictionData | null = null;
      
      try {
        geminiPredictions = await queryGemini(farmData);
      } catch (geminiError) {
        console.error("Error with Gemini API:", geminiError);
        toast.error(
          normalizedLanguage === 'en'
            ? "Could not connect to Gemini API. Using default data."
            : "जेमिनी API से कनेक्ट नहीं कर सके। डिफ़ॉल्ट डेटा का उपयोग कर रहे हैं।"
        );
      }
      
      if (geminiPredictions) {
        // Update with real data from Gemini
        setPredictions(geminiPredictions);
        
        // Update water usage data based on farm size and Gemini recommendations
        const farmSizeNum = parseInt(farmData.farmSize) || 5;
        const baseRiceUsage = 800 * farmSizeNum;
        const baseWheatUsage = 400 * farmSizeNum;
        
        // Calculate recommended values based on potential water savings
        let savingsPercent = 35; // Default value
        
        try {
          // Extract percentage value from string like "30%" or "30 percent"
          const percentMatch = geminiPredictions.potentialWaterSavings.match(/(\d+)/);
          if (percentMatch && percentMatch[1]) {
            savingsPercent = parseInt(percentMatch[1]);
          }
        } catch (e) {
          console.error("Error parsing savings percentage:", e);
        }
        
        const savingsFactor = (100 - savingsPercent) / 100;
        
        const newWaterData = [
          {
            name: normalizedLanguage === 'en' ? 'Rice' : 'चावल',
            current: baseRiceUsage,
            recommended: Math.floor(baseRiceUsage * savingsFactor),
          },
          {
            name: normalizedLanguage === 'en' ? 'Wheat' : 'गेहूं',
            current: baseWheatUsage,
            recommended: Math.floor(baseWheatUsage * savingsFactor),
          },
          {
            name: normalizedLanguage === 'en' ? 'Total' : 'कुल',
            current: baseRiceUsage + baseWheatUsage,
            recommended: Math.floor(baseRiceUsage * savingsFactor) + Math.floor(baseWheatUsage * savingsFactor),
          },
        ];
        
        setWaterData(newWaterData);
        setHasGeneratedReport(true);
        
        toast.success(
          normalizedLanguage === 'en' 
            ? "Report generated successfully with Gemini AI!" 
            : "जेमिनी AI के साथ रिपोर्ट सफलतापूर्वक जनरेट की गई!"
        );
      } else {
        // Fallback to mock data if Gemini fails
        console.log("Using fallback data");
        
        // Generate region-appropriate predictions based on location
        let regionBasedRecommendations = {
          recommendedCrops: ['Sorghum', 'Millet', 'Pulses', 'Drought-resistant Rice', 'Barley'],
          notRecommendedCrops: ['Traditional Rice', 'Sugarcane', 'Cotton'],
          rainfallPrediction: `750-850mm expected annually`,
          waterAvailability: 'Moderate decline in groundwater levels expected'
        };
        
        // Adjust recommendations based on region
        const location = farmData.location.toLowerCase();
        
        if (location.includes('punjab') || location.includes('haryana')) {
          regionBasedRecommendations.recommendedCrops = ['Wheat', 'Maize', 'Pulses', 'Oilseeds', 'Barley'];
          regionBasedRecommendations.rainfallPrediction = '600-700mm expected annually';
        } else if (location.includes('rajasthan')) {
          regionBasedRecommendations.recommendedCrops = ['Pearl Millet', 'Sorghum', 'Cluster Bean', 'Moth Bean', 'Sesame'];
          regionBasedRecommendations.rainfallPrediction = '250-350mm expected annually';
        } else if (location.includes('kerala') || location.includes('karnataka')) {
          regionBasedRecommendations.recommendedCrops = ['Coconut', 'Arecanut', 'Black Pepper', 'Cardamom', 'Coffee'];
          regionBasedRecommendations.rainfallPrediction = '2500-3000mm expected annually';
        } else if (location.includes('uttar pradesh') || location.includes('bihar')) {
          regionBasedRecommendations.recommendedCrops = ['Wheat', 'Maize', 'Chickpea', 'Mustard', 'Lentil'];
          regionBasedRecommendations.rainfallPrediction = '800-1000mm expected annually';
        }
        
        // Convert region names to Hindi if needed
        if (normalizedLanguage === 'hi') {
          regionBasedRecommendations.recommendedCrops = regionBasedRecommendations.recommendedCrops.map(crop => {
            const cropTranslations: Record<string, string> = {
              'Wheat': 'गेहूं', 
              'Maize': 'मक्का', 
              'Pulses': 'दालें', 
              'Oilseeds': 'तिलहन', 
              'Barley': 'जौ',
              'Pearl Millet': 'बाजरा', 
              'Sorghum': 'ज्वार', 
              'Cluster Bean': 'ग्वार', 
              'Moth Bean': 'मोठ', 
              'Sesame': 'तिल',
              'Coconut': 'नारियल', 
              'Arecanut': 'सुपारी', 
              'Black Pepper': 'काली मिर्च', 
              'Cardamom': 'इलायची', 
              'Coffee': 'कॉफी',
              'Chickpea': 'चना', 
              'Mustard': 'सरसों', 
              'Lentil': 'मसूर',
              'Drought-resistant Rice': 'सूखा-प्रतिरोधी चावल'
            };
            return cropTranslations[crop] || crop;
          });
          
          regionBasedRecommendations.notRecommendedCrops = regionBasedRecommendations.notRecommendedCrops.map(crop => {
            const cropTranslations: Record<string, string> = {
              'Traditional Rice': 'पारंपरिक चावल',
              'Sugarcane': 'गन्ना',
              'Cotton': 'कपास'
            };
            return cropTranslations[crop] || crop;
          });
        }
        
        const fallbackPredictions: PredictionData = {
          rainfallPrediction: normalizedLanguage === 'en' 
            ? regionBasedRecommendations.rainfallPrediction
            : regionBasedRecommendations.rainfallPrediction.replace('expected annually', 'वार्षिक अपेक्षित'),
          waterAvailability: normalizedLanguage === 'en'
            ? regionBasedRecommendations.waterAvailability
            : 'भूजल स्तर में मध्यम गिरावट की उम्मीद है',
          recommendedCrops: regionBasedRecommendations.recommendedCrops,
          notRecommendedCrops: regionBasedRecommendations.notRecommendedCrops,
          sustainabilityScore: 55 + Math.floor(Math.random() * 30),
          potentialWaterSavings: `${35 + Math.floor(Math.random() * 15)}%`,
          irrigationRecommendation: normalizedLanguage === 'en'
            ? 'Drip irrigation system with soil moisture sensors'
            : 'मिट्टी की नमी संवेदकों के साथ ड्रिप सिंचाई प्रणाली',
        };
        
        setPredictions(fallbackPredictions);
        
        // Update water usage data
        const farmSizeNum = parseInt(farmData.farmSize) || 5;
        const baseRiceUsage = 800 * farmSizeNum;
        const baseWheatUsage = 400 * farmSizeNum;
        
        const savingsPercent = parseInt(fallbackPredictions.potentialWaterSavings) || 35;
        const savingsFactor = (100 - savingsPercent) / 100;
        
        const newWaterData = [
          {
            name: normalizedLanguage === 'en' ? 'Rice' : 'चावल',
            current: baseRiceUsage,
            recommended: Math.floor(baseRiceUsage * savingsFactor),
          },
          {
            name: normalizedLanguage === 'en' ? 'Wheat' : 'गेहूं',
            current: baseWheatUsage,
            recommended: Math.floor(baseWheatUsage * savingsFactor),
          },
          {
            name: normalizedLanguage === 'en' ? 'Total' : 'कुल',
            current: baseRiceUsage + baseWheatUsage,
            recommended: Math.floor(baseRiceUsage * savingsFactor) + Math.floor(baseWheatUsage * savingsFactor),
          },
        ];
        
        setWaterData(newWaterData);
        setHasGeneratedReport(true);
        
        toast.info(
          normalizedLanguage === 'en'
            ? "Using fallback data for recommendations"
            : "सिफारिशों के लिए फॉलबैक डेटा का उपयोग किया जा रहा है"
        );
      }
    } catch (error) {
      console.error("Error in report generation:", error);
      toast.error(
        normalizedLanguage === 'en'
          ? "Error generating report. Please try again."
          : "रिपोर्ट जनरेट करने में त्रुटि। कृपया पुन: प्रयास करें।"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate PDF using PDFShift API
  const generatePDF = async () => {
    setIsLoading(true);
    
    try {
      if (reportRef.current) {
        // Create HTML with proper styling for PDF
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>JalDhara Farm Report</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
                h1 { color: #3b82f6; }
                h2 { color: #0f766e; margin-top: 20px; }
                .section { margin-bottom: 20px; }
                .farm-details { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; }
                .detail-box { border: 1px solid #ddd; padding: 10px; border-radius: 5px; }
                .detail-label { font-size: 12px; color: #777; }
                .climate-section { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; }
                .climate-box { background-color: #e0f2fe; padding: 10px; border-radius: 5px; border: 1px solid #bae6fd; }
                .crop-section { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; }
                .recommended { background-color: #dcfce7; padding: 10px; border-radius: 5px; border: 1px solid #bbf7d0; }
                .not-recommended { background-color: #fee2e2; padding: 10px; border-radius: 5px; border: 1px solid #fecaca; }
                .crop-item { display: flex; align-items: center; margin: 5px 0; }
                .crop-dot { width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; }
                .green-dot { background-color: #22c55e; }
                .red-dot { background-color: #ef4444; }
                .score-box { background-color: #e0f7fa; padding: 15px; border-radius: 5px; margin-top: 20px; }
                .progress-bar { width: 100%; height: 10px; background-color: #e5e7eb; border-radius: 5px; margin: 8px 0; }
                .progress-fill { height: 100%; border-radius: 5px; }
                .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #777; }
              </style>
            </head>
            <body>
              <h1>JalDhara - ${normalizedLanguage === 'en' ? 'Farm Water Assessment Report' : 'खेत जल मूल्यांकन रिपोर्ट'}</h1>
              <p>${normalizedLanguage === 'en' ? 'Generated on' : 'उत्पन्न तिथि'}: ${new Date().toLocaleDateString(normalizedLanguage === 'en' ? 'en-US' : 'hi-IN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              
              <div class="section">
                <h2>${normalizedLanguage === 'en' ? 'Farm Details' : 'खेत विवरण'}</h2>
                <div class="farm-details">
                  <div class="detail-box">
                    <div class="detail-label">${normalizedLanguage === 'en' ? 'Location' : 'स्थान'}</div>
                    <div>${farmData.location}</div>
                  </div>
                  <div class="detail-box">
                    <div class="detail-label">${normalizedLanguage === 'en' ? 'Crops' : 'फसलें'}</div>
                    <div>${farmData.cropTypes.join(', ')}</div>
                  </div>
                  <div class="detail-box">
                    <div class="detail-label">${normalizedLanguage === 'en' ? 'Soil Type' : 'मिट्टी का प्रकार'}</div>
                    <div>${farmData.soilType}</div>
                  </div>
                  <div class="detail-box">
                    <div class="detail-label">${normalizedLanguage === 'en' ? 'Farm Size' : 'खेत का आकार'}</div>
                    <div>${farmData.farmSize} ha</div>
                  </div>
                </div>
              </div>
              
              <div class="section">
                <h2>${normalizedLanguage === 'en' ? 'Climate Predictions' : 'जलवायु पूर्वानुमान'}</h2>
                <div class="climate-section">
                  <div class="climate-box">
                    <div class="detail-label">${normalizedLanguage === 'en' ? 'Rainfall Prediction' : 'वर्षा का पूर्वानुमान'}</div>
                    <div>${predictions.rainfallPrediction}</div>
                  </div>
                  <div class="climate-box">
                    <div class="detail-label">${normalizedLanguage === 'en' ? 'Water Availability' : 'जल उपलब्धता'}</div>
                    <div>${predictions.waterAvailability}</div>
                  </div>
                </div>
              </div>
              
              <div class="section">
                <h2>${normalizedLanguage === 'en' ? 'Crop Recommendations' : 'फसल अनुशंसाएँ'}</h2>
                <div class="crop-section">
                  <div class="recommended">
                    <div class="detail-label">${normalizedLanguage === 'en' ? 'Recommended Crops' : 'अनुशंसित फसलें'}</div>
                    ${predictions.recommendedCrops.map(crop => `
                      <div class="crop-item">
                        <div class="crop-dot green-dot"></div>
                        <div>${crop}</div>
                      </div>
                    `).join('')}
                  </div>
                  <div class="not-recommended">
                    <div class="detail-label">${normalizedLanguage === 'en' ? 'Not Recommended Crops' : 'अनुशंसित नहीं फसलें'}</div>
                    ${predictions.notRecommendedCrops.map(crop => `
                      <div class="crop-item">
                        <div class="crop-dot red-dot"></div>
                        <div>${crop}</div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
              
              <div class="score-box">
                <h2>${normalizedLanguage === 'en' ? 'Sustainability Score' : 'स्थिरता स्कोर'}</h2>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${predictions.sustainabilityScore}%; background-color: ${
                    predictions.sustainabilityScore > 80 ? '#22c55e' : 
                    predictions.sustainabilityScore > 60 ? '#eab308' : 
                    '#f97316'
                  };"></div>
                </div>
                <p>${normalizedLanguage === 'en' 
                  ? `Your farm's water sustainability score is ${predictions.sustainabilityScore}/100` 
                  : `आपके खेत का जल स्थिरता स्कोर ${predictions.sustainabilityScore}/100 है`}</p>
                <p>${normalizedLanguage === 'en' 
                  ? `Potential water savings: ${predictions.potentialWaterSavings}` 
                  : `संभावित जल बचत: ${predictions.potentialWaterSavings}`}</p>
                <p>${predictions.irrigationRecommendation}</p>
              </div>
              
              <div class="footer">
                <p>JalDhara © ${new Date().getFullYear()} - ${normalizedLanguage === 'en' 
                  ? 'AI and Human Powered Farming Solutions' 
                  : 'AI और मानव संचालित कृषि समाधान'}</p>
                <p>${normalizedLanguage === 'en' 
                  ? 'Powered by Gemini AI' 
                  : 'जेमिनी AI द्वारा संचालित'}</p>
              </div>
            </body>
          </html>
        `;
        
        console.log("Sending HTML to PDFShift");
        
        // Unique filename based on timestamp and farm location
        const filename = `JalDhara_Farm_Report_${farmData.location.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        
        try {
          // Call PDFShift API with proper error handling
          const response = await axios({
            method: 'post',
            url: 'https://api.pdfshift.io/v3/convert/pdf',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Basic ' + btoa(`${PDFSHIFT_API_KEY}:`)
            },
            data: {
              source: htmlContent,
              landscape: false,
              margin: {
                top: '20px',
                bottom: '20px',
                left: '20px',
                right: '20px'
              },
              filename: filename
            },
            responseType: 'blob' // Important: get the response as a blob
          });
          
          console.log("PDFShift API Response:", response);
          
          // Create a URL for the blob
          const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
          const pdfUrl = URL.createObjectURL(pdfBlob);
          setGeneratedPdfUrl(pdfUrl);
          
          // Store in localStorage for the Reports section
          const storedReports = JSON.parse(localStorage.getItem('jaldhara_reports') || '[]');
          const newReport = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            filename: filename,
            location: farmData.location,
            crops: farmData.cropTypes.join(', '),
            data: pdfUrl, // Store URL for this session
            sustainabilityScore: predictions.sustainabilityScore
          };
          storedReports.push(newReport);
          localStorage.setItem('jaldhara_reports', JSON.stringify(storedReports));
          
          // Trigger download
          const link = document.createElement('a');
          link.href = pdfUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast.success(
            normalizedLanguage === 'en' 
              ? "PDF Report generated and saved to your reports! Download started." 
              : "PDF रिपोर्ट जनरेट की गई और आपकी रिपोर्ट में सहेजी गई! डाउनलोड शुरू हुआ।"
          );
        } catch (pdfShiftError) {
          console.error('PDFShift API Error:', pdfShiftError);
          
          // Fall back to browser print function
          toast.error(
            normalizedLanguage === 'en' 
              ? "Error with PDF service. Using browser print instead." 
              : "PDF सेवा में त्रुटि। ब्राउज़र प्रिंट का उपयोग करें।"
          );
          
          // Store the HTML directly for printing
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            printWindow.focus();
            
            // Add a delay to make sure the content is loaded
            setTimeout(() => {
              printWindow.print();
              
              // Store a reference to HTML report in localStorage
              const storedReports = JSON.parse(localStorage.getItem('jaldhara_reports') || '[]');
              const newReport = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                filename: `JalDhara_Farm_Report_${farmData.location.replace(/\s+/g, '_')}.html`,
                location: farmData.location,
                crops: farmData.cropTypes.join(', '),
                data: null, // No blob URL in this case
                isHtml: true,
                sustainabilityScore: predictions.sustainabilityScore
              };
              storedReports.push(newReport);
              localStorage.setItem('jaldhara_reports', JSON.stringify(storedReports));
            }, 1000);
          } else {
            toast.error(
              normalizedLanguage === 'en' 
                ? "Could not open print window. Please try again." 
                : "प्रिंट विंडो नहीं खोल सका। कृपया पुन: प्रयास करें।"
            );
          }
        }
      }
    } catch (error) {
      console.error('Error in PDF generation process:', error);
      toast.error(
        normalizedLanguage === 'en' 
          ? "Error generating PDF. Please try again." 
          : "PDF जनरेट करने में त्रुटि। कृपया पुन: प्रयास करें।"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const content = {
    en: {
      title: "Farm Water Assessment Report",
      subtitle: "Generate a personalized sustainability report for your farm",
      formTitle: "Farm Details",
      location: "Location",
      cropTypes: "Current Crops",
      soilType: "Soil Type",
      waterSource: "Water Source",
      farmSize: "Farm Size (Hectares)",
      irrigationMethod: "Current Irrigation Method",
      generateButton: "Generate Report",
      generatingText: "Analyzing data...",
      noReports: "Complete the form to generate your personalized water assessment report.",
      reportTitle: "Water Sustainability Assessment",
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      summary: "Based on your input and our AI analysis, we've assessed your current water usage patterns and identified potential water-saving opportunities for sustainable farming.",
      farmDetails: "Farm Details",
      climate: "Climate Predictions",
      recommendations: "Crop Recommendations",
      sustainabilityScore: "Sustainability Score",
      irrigation: "Irrigation Recommendations",
      download: "Download PDF Report",
      print: "Print Report",
      share: "Share Report",
      recommended: "Recommended Crops",
      notRecommended: "Not Recommended Crops",
      soilMoisture: "Soil Moisture",
      cropRotationPattern: "Crop Rotation Pattern",
      majorChallenges: "Major Challenges",
      harvestSeason: "Harvest Season",
      fertilizerUsage: "Fertilizer Type",
      organicFarming: "Practicing Organic Farming"
    },
    hi: {
      title: "खेत जल मूल्यांकन रिपोर्ट",
      subtitle: "अपने खेत के लिए व्यक्तिगत स्थिरता रिपोर्ट जनरेट करें",
      formTitle: "खेत विवरण",
      location: "स्थान",
      cropTypes: "वर्तमान फसलें",
      soilType: "मिट्टी का प्रकार",
      waterSource: "जल स्रोत",
      farmSize: "खेत का आकार (हेक्टेयर)",
      irrigationMethod: "वर्तमान सिंचाई विधि",
      generateButton: "रिपोर्ट जनरेट करें",
      generatingText: "डेटा का विश्लेषण...",
      noReports: "अपनी व्यक्तिगत जल मूल्यांकन रिपोर्ट जनरेट करने के लिए फॉर्म भरें।",
      reportTitle: "जल स्थिरता मूल्यांकन",
      date: new Date().toLocaleDateString('hi-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
      summary: "आपके इनपुट और हमारे AI विश्लेषण के आधार पर, हमने आपके वर्तमान जल उपयोग पैटर्न का आकलन किया है और टिकाऊ खेती के लिए संभावित जल-बचत के अवसरों की पहचान की है।",
      farmDetails: "खेत विवरण",
      climate: "जलवायु पूर्वानुमान",
      recommendations: "फसल अनुशंसाएँ",
      sustainabilityScore: "स्थिरता स्कोर",
      irrigation: "सिंचाई संबंधी सिफारिशें",
      download: "PDF रिपोर्ट डाउनलोड करें",
      print: "रिपोर्ट प्रिंट करें",
      share: "रिपोर्ट शेयर करें",
      recommended: "अनुशंसित फसलें",
      notRecommended: "अनुशंसित नहीं फसलें",
      soilMoisture: "मिट्टी की नमी",
      cropRotationPattern: "फसल चक्र पैटर्न",
      majorChallenges: "प्रमुख चुनौतियाँ",
      harvestSeason: "फसल का मौसम",
      fertilizerUsage: "उर्वरक प्रकार",
      organicFarming: "जैविक खेती का अभ्यास"
    }
  };

  // Modified handleAction to use new PDF generation
  const handleAction = (action: string) => {
    if (action === 'download') {
      generatePDF();
      return;
    }
    
    const messages = {
      en: {
        print: "Sending report to printer...",
        share: "Report sharing options opened"
      },
      hi: {
        print: "रिपोर्ट प्रिंटर को भेज रहे हैं...",
        share: "रिपोर्ट साझाकरण विकल्प खोले गए"
      }
    };
    
    toast.success(messages[normalizedLanguage][action as keyof typeof messages.en]);
  };

  // Use English content as fallback for languages other than Hindi
  const activeContent = content[normalizedLanguage];

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <h1 className="text-3xl font-bold mb-2">{activeContent.title}</h1>
      <p className="text-muted-foreground mb-6">{activeContent.subtitle}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{activeContent.formTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <VoiceInputField
                id="location"
                value={farmData.location}
                onChange={(value) => setFarmData({...farmData, location: value})}
                label={activeContent.location}
                language={normalizedLanguage}
              />
              
              <VoiceInputField
                id="crops"
                value={farmData.cropTypes.join(', ')}
                onChange={(value) => setFarmData({...farmData, cropTypes: value.split(', ')})}
                label={activeContent.cropTypes}
                language={normalizedLanguage}
              />
              
              <div className="space-y-2">
                <Label htmlFor="soilType">{activeContent.soilType}</Label>
                <div className="flex">
                  <Select 
                    onValueChange={(value) => setFarmData({...farmData, soilType: value})}
                    defaultValue={farmData.soilType}
                  >
                    <SelectTrigger className="flex-1 rounded-r-none">
                      <SelectValue placeholder={farmData.soilType} />
                    </SelectTrigger>
                    <SelectContent>
                      {normalizedLanguage === 'en' ? (
                        <>
                          <SelectItem value="Black clay soil">Black clay soil</SelectItem>
                          <SelectItem value="Red loamy soil">Red loamy soil</SelectItem>
                          <SelectItem value="Sandy soil">Sandy soil</SelectItem>
                          <SelectItem value="Alluvial soil">Alluvial soil</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="काली मिट्टी">काली मिट्टी</SelectItem>
                          <SelectItem value="लाल दोमट मिट्टी">लाल दोमट मिट्टी</SelectItem>
                          <SelectItem value="रेतीली मिट्टी">रेतीली मिट्टी</SelectItem>
                          <SelectItem value="जलोढ़ मिट्टी">जलोढ़ मिट्टी</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    onClick={() => {
                      toast.info(normalizedLanguage === 'en' ? 
                        'Please select soil type from the list' : 
                        'कृपया सूची से मिट्टी का प्रकार चुनें');
                    }}
                    className="rounded-l-none bg-water hover:bg-water-dark text-white"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <VoiceInputField
                id="waterSource"
                value={farmData.waterSource}
                onChange={(value) => setFarmData({...farmData, waterSource: value})}
                label={activeContent.waterSource}
                language={normalizedLanguage}
              />
              
              <VoiceInputField
                id="farmSize"
                value={farmData.farmSize}
                onChange={(value) => setFarmData({...farmData, farmSize: value})}
                label={activeContent.farmSize}
                type="number"
                language={normalizedLanguage}
              />
              
              <div className="space-y-2">
                <Label htmlFor="irrigationMethod">{activeContent.irrigationMethod}</Label>
                <div className="flex">
                  <Select 
                    onValueChange={(value) => setFarmData({...farmData, currentIrrigationMethod: value})}
                    defaultValue={farmData.currentIrrigationMethod}
                  >
                    <SelectTrigger className="flex-1 rounded-r-none">
                      <SelectValue placeholder={farmData.currentIrrigationMethod} />
                    </SelectTrigger>
                    <SelectContent>
                      {normalizedLanguage === 'en' ? (
                        <>
                          <SelectItem value="Flood irrigation">Flood irrigation</SelectItem>
                          <SelectItem value="Drip irrigation">Drip irrigation</SelectItem>
                          <SelectItem value="Sprinkler irrigation">Sprinkler irrigation</SelectItem>
                          <SelectItem value="Furrow irrigation">Furrow irrigation</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="बाढ़ सिंचाई">बाढ़ सिंचाई</SelectItem>
                          <SelectItem value="ड्रिप सिंचाई">ड्रिप सिंचाई</SelectItem>
                          <SelectItem value="स्प्रिंकलर सिंचाई">स्प्रिंकलर सिंचाई</SelectItem>
                          <SelectItem value="फरो सिंचाई">फरो सिंचाई</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    onClick={() => {
                      toast.info(normalizedLanguage === 'en' ? 
                        'Please select irrigation method from the list' : 
                        'कृपया सूची से सिंचाई विधि चुनें');
                    }}
                    className="rounded-l-none bg-water hover:bg-water-dark text-white"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <VoiceInputField
                id="soilMoisture"
                value={farmData.soilMoisture}
                onChange={(value) => setFarmData({...farmData, soilMoisture: value})}
                label={normalizedLanguage === 'en' ? 'Soil Moisture' : 'मिट्टी की नमी'}
                language={normalizedLanguage}
              />
              
              <VoiceInputField
                id="cropRotationPattern"
                value={farmData.cropRotationPattern}
                onChange={(value) => setFarmData({...farmData, cropRotationPattern: value})}
                label={normalizedLanguage === 'en' ? 'Crop Rotation Pattern' : 'फसल चक्र पैटर्न'}
                language={normalizedLanguage}
              />
              
              <VoiceInputField
                id="majorChallenges"
                value={farmData.majorChallenges}
                onChange={(value) => setFarmData({...farmData, majorChallenges: value})}
                label={normalizedLanguage === 'en' ? 'Major Challenges' : 'प्रमुख चुनौतियाँ'}
                language={normalizedLanguage}
              />
              
              <div className="space-y-2">
                <Label htmlFor="harvestSeason">
                  {normalizedLanguage === 'en' ? 'Harvest Season' : 'फसल का मौसम'}
                </Label>
                <div className="flex">
                  <Input
                    id="harvestSeason"
                    value={farmData.harvestSeason}
                    onChange={(e) => setFarmData({...farmData, harvestSeason: e.target.value})}
                    className="flex-1 rounded-r-none"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      // Logic for season selection
                      const seasons = normalizedLanguage === 'en' 
                        ? ['March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February']
                        : ['मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर', 'जनवरी', 'फरवरी'];
                      
                      const randomSeason = seasons[Math.floor(Math.random() * seasons.length)];
                      setFarmData({...farmData, harvestSeason: randomSeason});
                    }}
                    className="rounded-none bg-water hover:bg-water-dark text-white"
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      // Voice input for harvest season
                      const speechRecognition = initSpeechRecognition(
                        normalizedLanguage,
                        (result) => {
                          if (result.text) {
                            setFarmData({...farmData, harvestSeason: result.text});
                          }
                        },
                        (error) => {
                          toast.error(
                            normalizedLanguage === 'en'
                              ? `Voice recognition error: ${error}`
                              : `वॉयस पहचान त्रुटि: ${error}`
                          );
                        }
                      );
                      
                      speechRecognition.start();
                    }}
                    className="rounded-l-none bg-water hover:bg-water-dark text-white"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <VoiceInputField
                id="fertilizerUsage"
                value={farmData.fertilizerUsage}
                onChange={(value) => setFarmData({...farmData, fertilizerUsage: value})}
                label={normalizedLanguage === 'en' ? 'Fertilizer Type' : 'उर्वरक प्रकार'}
                language={normalizedLanguage}
              />
              
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="organicFarming" 
                  checked={farmData.organicFarming}
                  onCheckedChange={(checked) => 
                    setFarmData({...farmData, organicFarming: checked as boolean})
                  }
                />
                <label
                  htmlFor="organicFarming"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {normalizedLanguage === 'en' ? 'Practicing Organic Farming' : 'जैविक खेती का अभ्यास'}
                </label>
              </div>
              
              <Button 
                className="w-full mt-4 gap-2 bg-water hover:bg-water-dark text-white"
                onClick={generatePredictions}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {activeContent.generatingText}
                  </>
                ) : (
                  activeContent.generateButton
                )}
              </Button>
            </CardContent>
          </Card>
          
          {/* Debug section - only in development */}
          {process.env.NODE_ENV === 'development' && geminiResponse && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Gemini Raw Response (Debug)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs overflow-auto max-h-48 whitespace-pre-wrap">
                  {geminiResponse}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="md:col-span-2">
          {!hasGeneratedReport ? (
            <Card className="h-full flex items-center justify-center p-6">
              <p className="text-center text-muted-foreground">{activeContent.noReports}</p>
            </Card>
          ) : (
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
                  <span>{activeContent.reportTitle}</span>
                  <span className="text-sm font-normal text-muted-foreground">{activeContent.date}</span>
          </CardTitle>
        </CardHeader>
              <CardContent className="space-y-6" ref={reportRef}>
                <p>{activeContent.summary}</p>
          
          <div>
                  <h3 className="text-lg font-semibold mb-3">{activeContent.farmDetails}</h3>
            <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded p-3">
                      <p className="text-sm text-muted-foreground">{activeContent.location}</p>
                      <p className="font-medium">{farmData.location}</p>
                    </div>
                    <div className="border rounded p-3">
                      <p className="text-sm text-muted-foreground">{activeContent.cropTypes}</p>
                      <p className="font-medium">{farmData.cropTypes.join(', ')}</p>
                    </div>
                    <div className="border rounded p-3">
                      <p className="text-sm text-muted-foreground">{activeContent.soilType}</p>
                      <p className="font-medium">{farmData.soilType}</p>
                    </div>
                    <div className="border rounded p-3">
                      <p className="text-sm text-muted-foreground">{activeContent.farmSize}</p>
                      <p className="font-medium">{farmData.farmSize} ha</p>
                    </div>
                  </div>
          </div>
          
          <Separator />
          
          <div>
                  <h3 className="text-lg font-semibold mb-3">{activeContent.climate}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded p-4 bg-blue-50">
                      <p className="text-sm text-blue-800 mb-1">{normalizedLanguage === 'en' ? 'Rainfall Prediction' : 'वर्षा का पूर्वानुमान'}</p>
                      <p className="font-medium">{predictions.rainfallPrediction}</p>
                    </div>
                    <div className="border rounded p-4 bg-blue-50">
                      <p className="text-sm text-blue-800 mb-1">{normalizedLanguage === 'en' ? 'Water Availability' : 'जल उपलब्धता'}</p>
                      <p className="font-medium">{predictions.waterAvailability}</p>
                    </div>
                  </div>
                </div>
                
                {FinalWaterUsageChart && <FinalWaterUsageChart data={waterData} language={normalizedLanguage} />}
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">{activeContent.recommendations}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded p-4 bg-green-50">
                      <p className="text-sm text-green-800 mb-2">{activeContent.recommended}</p>
                      <div className="space-y-1">
                        {predictions.recommendedCrops.map((crop, idx) => (
                          <div key={idx} className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            <p>{crop}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border rounded p-4 bg-red-50">
                      <p className="text-sm text-red-800 mb-2">{activeContent.notRecommended}</p>
                      <div className="space-y-1">
                        {predictions.notRecommendedCrops.map((crop, idx) => (
                          <div key={idx} className="flex items-center">
                            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                            <p>{crop}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-water/10 p-4 rounded-lg">
                    <h3 className="font-semibold text-water-dark mb-1">{activeContent.sustainabilityScore}</h3>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 mb-1">
                      <div 
                        className={`h-2.5 rounded-full ${
                          predictions.sustainabilityScore > 80 ? 'bg-green-500' : 
                          predictions.sustainabilityScore > 60 ? 'bg-yellow-500' : 
                          'bg-orange-500'
                        }`} 
                        style={{ width: `${predictions.sustainabilityScore}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span>50</span>
                      <span>100</span>
                    </div>
                    <p className="mt-2">
                      {normalizedLanguage === 'en' 
                        ? `Your farm's water sustainability score is ${predictions.sustainabilityScore}/100` 
                        : `आपके खेत का जल स्थिरता स्कोर ${predictions.sustainabilityScore}/100 है`}
                    </p>
          </div>
          
                  <div className="bg-earth/10 p-4 rounded-lg">
                    <h3 className="font-semibold text-earth-dark mb-2">{activeContent.irrigation}</h3>
                    <p className="mb-2">{predictions.irrigationRecommendation}</p>
                    <p className="font-medium">
                      {normalizedLanguage === 'en' 
                        ? `Potential water savings: ${predictions.potentialWaterSavings}` 
                        : `संभावित जल बचत: ${predictions.potentialWaterSavings}`}
                    </p>
                  </div>
                </div>
                
                <div className="text-center text-xs text-gray-500 mt-4">
                  {normalizedLanguage === 'en' 
                    ? 'Analysis powered by Gemini AI' 
                    : 'जेमिनी AI द्वारा संचालित विश्लेषण'}
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3 border-t pt-6">
          <Button 
            variant="outline" 
                  className="gap-2 app-button-glow water-button-glow" 
            onClick={() => handleAction('download')}
                  disabled={isLoading}
          >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
            <Download className="h-4 w-4" />
                  )}
                  {activeContent.download}
          </Button>
          <Button 
            variant="outline" 
                  className="gap-2 app-button-glow water-button-glow"
            onClick={() => handleAction('print')}
          >
            <Printer className="h-4 w-4" />
                  {activeContent.print}
          </Button>
          <Button 
            variant="outline" 
                  className="gap-2 app-button-glow water-button-glow"
            onClick={() => handleAction('share')}
          >
            <Share2 className="h-4 w-4" />
                  {activeContent.share}
          </Button>
        </CardFooter>
      </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
