import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, RotateCw, Volume2, VolumeX, Mic, Droplets } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { analyzeWaterUsage } from '@/integrations/cohere';
import AiAdviceWidget from '@/components/AiAdviceWidget';
import RainfallForecastWidget from '@/components/RainfallForecastWidget';
import WaterUsageChart from '@/components/WaterUsageChart';
import VoiceDialog from '@/components/VoiceDialog';

interface CalculatorProps {
  language: 'en' | 'hi';
}

const Calculator: React.FC<CalculatorProps> = ({ language }) => {
  const [isListening, setIsListening] = useState(false);
  const [conversations, setConversations] = useState<{question: string, answer: string}[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [waterData, setWaterData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [potentialSavings, setPotentialSavings] = useState<string>("0%");
  const [sharedLocation, setSharedLocation] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [analysisAudio, setAnalysisAudio] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const navigate = useNavigate();

  const content = {
    en: {
      title: "Water Footprint Calculator",
      instruction: "Click the microphone button and tell us about your farm",
      initialQuestions: [
        "What crops do you currently grow?",
        "How would you describe your soil type?",
        "What water sources do you use for irrigation?",
        "How much rainfall do you get in your area?",
      ],
      analyze: "Analyze Water Usage",
      analyzing: "Analyzing...",
      startOver: "Start Over",
      recommendations: "Recommendations",
      sample: {
        recommendations: [
          "Switch from flood irrigation to drip irrigation for rice crops.",
          "Consider crop rotation with pulses to improve soil water retention.",
          "Implement rainwater harvesting to reduce dependence on groundwater.",
          "Use mulching to reduce evaporation from soil surface."
        ],
        potential: "Potential Water Savings: 35%",
        report: "Save Report"
      }
    },
    hi: {
      title: "जल पदचिह्न कैलकुलेटर",
      instruction: "माइक्रोफोन बटन पर क्लिक करें और हमें अपने खेत के बारे में बताएं",
      initialQuestions: [
        "आप वर्तमान में कौन सी फसलें उगाते हैं?",
        "आप अपनी मिट्टी के प्रकार का वर्णन कैसे करेंगे?",
        "आप सिंचाई के लिए किन जल स्रोतों का उपयोग करते हैं?",
        "आपके क्षेत्र में कितनी वर्षा होती है?",
      ],
      analyze: "जल उपयोग का विश्लेषण करें",
      analyzing: "विश्लेषण कर रहा है...",
      startOver: "फिर से शुरू करें",
      recommendations: "सिफारिशें",
      sample: {
        recommendations: [
          "धान की फसलों के लिए बाढ़ सिंचाई से ड्रिप सिंचाई में बदलें।",
          "मिट्टी की जल धारण क्षमता में सुधार के लिए दालों के साथ फसल चक्र पर विचार करें।",
          "भूजल पर निर्भरता कम करने के लिए वर्षा जल संचयन लागू करें।",
          "मिट्टी की सतह से वाष्पीकरण को कम करने के लिए मल्चिंग का उपयोग करें।"
        ],
        potential: "संभावित जल बचत: 35%",
        report: "रिपोर्ट सहेजें"
      }
    }
  };

  // Sample water usage data as fallback
  const sampleWaterData = [
    {
      name: language === 'en' ? 'Rice' : 'चावल',
      current: 4500,
      recommended: 3200,
    },
    {
      name: language === 'en' ? 'Wheat' : 'गेहूं',
      current: 2300,
      recommended: 1800,
    },
    {
      name: language === 'en' ? 'Total' : 'कुल',
      current: 6800,
      recommended: 5000,
    },
  ];

  useEffect(() => {
    // Set initial question when component mounts
    if (!currentQuestion && content[language].initialQuestions.length > 0) {
      setCurrentQuestion(content[language].initialQuestions[0]);
    }
  }, [language]);

  const handleVoiceData = (text: string) => {
    if (currentQuestion) {
      // Add the current Q&A to conversations
      setConversations([...conversations, { question: currentQuestion, answer: text }]);
      
      // Move to next question or complete if all questions answered
      const currentIndex = content[language].initialQuestions.indexOf(currentQuestion);
      if (currentIndex < content[language].initialQuestions.length - 1) {
        setCurrentQuestion(content[language].initialQuestions[currentIndex + 1]);
      } else {
        setCurrentQuestion(null);
      }
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    
    try {
      // Use Gemini API to analyze the conversations
      const result = await analyzeWaterUsage(conversations, language);
      
      // Update state with the analysis results
      setWaterData(result.waterData || sampleWaterData);
      setRecommendations(result.recommendations);
      setPotentialSavings(result.potentialSavings);
      setAnalysisComplete(true);
      
      // Store audio summary for voice output
      if (result.audioSummary) {
        setAnalysisAudio(result.audioSummary);
        // Auto-play the analysis summary
        speakText(result.audioSummary);
      }
      
      toast.success(
        language === 'en' 
          ? 'Analysis complete! View your water usage report below.' 
          : 'विश्लेषण पूरा! नीचे अपनी जल उपयोग रिपोर्ट देखें।'
      );
    } catch (error) {
      console.error("Error analyzing water usage:", error);
      toast.error(
        language === 'en' 
          ? 'Error analyzing water usage. Please try again.' 
          : 'जल उपयोग का विश्लेषण करने में त्रुटि। कृपया पुनः प्रयास करें।'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Text-to-speech function to speak analysis results
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
    if (speechSynthesis) {
      speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesisRef.current = utterance;
    
    // Set language
    utterance.lang = language === 'en' ? 'en-US' : 'hi-IN';
    
    // Handle speech events
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      toast.error(
        language === 'en'
          ? 'Error playing voice response.'
          : 'आवाज़ प्रतिक्रिया चलाने में त्रुटि।'
      );
    };
    
    // Speak the text
    speechSynthesis.speak(utterance);
  };

  // Toggle speaking the analysis results
  const toggleSpeaking = () => {
    if (isSpeaking) {
      // Stop speaking
      if (speechSynthesis) {
        speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    } else if (analysisAudio) {
      // Speak analysis audio
      speakText(analysisAudio);
    }
  };

  const handleReset = () => {
    // Stop any ongoing speech
    if (speechSynthesis && isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    
    setConversations([]);
    setCurrentQuestion(content[language].initialQuestions[0]);
    setAnalysisComplete(false);
    setWaterData(null);
    setRecommendations([]);
    setPotentialSavings("0%");
    setAnalysisAudio(null);
  };

  const handleSaveReport = () => {
    toast.success(
      language === 'en' 
        ? 'Water usage report saved successfully!'
        : 'जल उपयोग रिपोर्ट सफलतापूर्वक सहेजी गई!'
    );
    
    navigate('/reports');
  };

  const handleLocationSelected = (location: string) => {
    setSharedLocation(location);
  };

  const handleOpenVoiceDialog = () => {
    setDialogOpen(true);
  };

  return (
    <div className="container py-8">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="mb-6 bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-slate-800 border-water/30 shadow-lg">
            <CardHeader className="border-b border-water/20">
              <CardTitle className="text-2xl font-bold text-water-dark flex items-center">
                <Droplets className="mr-2 h-6 w-6 text-water" />
                {content[language].title}
              </CardTitle>
            </CardHeader>
            <CardContent className="mt-6">
              {!analysisComplete ? (
                <>
                  <p className="mb-8 text-center text-lg">{content[language].instruction}</p>
                  
                  <div className="flex justify-center mb-10">
                    <Button 
                      onClick={handleOpenVoiceDialog}
                      className="rounded-full h-20 w-20 bg-water hover:bg-water-dark shadow-md transition-all hover:shadow-lg transform hover:scale-105"
                    >
                      <Mic className="h-8 w-8" />
                    </Button>
                  </div>
                  
                  {currentQuestion && (
                    <div className="bg-water/10 p-6 rounded-lg mb-8 border border-water/20 animate-fade-in shadow">
                      <p className="font-medium text-lg">{currentQuestion}</p>
                    </div>
                  )}
                  
                  {conversations.length > 0 && (
                    <div className="space-y-6 mt-6">
                      {conversations.map((conv, index) => (
                        <div key={index} className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border-l-4 border-water">
                          <p className="font-medium text-sm text-water-dark mb-2">{conv.question}</p>
                          <p className="pl-4 border-l border-dashed border-water/30">{conv.answer}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-water/20">
                    <h3 className="text-xl font-bold text-water-dark">{content[language].recommendations}</h3>
                    
                    {analysisAudio && (
                      <Button
                        onClick={toggleSpeaking}
                        variant="outline"
                        size="sm"
                        className={`rounded-full h-10 w-10 p-0 ${isSpeaking ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' : ''}`}
                        title={language === 'en' ? 'Play voice summary' : 'आवाज़ सारांश चलाएं'}
                      >
                        {isSpeaking ? (
                          <VolumeX className="h-5 w-5" />
                        ) : (
                          <Volume2 className="h-5 w-5" />
                        )}
                      </Button>
                    )}
                  </div>
                  
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm mb-8">
                    <WaterUsageChart data={waterData} language={language} />
                  </div>
                  
                  <div className="mt-8 space-y-4">
                    {recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm transition-all hover:shadow">
                        <div className="bg-water text-white rounded-full h-8 w-8 flex items-center justify-center text-sm mr-3 flex-shrink-0">
                          {index + 1}
                        </div>
                        <p className="pt-1">{rec}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-water/10 p-6 rounded-lg mt-8 border border-water/20 shadow-sm">
                    <p className="font-semibold text-xl text-water-dark">
                      {language === 'en' ? 'Potential Water Savings: ' : 'संभावित जल बचत: '}
                      <span className="text-2xl font-bold">{potentialSavings}</span>
                    </p>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={isAnalyzing}
                className="border-water text-water hover:bg-water/10"
              >
                <RotateCw className="mr-2 h-4 w-4" />
                {content[language].startOver}
              </Button>
              
              {!analysisComplete ? (
                <Button 
                  onClick={handleAnalyze} 
                  disabled={conversations.length < 2 || isAnalyzing}
                  className="bg-water hover:bg-water-dark text-white shadow-md"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {content[language].analyzing}
                    </>
                  ) : (
                    content[language].analyze
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={handleSaveReport} 
                  disabled={!analysisComplete}
                  className="gap-2 w-full bg-water hover:bg-water-dark text-white app-button-glow water-button-glow"
                >
                  {language === 'en' ? 'Save Report' : 'रिपोर्ट सहेजें'}
                  <Save className="h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
        
        <div className="md:col-span-1">
          <div className="space-y-6 sticky top-24">
            <AiAdviceWidget language={language} />
            <RainfallForecastWidget 
              language={language} 
              locationProp={sharedLocation}
              onLocationSelected={handleLocationSelected}
            />
          </div>
        </div>
      </div>
      
      <VoiceDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        language={language}
        onVoiceData={handleVoiceData}
      />
    </div>
  );
};

export default Calculator;
