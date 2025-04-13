import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { SupportedLanguage } from '@/App';
import { getTranslation } from '@/utils/translations';

// Define the context type
interface TranslationContextType {
  t: (key: string) => string;
  language: SupportedLanguage;
}

// Create the context with default values
const TranslationContext = createContext<TranslationContextType>({
  t: (key: string) => key,
  language: 'en'
});

// Props for the provider component
interface TranslationProviderProps {
  language: SupportedLanguage;
  children: ReactNode;
}

/**
 * Provider component that makes translation functionality available to the app
 */
export const TranslationProvider: React.FC<TranslationProviderProps> = ({ language, children }) => {
  // Translation function
  const t = (key: string): string => {
    return getTranslation(key, language);
  };

  // Context value - memoize to prevent unnecessary re-renders
  const value = useMemo(() => ({
    t,
    language
  }), [language]);

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

/**
 * Hook to use the translation context
 * @returns Translation utilities
 */
export const useTranslationContext = (): TranslationContextType => {
  const context = useContext(TranslationContext);
  
  if (!context) {
    throw new Error('useTranslationContext must be used within a TranslationProvider');
  }
  
  return context;
};

export default TranslationContext; 