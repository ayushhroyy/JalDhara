import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DropletIcon, Sprout, ArrowRight, Leaf, Sun, Cloud, Mic, BarChart, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import EnhancedRainAnimation from '@/components/EnhancedRainAnimation';
import WeatherWidget from '@/components/WeatherWidget';
import AiAdviceWidget from '@/components/AiAdviceWidget';
import KrishiMitraAI from '@/components/KrishiMitraButton';
import { SupportedLanguage } from '@/App';
import { useAppContext } from '@/contexts/AppContext';

interface LandingPageProps {
  language: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ language, onLanguageChange }) => {
  const navigate = useNavigate();
  const [sharedLocation, setSharedLocation] = useState('');
  const { isMobile } = useAppContext();
  const [isScrolled, setIsScrolled] = useState(false);

  // Normalize language for components that only support English and Hindi
  const normalizedLanguage: 'en' | 'hi' = language === 'hi' ? 'hi' : 'en';

  const handleLocationSelected = (location: string) => {
    setSharedLocation(location);
  };

  // Add scroll event listener to detect scrolling
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const content = {
    en: {
      title: "JalDhara",
      subtitle: "AI and Human Powered Farming Solutions",
      description: "Use voice commands to manage irrigation and get sustainable water practices along with solutions to everyday farming challenges.",
      features: [
        {
          title: "Voice Assistance",
          description: "Voice-based data collection in Hindi and English",
          icon: <Mic className="h-5 w-5 text-water mb-2" />
        },
        {
          title: "Smart Irrigation",
          description: "Get sustainable irrigation method recommendations",
          icon: <DropletIcon className="h-5 w-5 text-water mb-2" />
        },
        {
          title: "Water-Efficient Crops",
          description: "Discover crops with lower water footprints",
          icon: <Sprout className="h-5 w-5 text-earth mb-2" />
        },
        {
          title: "Analytics",
          description: "Generate detailed water usage reports",
          icon: <BarChart className="h-5 w-5 text-water-dark mb-2" />
        }
      ],
      cta: "View Reports",
      business: "Book Consultation"
    },
    hi: {
      title: "जलधारा",
      subtitle: "AI और मानव संचालित कृषि समाधान",
      description: "आवाज़ कमांड का उपयोग करके सिंचाई प्रबंधित करें और टिकाऊ जल प्रथाओं के साथ-साथ रोजमर्रा की खेती की चुनौतियों के समाधान प्राप्त करें।",
      features: [
        {
          title: "आवाज सहायता",
          description: "हिंदी और अंग्रेजी में वॉयस-आधारित डेटा संग्रह",
          icon: <Mic className="h-5 w-5 text-water mb-2" />
        },
        {
          title: "स्मार्ट सिंचाई",
          description: "स्थायी सिंचाई विधि सिफारिशें प्राप्त करें",
          icon: <DropletIcon className="h-5 w-5 text-water mb-2" />
        },
        {
          title: "जल-कुशल फसलें",
          description: "कम जल फुटप्रिंट वाली फसलों की खोज करें",
          icon: <Sprout className="h-5 w-5 text-earth mb-2" />
        },
        {
          title: "विश्लेषिकी",
          description: "विस्तृत जल उपयोग रिपोर्ट तैयार करें",
          icon: <BarChart className="h-5 w-5 text-water-dark mb-2" />
        }
      ],
      cta: "रिपोर्ट देखें",
      business: "आदेश परामर्श"
    }
  };

  // Use English content as fallback for languages other than Hindi
  const activeContent = content[normalizedLanguage];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="relative w-full">
        {/* Static rain animation background with lower z-index */}
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
          <EnhancedRainAnimation count={30} className="opacity-40" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative z-10">
          <div className="container mx-auto px-4 py-6 max-w-6xl relative">
            {/* Remove second rain animation for performance */}
            
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-blue-100/20 to-transparent rounded-full -translate-y-1/4 translate-x-1/4 z-1"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-radial from-green-100/20 to-transparent rounded-full translate-y-1/4 -translate-x-1/4 z-1"></div>
            
            <div className="flex flex-col items-center text-center mb-12 relative z-10">
              <div className="flex mb-3 gap-3 relative">
                <div className="absolute inset-0 bg-gradient-radial from-blue-50/50 to-transparent rounded-full scale-150 z-0"></div>
                <DropletIcon className="h-12 w-12 text-water relative z-10 animate-float" />
                <Sprout className="h-12 w-12 text-earth relative z-10 animate-float-delay" />
              </div>
              
              <h1 className="text-5xl font-bold mb-3 tracking-tight">
                <span className="text-water bg-gradient-to-r from-water to-blue-500 bg-clip-text text-transparent">{activeContent.title.split(" ")[0].substring(0, 3)}</span>
                <span className="text-earth bg-gradient-to-r from-earth to-green-500 bg-clip-text text-transparent">{activeContent.title.split(" ")[0].substring(3)}</span>
                {activeContent.title.split(" ").length > 1 && (
                  <>
                    <span className="text-water-dark bg-gradient-to-r from-blue-500 to-water-dark bg-clip-text text-transparent">
                      {activeContent.title.split(" ").slice(1).join(" ")}
                    </span>
                  </>
                )}
              </h1>
              
              <p className="text-xl text-muted-foreground mb-4 font-medium">{activeContent.subtitle}</p>
              <p className="max-w-2xl text-center text-gray-600 dark:text-gray-400">{activeContent.description}</p>
              
              <div className="flex items-center mt-8 gap-5 flex-wrap justify-center">
                <Button 
                  onClick={() => navigate('/reports')} 
                  size="lg" 
                  className="gap-2 bg-water hover:bg-water-dark text-white shadow-md hover:shadow-xl transition-all duration-300 px-6 py-6 relative z-10 app-button-glow water-button-glow"
                >
                  <span className="relative z-10">{activeContent.cta}</span>
                  <ArrowRight className="h-5 w-5 animate-bounce-x" />
                </Button>
                
                <KrishiMitraAI
                  language={normalizedLanguage}
                  className="px-6 py-6 shadow-md hover:shadow-xl transition-all duration-300 relative z-10 glowing"
                />

                <Button 
                  onClick={() => window.open('https://jaldharabusiness.web.app', '_blank')} 
                  size="lg" 
                  className="gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-xl transition-all duration-300 px-6 py-6 relative z-10 app-button-glow purple-button-glow"
                >
                  <span className="relative z-10">{activeContent.business}</span>
                  <Building className="h-5 w-5 animate-bounce-x" />
                </Button>
              </div>
            </div>
            
            {/* Features as cards with icons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-12">
              {activeContent.features.map((feature, index) => (
                <Card key={index} className="border-water/30 hover:border-water hover:shadow-md transition-all duration-300 overflow-hidden group relative z-10">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-radial from-water/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CardContent className="p-5 flex flex-col items-center text-center">
                    {feature.icon}
                    <h3 className="font-semibold mb-1 text-water-dark">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Weather and Advice section */}
            <div className="grid md:grid-cols-2 gap-6 relative z-10">
              <div>
                <WeatherWidget 
                  language={normalizedLanguage} 
                  locationProp={sharedLocation}
                  onLocationSelected={handleLocationSelected}
                />
              </div>
              <div>
                <AiAdviceWidget language={normalizedLanguage} />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(5deg); }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          .animate-float-delay {
            animation: float 3s ease-in-out infinite;
            animation-delay: 0.5s;
          }
          @keyframes bounce-x {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(5px); }
          }
          .animate-bounce-x {
            animation: bounce-x 1s infinite;
          }
          .earth-button-glow {
            box-shadow: 0 0 15px 5px rgba(34, 197, 94, 0.3);
          }
          .earth-button-glow:hover {
            box-shadow: 0 0 20px 8px rgba(34, 197, 94, 0.4);
          }
          .purple-button-glow {
            box-shadow: 0 0 15px 5px rgba(147, 51, 234, 0.3);
          }
          .purple-button-glow:hover {
            box-shadow: 0 0 20px 8px rgba(147, 51, 234, 0.4);
          }
        `}
      </style>
    </div>
  );
};

export default LandingPage;
