import React from 'react';
import LandingPage from './LandingPage';
import { SupportedLanguage } from '@/App';

interface IndexProps {
  language: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
}

const Index: React.FC<IndexProps> = ({ language, onLanguageChange }) => {
  return <LandingPage language={language} onLanguageChange={onLanguageChange} />;
};

export default Index;
