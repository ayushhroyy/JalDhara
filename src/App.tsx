import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Header from "@/components/Header";
import Index from "./pages/Index";
import Reports from "./pages/Reports";
import VoiceAssistant from "./pages/VoiceAssistant";
import News from "./pages/News";
import ModernVoiceAssistant from "./pages/ModernVoiceAssistant";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <Header currentLanguage={language} onLanguageChange={setLanguage} />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Index language={language} />} />
                <Route path="/reports" element={<Reports language={language} />} />
                <Route path="/voice-assistant" element={<VoiceAssistant language={language} />} />
                <Route path="/news" element={<News language={language} />} />
                <Route path="/modern-voice" element={<ModernVoiceAssistant language={language} />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <footer className="border-t py-4 text-center text-sm text-muted-foreground">
              {language === 'en' 
                ? "© 2025 JalDhara - AI-Powered Water Management Assistant" 
                : "© 2025 जलधारा - AI-संचालित जल प्रबंधन सहायक"}
            </footer>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
