import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import NotFound from "./pages/NotFound";
import { TranslationProvider } from "./contexts/TranslationContext";
import { AppProvider } from "./contexts/AppContext";
import { IndexPage, ReportsPage, NewsPage, SavedReportsPage } from "./pages/LazyComponents";

const queryClient = new QueryClient();

// Define all supported languages
export type SupportedLanguage = 'en' | 'hi' | 'bn' | 'mr' | 'te' | 'ta' | 'gu' | 'ur' | 'kn' | 'ml' | 'pa';

// Language display names
export const languageNames: Record<SupportedLanguage, string> = {
  en: 'English',
  hi: 'हिंदी', // Hindi
  bn: 'বাংলা', // Bengali
  mr: 'मराठी', // Marathi
  te: 'తెలుగు', // Telugu
  ta: 'தமிழ்', // Tamil
  gu: 'ગુજરાતી', // Gujarati
  ur: 'اردو', // Urdu
  kn: 'ಕನ್ನಡ', // Kannada
  ml: 'മലയാളം', // Malayalam
  pa: 'ਪੰਜਾਬੀ'  // Punjabi
};

// Footer translations
export const footerText: Record<SupportedLanguage, string> = {
  en: "© 2025 JalDhara - AI-Powered Water Management Assistant",
  hi: "© 2025 जलधारा - AI-संचालित जल प्रबंधन सहायक",
  bn: "© 2025 জলধারা - AI-পাওয়ার্ড জল ব্যবস্থাপনা সহকারী",
  mr: "© 2025 जलधारा - AI-संचालित पाणी व्यवस्थापन सहाय्यक",
  te: "© 2025 జల్దర - AI-పవర్డ్ నీటి నిర్వహణ సహాయకుడు",
  ta: "© 2025 ஜல்தாரா - AI-இயக்கப்படும் நீர் மேலாண்மை உதவியாளர்",
  gu: "© 2025 જલધારા - AI-સંચાલિત પાણી વ્યવસ્થાપન સહાયક",
  ur: "© 2025 جل دھارا - AI-پاور واٹر مینجمنٹ اسسٹنٹ",
  kn: "© 2025 ಜಲ್ಧಾರ - AI-ಪವರ್ಡ್ ನೀರಿನ ನಿರ್ವಹಣಾ ಸಹಾಯಕ",
  ml: "© 2025 ജൽധാര - AI-പവർഡ് വാട്ടർ മാനേജ്മെന്റ് അസിസ്റ്റന്റ്",
  pa: "© 2025 ਜਲਧਾਰਾ - AI-ਸੰਚਾਲਿਤ ਪਾਣੀ ਪ੍ਰਬੰਧਨ ਸਹਾਇਕ"
};

const App = () => {
  const [language, setLanguage] = useState<SupportedLanguage>('en');

  // Load saved language preference from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && Object.keys(languageNames).includes(savedLanguage)) {
      setLanguage(savedLanguage as SupportedLanguage);
    }
  }, []);

  // Save language preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('preferredLanguage', language);
  }, [language]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <TranslationProvider language={language}>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="min-h-screen flex flex-col">
                <Header currentLanguage={language} onLanguageChange={setLanguage} />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<IndexPage language={language} onLanguageChange={setLanguage} />} />
                    <Route path="/reports" element={<ReportsPage language={language} />} />
                    <Route path="/news" element={<NewsPage language={language} />} />
                    <Route path="/saved-reports" element={<SavedReportsPage language={language} />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <footer className="border-t py-4 text-center text-sm text-muted-foreground relative">
                  {footerText[language]}
                </footer>
              </div>
            </BrowserRouter>
          </TranslationProvider>
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
