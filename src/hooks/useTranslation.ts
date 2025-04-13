import { useCallback, useMemo } from "react";
import { SupportedLanguage } from "@/App";
import { getTranslation } from "@/utils/translations";

// Supported languages mapping
const supportedLanguages = {
  en: "English",
  hi: "हिंदी",
  bn: "বাংলা",
  mr: "मराठी",
  te: "తెలుగు",
  ta: "தமிழ்",
  gu: "ગુજરાતી",
  ur: "اردو",
  kn: "ಕನ್ನಡ",
  ml: "മലയാളം",
  pa: "ਪੰਜਾਬੀ"
};

/**
 * Result of useTranslation hook
 */
export interface TranslationResult {
  /** Translation function */
  t: (key: string) => string;
  /** Current language */
  language: SupportedLanguage;
  /** Get available languages */
  getLanguages: () => typeof supportedLanguages;
}

/**
 * Hook for providing translation functionality
 * @param language Current language
 * @returns Translation utilities
 */
export const useTranslation = (language: SupportedLanguage | string): TranslationResult => {
  // Normalize language to supported options
  const normalizedLanguage = useMemo<SupportedLanguage>(() => {
    return Object.keys(supportedLanguages).includes(language) 
      ? language as SupportedLanguage 
      : "en";
  }, [language]);
  
  // Function to translate a key
  const t = useCallback((key: string): string => {
    // Use getTranslation from utils/translations first
    const translation = getTranslation(key, normalizedLanguage);
    // If translation exists in utils/translations, use it
    if (translation !== key) {
      return translation;
    }
    
    // Otherwise, fall back to the static translations if available
    // This provides backward compatibility with code that used the previous version
    if (
      staticTranslations[normalizedLanguage] && 
      staticTranslations[normalizedLanguage][key]
    ) {
      return staticTranslations[normalizedLanguage][key];
    }
    
    // Return the key itself if no translation found
    return key;
  }, [normalizedLanguage]);

  // Return supported languages
  const getLanguages = useCallback(() => {
    return supportedLanguages;
  }, []);

  return { 
    t,
    language: normalizedLanguage,
    getLanguages
  };
};

// Static translations for backwards compatibility
const staticTranslations: Record<string, Record<string, string>> = {
  en: {
    "Saved Soil Reports": "Saved Soil Reports",
    "All Reports": "All Reports",
    "Basic Reports": "Basic Reports",
    "Detailed Reports": "Detailed Reports",
    "No saved reports found": "No saved reports found",
    "Create a new report": "Create a new report",
    "Report Type": "Report Type",
    "Basic": "Basic",
    "Detailed": "Detailed",
    "View": "View",
    "Download": "Download",
    "Share": "Share",
    "Error": "Error",
    "Failed to load saved reports": "Failed to load saved reports",
    "Report Deleted": "Report Deleted",
    "The report has been deleted successfully": "The report has been deleted successfully",
    "Failed to delete report": "Failed to delete report",
    "Report Downloaded": "Report Downloaded",
    "The report has been downloaded successfully": "The report has been downloaded successfully",
    "Failed to download report": "Failed to download report",
    "Sharing not supported": "Sharing not supported",
    "Your browser doesn't support the Web Share API": "Your browser doesn't support the Web Share API",
    "Soil Report": "Soil Report",
    "Check out this soil report for": "Check out this soil report for"
  },
  hi: {
    "Saved Soil Reports": "सहेजी गई मिट्टी की रिपोर्ट",
    "All Reports": "सभी रिपोर्ट",
    "Basic Reports": "बुनियादी रिपोर्ट",
    "Detailed Reports": "विस्तृत रिपोर्ट",
    "No saved reports found": "कोई सहेजी गई रिपोर्ट नहीं मिली",
    "Create a new report": "नई रिपोर्ट बनाएं",
    "Report Type": "रिपोर्ट प्रकार",
    "Basic": "बुनियादी",
    "Detailed": "विस्तृत",
    "View": "देखें",
    "Download": "डाउनलोड",
    "Share": "साझा करें",
    "Error": "त्रुटि",
    "Failed to load saved reports": "सहेजी गई रिपोर्ट लोड करने में विफल",
    "Report Deleted": "रिपोर्ट हटा दी गई",
    "The report has been deleted successfully": "रिपोर्ट सफलतापूर्वक हटा दी गई है",
    "Failed to delete report": "रिपोर्ट हटाने में विफल",
    "Report Downloaded": "रिपोर्ट डाउनलोड की गई",
    "The report has been downloaded successfully": "रिपोर्ट सफलतापूर्वक डाउनलोड की गई है",
    "Failed to download report": "रिपोर्ट डाउनलोड करने में विफल",
    "Sharing not supported": "साझाकरण समर्थित नहीं है",
    "Your browser doesn't support the Web Share API": "आपका ब्राउज़र वेब शेयर API का समर्थन नहीं करता है",
    "Soil Report": "मिट्टी की रिपोर्ट",
    "Check out this soil report for": "इस स्थान के लिए मिट्टी की रिपोर्ट देखें"
  }
}; 