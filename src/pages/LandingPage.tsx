import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DropletIcon, Sprout, ArrowRight, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import WaterDropAnimation from '@/components/WaterDropAnimation';
import WeatherWidget from '@/components/WeatherWidget';
import AiAdviceWidget from '@/components/AiAdviceWidget';
import VoiceDialog from '@/components/VoiceDialog';

interface LandingPageProps {
  language: 'en' | 'hi';
}

const LandingPage: React.FC<LandingPageProps> = ({ language }) => {
  const navigate = useNavigate();
  const [sharedLocation, setSharedLocation] = useState('');
  const [voiceDialogOpen, setVoiceDialogOpen] = useState(false);

  const handleLocationSelected = (location: string) => {
    setSharedLocation(location);
  };

  const handleVoiceData = (text: string) => {
    console.log("Voice data received:", text);
    // You could analyze the text and navigate based on voice commands
    // For now, we'll just navigate to reports after voice interaction
    setTimeout(() => {
      navigate('/reports');
    }, 2000);
  };

  const content = {
    en: {
      title: "JalDhara",
      subtitle: "AI and Human Powered Farming Solutions",
      description: "Use voice commands to manage irrigation and get sustainable water practices along with solutions to everyday farming challenges.",
      features: [
        {
          title: "Voice Assistance",
          description: "Voice-based data collection in Hindi and English"
        },
        {
          title: "Smart Irrigation",
          description: "Get sustainable irrigation method recommendations"
        },
        {
          title: "Water-Efficient Crops",
          description: "Discover crops with lower water footprints"
        },
        {
          title: "Analytics",
          description: "Generate detailed water usage reports"
        }
      ],
      cta: "View Reports"
    },
    hi: {
      title: "जलधारा",
      subtitle: "AI और मानव संचालित कृषि समाधान",
      description: "आवाज़ कमांड का उपयोग करके सिंचाई प्रबंधित करें और टिकाऊ जल प्रथाओं के साथ-साथ रोजमर्रा की खेती की चुनौतियों के समाधान प्राप्त करें।",
      features: [
        {
          title: "आवाज सहायता",
          description: "हिंदी और अंग्रेजी में वॉयस-आधारित डेटा संग्रह"
        },
        {
          title: "स्मार्ट सिंचाई",
          description: "स्थायी सिंचाई विधि सिफारिशें प्राप्त करें"
        },
        {
          title: "जल-कुशल फसलें",
          description: "कम जल फुटप्रिंट वाली फसलों की खोज करें"
        },
        {
          title: "विश्लेषिकी",
          description: "विस्तृत जल उपयोग रिपोर्ट तैयार करें"
        }
      ],
      cta: "रिपोर्ट देखें"
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="flex mb-2 gap-2">
          <DropletIcon className="h-10 w-10 text-water" />
          <Sprout className="h-10 w-10 text-earth" />
        </div>
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-water">{content[language].title.split(" ")[0]}</span>{" "}
          <span className="text-earth">{content[language].title.split(" ")[1]}</span>{" "}
          <span className="text-water-dark">{content[language].title.split(" ")[2]}</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-4">{content[language].subtitle}</p>
        <p className="max-w-2xl text-center">{content[language].description}</p>
        
        <WaterDropAnimation count={7} />
        
        <div className="flex items-center mt-6 gap-4">
          <Button 
            onClick={() => navigate('/reports')} 
            size="lg" 
            className="gap-2 bg-water hover:bg-water-dark"
          >
            {content[language].cta}
            <ArrowRight className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="gap-2 border-water text-water hover:bg-water/10"
            onClick={() => setVoiceDialogOpen(true)}
          >
            <Volume2 className="h-4 w-4" />
            {language === 'en' ? 'Voice Assistant' : 'आवाज़ सहायक'}
          </Button>
        </div>
      </div>
      
      {/* Features as horizontal cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {content[language].features.map((feature, index) => (
          <Card key={index} className="border-water hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Weather and Advice section */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <WeatherWidget 
            language={language} 
            locationProp={sharedLocation}
            onLocationSelected={handleLocationSelected}
          />
        </div>
        <div>
          <AiAdviceWidget language={language} />
        </div>
      </div>
      
      {/* Voice Dialog */}
      <VoiceDialog 
        open={voiceDialogOpen} 
        onOpenChange={setVoiceDialogOpen} 
        language={language}
        onVoiceData={handleVoiceData}
      />
    </div>
  );
};

export default LandingPage;
