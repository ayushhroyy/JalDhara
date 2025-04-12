import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, MapPin, Cloud, Droplets, Thermometer, Calendar, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { getWeatherData, WeatherData, getRainfallForecast } from '@/integrations/weather';

interface WeatherWidgetProps {
  language: 'en' | 'hi';
  locationProp?: string;
  onLocationSelected?: (location: string) => void;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ 
  language, 
  locationProp,
  onLocationSelected 
}) => {
  const [location, setLocation] = useState(locationProp || '');
  const [displayLocation, setDisplayLocation] = useState(''); // For display purposes
  const [isLoading, setIsLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [showWeatherDetails, setShowWeatherDetails] = useState(false);
  const [forecast, setForecast] = useState<{ 
    daily: { date: string; rainfall_mm: number }[];
    total: number;
    error?: string;
  } | null>(null);

  // Detect user's location if no location is provided
  useEffect(() => {
    if (!location && !locationProp) {
      getUserLocation();
    }
  }, []);

  // Update location state when locationProp changes
  useEffect(() => {
    if (locationProp) {
      setLocation(locationProp);
      // Automatically fetch data if locationProp is provided
      if (locationProp.trim() !== '') {
        fetchWeather(locationProp);
      }
    }
  }, [locationProp]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = `${position.coords.latitude},${position.coords.longitude}`;
          setDisplayLocation(language === 'en' ? 'Current Location' : 'वर्तमान स्थान');
          setLocation(coords);
          fetchWeather(coords);
          if (onLocationSelected) {
            onLocationSelected(coords);
          }
        },
        (error) => {
          console.error("Error getting user location:", error);
          toast.error(
            language === 'en' 
              ? 'Could not get your location. Please enter it manually.' 
              : 'आपका स्थान प्राप्त नहीं कर सका। कृपया इसे मैन्युअल रूप से दर्ज करें।'
          );
        }
      );
    } else {
      toast.error(
        language === 'en' 
          ? 'Geolocation is not supported by your browser.' 
          : 'जियोलोकेशन आपके ब्राउज़र द्वारा समर्थित नहीं है।'
      );
    }
  };

  const fetchWeather = async (loc: string) => {
    setIsLoading(true);
    
    try {
      const data = await getWeatherData(loc);
      
      if (data.error) {
        toast.error(data.error);
        return;
      }
      
      setWeather(data);
      
      // Update display location with the proper city name from API
      setDisplayLocation(data.location);
      
      // Also fetch forecast data
      const forecastData = await getRainfallForecast(loc);
      setForecast(forecastData);
    } catch (error) {
      console.error("Error getting weather data:", error);
      toast.error(
        language === 'en' 
          ? 'Error getting weather data. Please try again.' 
          : 'मौसम डेटा प्राप्त करने में त्रुटि। कृपया पुनः प्रयास करें।'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value);
    setDisplayLocation(e.target.value);
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
    
    // Call fetchWeather with current location
    await fetchWeather(location);
    
    // Notify parent component if provided
    if (onLocationSelected) {
      onLocationSelected(location);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'hi-IN', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <Card 
        className="border-blue-400 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => weather && setShowWeatherDetails(true)}
      >
        <CardHeader className="bg-blue-50 dark:bg-blue-950">
          <CardTitle className="text-lg flex justify-between items-center">
            <span>{language === 'en' ? 'Weather Information' : 'मौसम की जानकारी'}</span>
            {weather && <ChevronRight className="h-4 w-4" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder={language === 'en' ? 'Enter city or location' : 'शहर या स्थान दर्ज करें'}
                value={displayLocation}
                onChange={handleLocationChange}
                disabled={isLoading}
                className="flex-1"
                onClick={(e) => e.stopPropagation()}
              />
              
              <Button 
                type="submit" 
                disabled={isLoading} 
                variant="outline"
                onClick={(e) => e.stopPropagation()}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
          
          {weather && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
              <h3 className="font-medium mb-2">{weather.location}</h3>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center">
                  <Thermometer className="h-4 w-4 mr-1 text-red-500" />
                  <span>
                    {language === 'en' ? 'Temperature: ' : 'तापमान: '}
                    {weather.temperature}°C
                  </span>
                </div>
                
                <div className="flex items-center">
                  <Cloud className="h-4 w-4 mr-1 text-blue-500" />
                  <span>
                    {language === 'en' ? 'Condition: ' : 'स्थिति: '}
                    {weather.condition}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <Droplets className="h-4 w-4 mr-1 text-blue-500" />
                  <span>
                    {language === 'en' ? 'Humidity: ' : 'आर्द्रता: '}
                    {weather.humidity}%
                  </span>
                </div>
                
                <div className="flex items-center">
                  <Droplets className="h-4 w-4 mr-1 text-blue-600" />
                  <span>
                    {language === 'en' ? 'Rainfall: ' : 'वर्षा: '}
                    {weather.rainfall_mm} mm
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Weather Dialog */}
      <Dialog open={showWeatherDetails} onOpenChange={setShowWeatherDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === 'en' ? 'Weather Forecast' : 'मौसम का पूर्वानुमान'} - {weather?.location}
            </DialogTitle>
          </DialogHeader>
          
          {weather && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                <h3 className="font-medium mb-2">{language === 'en' ? 'Current Weather' : 'वर्तमान मौसम'}</h3>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center">
                    <Thermometer className="h-4 w-4 mr-1 text-red-500" />
                    <span>
                      {language === 'en' ? 'Temperature: ' : 'तापमान: '}
                      {weather.temperature}°C
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <Cloud className="h-4 w-4 mr-1 text-blue-500" />
                    <span>
                      {language === 'en' ? 'Condition: ' : 'स्थिति: '}
                      {weather.condition}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <Droplets className="h-4 w-4 mr-1 text-blue-500" />
                    <span>
                      {language === 'en' ? 'Humidity: ' : 'आर्द्रता: '}
                      {weather.humidity}%
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <Droplets className="h-4 w-4 mr-1 text-blue-600" />
                    <span>
                      {language === 'en' ? 'Rainfall: ' : 'वर्षा: '}
                      {weather.rainfall_mm} mm
                    </span>
                  </div>
                </div>
              </div>
              
              {forecast && forecast.daily.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">{language === 'en' ? '7-Day Rainfall Forecast' : '7-दिन का वर्षा पूर्वानुमान'}</h3>
                  
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WeatherWidget; 