import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { SupportedLanguage } from '@/App';

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-water" />
    <span className="ml-2 text-lg font-medium text-water">Loading...</span>
  </div>
);

// Component Loader for smaller components
const ComponentLoader = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-6 w-6 animate-spin text-water" />
  </div>
);

// Type definitions for props
interface PageProps {
  language: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
}

// Lazy loaded components with Suspense
export const LazyReports = lazy(() => import('./Reports'));
export const LazyNews = lazy(() => import('./News'));
export const LazySavedReports = lazy(() => import('./SavedReports'));
export const LazyLandingPage = lazy(() => import('./LandingPage'));

// Lazy loaded sub-components for Reports page
const LazyWaterUsageChart = lazy(() => import('@/components/WaterUsageChart'));
const LazyAiAdviceWidget = lazy(() => import('@/components/AiAdviceWidget'));

// Wrapped components with suspense
export const ReportsPage = (props: PageProps) => (
  <Suspense fallback={<PageLoader />}>
    <LazyReports 
      {...props} 
      WaterUsageChart={(chartProps: any) => (
        <Suspense fallback={<ComponentLoader />}>
          <LazyWaterUsageChart {...chartProps} />
        </Suspense>
      )}
      AiAdviceWidget={(widgetProps: any) => (
        <Suspense fallback={<ComponentLoader />}>
          <LazyAiAdviceWidget {...widgetProps} />
        </Suspense>
      )}
    />
  </Suspense>
);

export const NewsPage = (props: PageProps) => (
  <Suspense fallback={<PageLoader />}>
    <LazyNews {...props} />
  </Suspense>
);

export const SavedReportsPage = (props: PageProps) => (
  <Suspense fallback={<PageLoader />}>
    <LazySavedReports {...props} />
  </Suspense>
);

export const IndexPage = (props: PageProps) => (
  <Suspense fallback={<PageLoader />}>
    <LazyLandingPage {...props} />
  </Suspense>
); 