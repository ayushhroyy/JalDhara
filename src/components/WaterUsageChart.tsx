import React, { useState, useEffect, Suspense } from 'react';
import { SupportedLanguage } from '@/App';
// Remove direct import of recharts components
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface WaterUsageData {
  name: string;
  current: number;
  recommended: number;
}

interface WaterUsageChartProps {
  data: WaterUsageData[];
  language: SupportedLanguage | 'en' | 'hi';
}

// Loading component
const ChartLoading = () => (
  <div className="w-full h-80 mt-6 flex flex-col items-center justify-center">
    <div className="h-48 w-full bg-gray-200 rounded-lg animate-pulse"></div>
    <div className="mt-4 h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
  </div>
);

// Core chart component separated for safe dynamic loading
const CoreChart = ({ data, language }: WaterUsageChartProps) => {
  // Normalize language for component
  const normalizedLanguage: 'en' | 'hi' = language === 'hi' ? 'hi' : 'en';
  const [Recharts, setRecharts] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Labels for the chart
  const tooltipLabels = {
    en: {
      current: 'Current Usage',
      recommended: 'Recommended Usage'
    },
    hi: {
      current: 'वर्तमान उपयोग',
      recommended: 'अनुशंसित उपयोग'
    }
  };

  const labels = {
    en: {
      title: 'Water Usage Comparison',
      yAxis: 'Water (liters per acre)',
      legend1: 'Current Usage',
      legend2: 'Recommended Usage'
    },
    hi: {
      title: 'जल उपयोग तुलना',
      yAxis: 'पानी (लीटर प्रति एकड़)',
      legend1: 'वर्तमान उपयोग',
      legend2: 'अनुशंसित उपयोग'
    }
  };

  // Safe loading of Recharts
  useEffect(() => {
    let isMounted = true;

    const loadRecharts = async () => {
      try {
        // Safely import Recharts components using dynamic import
        const module = await import('recharts');
        
        if (isMounted) {
          // Wrap in a setTimeout to ensure all dependencies are properly initialized
          setTimeout(() => {
            setRecharts(module);
            setIsLoading(false);
          }, 100);
        }
      } catch (error) {
        console.error("Error loading Recharts:", error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRecharts();

    return () => {
      isMounted = false;
    };
  }, []);

  // Show loading state while recharts is being imported
  if (isLoading || !Recharts) {
    return <ChartLoading />;
  }

  // Extract components safely
  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = Recharts;

  // Only render when all components are available
  if (!BarChart || !Bar || !XAxis || !YAxis || !CartesianGrid || !Tooltip || !Legend || !ResponsiveContainer) {
    return <ChartLoading />;
  }

  return (
    <div className="w-full h-80 mt-6">
      <h3 className="text-lg font-semibold mb-2 text-center">
        {labels[normalizedLanguage].title}
      </h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis label={{ value: labels[normalizedLanguage].yAxis, angle: -90, position: 'insideLeft' }} />
          <Tooltip 
            formatter={(value, name) => {
              const formattedValue = `${value.toLocaleString()} L`;
              const label = name === 'current' ? tooltipLabels[normalizedLanguage].current : tooltipLabels[normalizedLanguage].recommended;
              return [formattedValue, label];
            }}
          />
          <Legend />
          <Bar dataKey="current" name={labels[normalizedLanguage].legend1} fill="#219ebc" />
          <Bar dataKey="recommended" name={labels[normalizedLanguage].legend2} fill="#52b788" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Wrapper component with error boundary
const WaterUsageChart: React.FC<WaterUsageChartProps> = (props) => {
  // Simple error state
  const [hasError, setHasError] = useState(false);

  // Reset error on prop changes
  useEffect(() => {
    setHasError(false);
  }, [props.data]);

  // Fallback in case of errors
  if (hasError) {
    return (
      <div className="w-full h-80 mt-6 p-4 border border-orange-200 bg-orange-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-center text-orange-800">
          {props.language === 'hi' ? 'चार्ट लोड करने में समस्या' : 'Chart Loading Issue'}
        </h3>
        <p className="text-center text-orange-700">
          {props.language === 'hi' 
            ? 'डेटा विज़ुअलाइज़ेशन लोड करने में समस्या हुई। कृपया पेज को रिफ्रेश करें।' 
            : 'There was a problem loading the data visualization. Please refresh the page.'}
        </p>
      </div>
    );
  }

  return (
    <Suspense fallback={<ChartLoading />}>
      {/* Wrap in try-catch error handler */}
      <ErrorCatcher onError={() => setHasError(true)}>
        <CoreChart {...props} />
      </ErrorCatcher>
    </Suspense>
  );
};

// Simple error boundary component
class ErrorCatcher extends React.Component<{
  children: React.ReactNode;
  onError: () => void;
}> {
  componentDidCatch(error: any) {
    console.error("Chart error:", error);
    this.props.onError();
  }

  render() {
    return this.props.children;
  }
}

export default WaterUsageChart;
