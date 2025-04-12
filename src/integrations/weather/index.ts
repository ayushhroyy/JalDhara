export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  rainfall_mm: number;
  error?: string;
}

/**
 * Fetch weather data for a location
 */
export async function getWeatherData(location: string): Promise<WeatherData> {
  try {
    const API_KEY = "02ec49771af24aaa8e890937251204";
    const url = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(location)}&aqi=no`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    return {
      location: data.location.name,
      temperature: data.current.temp_c,
      condition: data.current.condition.text,
      humidity: data.current.humidity,
      rainfall_mm: data.current.precip_mm,
    };
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return {
      location: "",
      temperature: 0,
      condition: "",
      humidity: 0,
      rainfall_mm: 0,
      error: "Unable to fetch weather data. Please try again."
    };
  }
}

/**
 * Get rainfall forecast data
 */
export async function getRainfallForecast(location: string): Promise<{
  daily: { date: string; rainfall_mm: number }[];
  total: number;
  error?: string;
}> {
  try {
    const API_KEY = "02ec49771af24aaa8e890937251204";
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(location)}&days=7&aqi=no&alerts=no`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    const dailyRainfall = data.forecast.forecastday.map((day: any) => ({
      date: day.date,
      rainfall_mm: day.day.totalprecip_mm
    }));
    
    const totalRainfall = dailyRainfall.reduce(
      (sum: number, day: { rainfall_mm: number }) => sum + day.rainfall_mm,
      0
    );
    
    return {
      daily: dailyRainfall,
      total: totalRainfall
    };
  } catch (error) {
    console.error("Error fetching rainfall forecast:", error);
    return {
      daily: [],
      total: 0,
      error: "Unable to fetch rainfall forecast. Please try again."
    };
  }
} 