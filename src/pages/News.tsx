import React, { useState, useEffect } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ExternalLink, 
  Newspaper, 
  Building,
  Tractor,
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { getFarmingNews, getGovernmentSchemes, NewsItem } from '@/integrations/news';
import { SupportedLanguage } from '@/App';
import { getTranslation } from '@/utils/translations';

interface NewsPageProps {
  language: SupportedLanguage;
}

const News: React.FC<NewsPageProps> = ({ language }) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [schemeItems, setSchemeItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('farming');
  const [error, setError] = useState<string | null>(null);

  // Get translations directly using the translation utility
  const translations = {
    pageTitle: getTranslation('newsTitle', language) || 'Agriculture News & Schemes',
    pageDescription: getTranslation('newsDescription', language) || 'Latest farming news and government schemes for farmers',
    farmingNewsTab: getTranslation('farmingNewsTab', language) || 'Farming News',
    schemesTab: getTranslation('schemesTab', language) || 'Government Schemes',
    readMore: getTranslation('readMore', language) || 'Read More',
    loadingText: getTranslation('loading', language) || 'Loading news...',
    errorMessage: getTranslation('errorMessage', language) || 'Failed to load news. Please try again later.',
    noNews: getTranslation('noNewsAvailable', language) || 'No news available at the moment.',
    publishedOn: getTranslation('publishedOn', language) || 'Published on',
    source: getTranslation('source', language) || 'Source',
    errorOccurred: getTranslation('errorOccurred', language) || 'An error occurred. Please try again later.'
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      
      try {
        // Load both farming news and government schemes
        const [newsData, schemesData] = await Promise.all([
          getFarmingNews(language),
          getGovernmentSchemes(language)
        ]);
        
        if (newsData.error) {
          throw new Error(newsData.error);
        }
        
        if (schemesData.error) {
          throw new Error(schemesData.error);
        }
        
        setNewsItems(newsData.results);
        setSchemeItems(schemesData.results);
      } catch (err) {
        console.error('Error loading news:', err);
        setError(translations.errorOccurred);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [language, translations.errorOccurred]);

  // Format date in a user-friendly way
  const formatDate = (dateString: string) => {
    try {
      // Get locale based on language
      const localeMap: Record<SupportedLanguage, string> = {
        en: 'en-US',
        hi: 'hi-IN',
        bn: 'bn-IN',
        mr: 'mr-IN',
        te: 'te-IN',
        ta: 'ta-IN',
        gu: 'gu-IN',
        ur: 'ur-IN',
        kn: 'kn-IN',
        ml: 'ml-IN',
        pa: 'pa-IN'
      };
      
      const locale = localeMap[language] || 'en-US';
      const date = new Date(dateString);
      
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  // Render a news card
  const renderNewsCard = (item: NewsItem) => (
    <Card key={item.link} className="mb-4 overflow-hidden border-water/20 hover:border-water transition-all">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold line-clamp-2">{item.title}</CardTitle>
        <CardDescription className="flex items-center text-xs">
          <Clock className="h-3 w-3 mr-1 inline" />
          {translations.publishedOn} {formatDate(item.pubDate)}
        </CardDescription>
      </CardHeader>
      
      {item.image_url && (
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={item.image_url} 
            alt={item.title} 
            className="w-full h-full object-cover" 
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        </div>
      )}
      
      <CardContent className="py-3">
        <p className="text-sm line-clamp-3">{item.description || item.content}</p>
      </CardContent>
      
      <CardFooter className="flex justify-between items-center border-t border-border/30 pt-3 pb-2 text-xs">
        <span className="text-muted-foreground flex items-center">
          <Newspaper className="h-3 w-3 mr-1" />
          {translations.source}: {item.source_id}
        </span>
        <Button size="sm" variant="outline" className="h-8" asChild>
          <a href={item.link} target="_blank" rel="noopener noreferrer">
            {translations.readMore}
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );

  // Display loading skeletons
  const renderSkeletons = () => (
    <div>
      {[1, 2, 3].map((i) => (
        <Card key={i} className="mb-4 overflow-hidden">
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/4 mt-2" />
          </CardHeader>
          <div className="px-6">
            <Skeleton className="h-32 w-full" />
          </div>
          <CardContent className="py-3">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
          <CardFooter className="pt-3 pb-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-8 w-24" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="container py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-water-dark">
            {translations.pageTitle}
          </h1>
          <p className="text-muted-foreground mt-2">
            {translations.pageDescription}
          </p>
        </div>
        
        <Tabs defaultValue="farming" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="farming" className="flex items-center gap-2">
              <Tractor className="h-4 w-4" />
              {translations.farmingNewsTab}
            </TabsTrigger>
            <TabsTrigger value="schemes" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              {translations.schemesTab}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="farming" className="mt-0">
            {loading ? (
              renderSkeletons()
            ) : error ? (
              <Card className="bg-red-50 border-red-200">
                <CardContent className="pt-6 flex items-center">
                  <AlertCircle className="text-red-500 h-5 w-5 mr-2" />
                  <p>{translations.errorMessage}</p>
                </CardContent>
              </Card>
            ) : newsItems.length > 0 ? (
              newsItems.map(renderNewsCard)
            ) : (
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="pt-6">
                  <p>{translations.noNews}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="schemes" className="mt-0">
            {loading ? (
              renderSkeletons()
            ) : error ? (
              <Card className="bg-red-50 border-red-200">
                <CardContent className="pt-6 flex items-center">
                  <AlertCircle className="text-red-500 h-5 w-5 mr-2" />
                  <p>{translations.errorMessage}</p>
                </CardContent>
              </Card>
            ) : schemeItems.length > 0 ? (
              schemeItems.map(renderNewsCard)
            ) : (
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="pt-6">
                  <p>{translations.noNews}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default News; 