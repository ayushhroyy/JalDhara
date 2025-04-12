import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Droplets, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { getRainfallForecast } from '@/integrations/weather';

interface RainfallForecastWidgetProps {
  language: 'en' | 'hi';
  locationProp?: string;
  onLocationSelected?: (location: string) => void;
}

const RainfallForecastWidget: React.FC<RainfallForecastWidgetProps> = ({ 
  language, 
  locationProp,
  onLocationSelected 
}) => {
  const [location, setLocation] = useState(locationProp || '');
  const [isLoading, setIsLoading] = useState(false);
  const [forecast, setForecast] = useState<{ 
    daily: { date: string; rainfall_mm: number }[];
    total: number;
    error?: string;
  } | null>(null);

  // Update location state when locationProp changes
  useEffect(() => {
    if (locationProp) {
      setLocation(locationProp);
      // Automatically fetch data if locationProp is provided
      if (locationProp.trim() !== '') {
        fetchForecast(locationProp);
      }
    }
  }, [locationProp]);

  const fetchForecast = async (loc: string) => {
    setIsLoading(true);
    
    try {
      const data = await getRainfallForecast(loc);
      
      if (data.error) {
        toast.error(data.error);
        return;
      }
      
      setForecast(data);
    } catch (error) {
      console.error("Error getting rainfall forecast:", error);
      toast.error(
        language === 'en' 
          ? 'Error getting rainfall forecast. Please try again.' 
          : 'वर्षा पूर्वानुमान प्राप्त करने में त्रुटि। कृपया पुनः प्रयास करें।'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location.trim()) {
      toast.error(
        language === 'en' 
          ? 'Please enter a location' 
          : 'कृपया एक स्थान दर्ज करें'
      );
      return;
    }
    
    // Call fetchForecast with current location
    await fetchForecast(location);
    
    // Notify parent component if provided
    if (onLocationSelected) {
      onLocationSelected(location);
    }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'hi-IN', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="border-blue-400">
      <CardHeader className="bg-blue-50 dark:bg-blue-950">
        <CardTitle className="text-lg">
          {language === 'en' ? '7-Day Rainfall Forecast' : '7-दिन का वर्षा पूर्वानुमान'}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder={language === 'en' ? 'Enter location' : 'स्थान दर्ज करें'}
              value={location}
              onChange={handleLocationChange}
              disabled={isLoading}
              className="flex-1"
            />
            
            <Button 
              type="submit" 
              disabled={isLoading} 
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
        
        {forecast && forecast.daily.length > 0 && (
          <div className="mt-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md mb-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {language === 'en' ? 'Total 7-Day Rainfall:' : 'कुल 7-दिन की वर्षा:'}
                </span>
                <span className="font-bold text-blue-600">
                  {forecast.total} mm
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              {forecast.daily.map((day, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{formatDate(day.date)}</span>
                  </div>
                  <div className="flex items-center">
                    <Droplets className="h-4 w-4 mr-1 text-blue-600" />
                    <span>{day.rainfall_mm} mm</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RainfallForecastWidget; 