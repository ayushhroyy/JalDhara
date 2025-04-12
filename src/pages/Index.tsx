
import React from 'react';
import LandingPage from './LandingPage';

interface IndexProps {
  language: 'en' | 'hi';
}

const Index: React.FC<IndexProps> = ({ language }) => {
  return <LandingPage language={language} />;
};

export default Index;
