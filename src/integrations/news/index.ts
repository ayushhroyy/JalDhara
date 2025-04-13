import axios from 'axios';
import { SupportedLanguage } from '@/App';
import { mockFarmingNews, mockGovernmentSchemes } from './mockData';

export interface NewsItem {
  title: string;
  content: string;
  image_url?: string;
  link: string;
  pubDate: string;
  source_id: string;
  creator?: string | string[];
  description?: string;
  category?: string[];
}

export interface NewsResponse {
  status: string;
  totalResults: number;
  results: NewsItem[];
  nextPage?: string;
  error?: string;
}

const API_KEY = 'pub_80008226a8393471e05417e1b3fac522c8612';
const BASE_URL = 'https://newsdata.io/api/1';

// Support for all languages, but API only handles English and Hindi
export async function getFarmingNews(language: SupportedLanguage): Promise<NewsResponse> {
  // For languages other than English or Hindi, use mock data
  if (language !== 'en' && language !== 'hi') {
    return {
      status: 'success',
      totalResults: mockFarmingNews[language].length,
      results: mockFarmingNews[language]
    };
  }

  try {
    // Use category=agriculture and country for India (in) with language preference
    const response = await axios.get(`${BASE_URL}/news`, {
      params: {
        apikey: API_KEY,
        category: 'politics',
        country: 'in',
        language: language === 'en' ? 'en' : 'hi',
        q: 'farmer OR agriculture OR farming OR crop OR irrigation OR subsidy'
      }
    });

    return {
      status: response.data.status,
      totalResults: response.data.totalResults || 0,
      results: response.data.results || [],
      nextPage: response.data.nextPage,
    };
  } catch (error) {
    console.error('Error fetching farming news:', error);
    
    // On API error, fall back to mock data
    return {
      status: 'success',
      totalResults: mockFarmingNews[language].length,
      results: mockFarmingNews[language]
    };
  }
}

export async function getGovernmentSchemes(language: SupportedLanguage): Promise<NewsResponse> {
  // For languages other than English or Hindi, use mock data
  if (language !== 'en' && language !== 'hi') {
    return {
      status: 'success',
      totalResults: mockGovernmentSchemes[language].length,
      results: mockGovernmentSchemes[language]
    };
  }

  try {
    // Use specific search terms for government schemes
    const response = await axios.get(`${BASE_URL}/news`, {
      params: {
        apikey: API_KEY,
        q: 'farmer scheme OR agriculture subsidy OR MSP OR PM-Kisan OR farming initiative OR rural development',
        country: 'in',
        language: language === 'en' ? 'en' : 'hi',
      }
    });

    return {
      status: response.data.status,
      totalResults: response.data.totalResults || 0,
      results: response.data.results || [],
      nextPage: response.data.nextPage,
    };
  } catch (error) {
    console.error('Error fetching government schemes:', error);
    
    // On API error, fall back to mock data
    return {
      status: 'success',
      totalResults: mockGovernmentSchemes[language].length,
      results: mockGovernmentSchemes[language]
    };
  }
} 