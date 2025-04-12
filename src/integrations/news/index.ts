import axios from 'axios';

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

export async function getFarmingNews(language: 'en' | 'hi' = 'en'): Promise<NewsResponse> {
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
    return {
      status: 'error',
      totalResults: 0,
      results: [],
      error: 'Failed to fetch farming news'
    };
  }
}

export async function getGovernmentSchemes(language: 'en' | 'hi' = 'en'): Promise<NewsResponse> {
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
    return {
      status: 'error',
      totalResults: 0,
      results: [],
      error: 'Failed to fetch government schemes'
    };
  }
} 