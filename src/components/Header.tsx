import React, { useMemo, memo } from 'react';
import { DropletIcon, Sprout, Newspaper, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import KrishiMitraAI from './KrishiMitraButton';
import { cn } from '@/lib/utils';
import { SupportedLanguage, languageNames } from '@/App';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/useTranslation';
import { getTranslation } from '@/utils/translations';

interface HeaderProps {
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
}

const Header: React.FC<HeaderProps> = memo(({ currentLanguage, onLanguageChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(currentLanguage);
  
  // Get translated navigation items
  const translations = useMemo(() => ({
    home: getTranslation('home', currentLanguage),
    news: getTranslation('news', currentLanguage),
    reports: getTranslation('reports', currentLanguage)
  }), [currentLanguage]);
  
  const isActive = (path: string) => location.pathname === path;

  // Quick toggle between English and Hindi
  const toggleMainLanguage = () => {
    onLanguageChange(currentLanguage === 'en' ? 'hi' : 'en');
  };

  // Other languages (exclude English and Hindi)
  const otherLanguages = useMemo(() => 
    Object.entries(languageNames)
      .filter(([code]) => code !== 'en' && code !== 'hi')
      .map(([code, name]) => ({ code, name })),
    []
  );

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
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/')}
            className={cn(
              "hidden sm:inline-flex",
              isActive('/') && "bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900",
              !isActive('/') && "hover:bg-blue-50 hover:text-blue-600"
            )}
          >
            {translations.home}
          </Button>
          
          <KrishiMitraAI 
            language={currentLanguage === 'hi' ? 'hi' : 'en'}
            className="hidden sm:inline-flex h-9"
          />
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/news')}
            className={cn(
              "hidden sm:inline-flex items-center",
              isActive('/news') && "bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900",
              !isActive('/news') && "hover:bg-blue-50 hover:text-blue-600"
            )}
          >
            <Newspaper className="h-4 w-4 mr-1" />
            {translations.news}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/reports')}
            className={cn(
              "hidden sm:inline-flex",
              isActive('/reports') && "bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900",
              !isActive('/reports') && "hover:bg-blue-50 hover:text-blue-600"
            )}
          >
            {translations.reports}
          </Button>
          
          {/* EN/HI Quick Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleMainLanguage}
            className="min-w-20 hover:bg-blue-50 hover:text-blue-600"
          >
            {currentLanguage === 'en' ? 'हिंदी' : 'English'}
          </Button>

          {/* Language Dropdown (only for other languages) */}
          {otherLanguages.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 relative">
                  <span className="sr-only">Other Languages</span>
                  <Globe className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {otherLanguages.map(({ code, name }) => (
                  <DropdownMenuItem
                    key={code}
                    onClick={() => onLanguageChange(code as SupportedLanguage)}
                    className={currentLanguage === code ? "bg-blue-50 font-medium" : ""}
                  >
                    {name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
