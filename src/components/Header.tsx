import React from 'react';
import { DropletIcon, Sprout, Mic, Newspaper, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
  currentLanguage: 'en' | 'hi';
  onLanguageChange: (lang: 'en' | 'hi') => void;
}

const Header: React.FC<HeaderProps> = ({ currentLanguage, onLanguageChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2" onClick={() => navigate('/')} role="button">
          <div className="flex gap-1">
            <DropletIcon className="h-6 w-6 text-water" />
            <Sprout className="h-6 w-6 text-earth" />
          </div>
          <h1 className="text-xl font-bold">
            <span className="text-water">Jal</span><span className="text-earth">Dhara</span>
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            variant={isActive('/') ? "secondary" : "ghost"} 
            size="sm"
            onClick={() => navigate('/')}
            className="hidden sm:inline-flex"
          >
            {currentLanguage === 'en' ? 'Home' : 'होम'}
          </Button>
          
          <Button 
            variant={isActive('/voice-assistant') ? "secondary" : "ghost"} 
            size="sm"
            onClick={() => navigate('/voice-assistant')}
            className="hidden sm:inline-flex items-center"
          >
            <Mic className="h-4 w-4 mr-1" />
            {currentLanguage === 'en' ? 'Voice Assistant' : 'वॉयस असिस्टेंट'}
          </Button>
          
          <Button 
            variant={isActive('/modern-voice') ? "secondary" : "ghost"} 
            size="sm"
            onClick={() => navigate('/modern-voice')}
            className="hidden sm:inline-flex items-center"
          >
            <Bot className="h-4 w-4 mr-1" />
            {currentLanguage === 'en' ? 'Modern AI' : 'आधुनिक AI'}
          </Button>
          
          <Button 
            variant={isActive('/news') ? "secondary" : "ghost"} 
            size="sm"
            onClick={() => navigate('/news')}
            className="hidden sm:inline-flex items-center"
          >
            <Newspaper className="h-4 w-4 mr-1" />
            {currentLanguage === 'en' ? 'News' : 'समाचार'}
          </Button>
          
          <Button 
            variant={isActive('/reports') ? "secondary" : "ghost"} 
            size="sm"
            onClick={() => navigate('/reports')}
            className="hidden sm:inline-flex"
          >
            {currentLanguage === 'en' ? 'Reports' : 'रिपोर्ट'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onLanguageChange(currentLanguage === 'en' ? 'hi' : 'en')}
            className="min-w-20"
          >
            {currentLanguage === 'en' ? 'हिंदी' : 'English'}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
