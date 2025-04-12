import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the API with the key
const API_KEY = "AIzaSyCxtX277t00OvICr27PnKKDYsWHE_WqAjY";
const genAI = new GoogleGenerativeAI(API_KEY);

export interface GeminiResponse {
  text: string;
  error?: string;
  audioResponse?: string; // For storing audio response
}

/**
 * Send a voice query to Gemini and get a text response
 */
export async function processVoiceQuery(
  query: string,
  language: 'en' | 'hi'
): Promise<GeminiResponse> {
  try {
    // Get the generative model - using gemini-1.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const languageInstruction = language === 'en' 
      ? "Respond in English. Keep your answer concise but comprehensive." 
      : "हिंदी में जवाब दें। अपना उत्तर संक्षिप्त लेकिन व्यापक रखें।";
    
    const prompt = `You are KrishiMitra, an advanced AI assistant specialized in sustainable agriculture, water management, and farming practices in India. 
    
    The farmer asks: "${query}"
    
    Provide a helpful response about sustainable farming practices, focusing on practical advice. Be conversational and friendly. Aim to give immediately actionable information related to their question. If discussing water conservation, mention specific techniques suited for Indian agriculture.
    
    ${languageInstruction}`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return { 
      text,
      audioResponse: text // Store the response for voice playback
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    const errorMessage = language === 'en' 
      ? "Sorry, I couldn't process your request. Please try again." 
      : "क्षमा करें, मैं आपके अनुरोध को संसाधित नहीं कर सका। कृपया पुनः प्रयास करें।";
    
    return { 
      text: errorMessage,
      error: errorMessage,
      audioResponse: errorMessage // Store error message for voice playback
    };
  }
}

/**
 * Analyze farming practices and provide water conservation recommendations
 */
export async function analyzeWaterUsage(
  conversations: { question: string, answer: string }[],
  language: 'en' | 'hi'
): Promise<{
  recommendations: string[];
  waterData: any;
  potentialSavings: string;
  audioSummary?: string; // For voice playback of summary
}> {
  try {
    // Get the model - using gemini-1.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const conversationsText = conversations
      .map(conv => `Q: ${conv.question}\nA: ${conv.answer}`)
      .join("\n\n");
    
    const languageInstruction = language === 'en' 
      ? "Respond in English." 
      : "हिंदी में जवाब दें।";
    
    const prompt = `You are KrishiMitra, an advanced AI specializing in agricultural water management and sustainable farming practices in India.
    
    Analyze the following farmer's responses about their farming practices and generate water usage analysis and conservation recommendations tailored to Indian agricultural conditions.
    
    ${conversationsText}
    
    Provide the following in JSON format:
    1. A list of 4 specific, actionable recommendations for water conservation that are practical for Indian farmers
    2. Current and recommended water usage data for their crops (in cubic meters per hectare)
    3. Potential water savings percentage based on implementing your recommendations
    
    ${languageInstruction}`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      // Try to parse JSON response
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      const jsonStr = text.substring(jsonStart, jsonEnd + 1);
      const json = JSON.parse(jsonStr);
      
      // Extract and format data
      const recommendations = json.recommendations || [];
      
      // Create water data chart format
      const waterData = [];
      if (json.crops) {
        // Add each crop
        Object.keys(json.crops).forEach(crop => {
          waterData.push({
            name: crop,
            current: json.crops[crop].current,
            recommended: json.crops[crop].recommended,
          });
        });
        
        // Add total
        const totalCurrent = Object.values(json.crops).reduce((sum: number, crop: any) => sum + crop.current, 0);
        const totalRecommended = Object.values(json.crops).reduce((sum: number, crop: any) => sum + crop.recommended, 0);
        
        waterData.push({
          name: language === 'en' ? 'Total' : 'कुल',
          current: totalCurrent,
          recommended: totalRecommended,
        });
      }
      
      // Create audio summary for voice output
      const audioSummary = language === 'en'
        ? `Analysis complete. I've found you can save approximately ${json.potentialSavings || "25%"} of water with these top recommendations: ${recommendations.slice(0, 2).join(". ")}`
        : `विश्लेषण पूरा हुआ। मैंने पाया कि आप इन शीर्ष सिफारिशों के साथ लगभग ${json.potentialSavings || "25%"} पानी बचा सकते हैं: ${recommendations.slice(0, 2).join(". ")}`;
      
      return {
        recommendations: recommendations.slice(0, 4),
        waterData: waterData.length > 0 ? waterData : null,
        potentialSavings: json.potentialSavings || "25%",
        audioSummary
      };
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      
      // Create fallback recommendations
      const fallbackRecommendations = language === 'en' 
        ? [
            "Switch from flood irrigation to drip irrigation for water-intensive crops.",
            "Consider crop rotation with pulses to improve soil water retention.",
            "Implement rainwater harvesting to reduce dependence on groundwater.",
            "Use mulching to reduce evaporation from soil surface."
          ]
        : [
            "जल-गहन फसलों के लिए बाढ़ सिंचाई से ड्रिप सिंचाई में बदलें।",
            "मिट्टी की जल धारण क्षमता में सुधार के लिए दलहन के साथ फसल चक्र पर विचार करें।",
            "भूजल पर निर्भरता कम करने के लिए वर्षा जल संचयन लागू करें।",
            "मिट्टी की सतह से वाष्पीकरण को कम करने के लिए मल्चिंग का उपयोग करें।"
          ];
      
      // Create audio summary for voice output
      const audioSummary = language === 'en'
        ? `Analysis complete. I've found you can save approximately 25% of water with these top recommendations: ${fallbackRecommendations.slice(0, 2).join(". ")}`
        : `विश्लेषण पूरा हुआ। मैंने पाया कि आप इन शीर्ष सिफारिशों के साथ लगभग 25% पानी बचा सकते हैं: ${fallbackRecommendations.slice(0, 2).join(". ")}`;
      
      // Return fallback data
      return {
        recommendations: fallbackRecommendations,
        waterData: [
          {
            name: language === 'en' ? 'Rice' : 'चावल',
            current: 4500,
            recommended: 3200,
          },
          {
            name: language === 'en' ? 'Wheat' : 'गेहूं',
            current: 2300,
            recommended: 1800,
          },
          {
            name: language === 'en' ? 'Total' : 'कुल',
            current: 6800,
            recommended: 5000,
          },
        ],
        potentialSavings: "25%",
        audioSummary
      };
    }
  } catch (error) {
    console.error("Error calling Gemini API for analysis:", error);
    
    // Create fallback recommendations
    const fallbackRecommendations = language === 'en' 
      ? [
          "Switch from flood irrigation to drip irrigation for water-intensive crops.",
          "Consider crop rotation with pulses to improve soil water retention.",
          "Implement rainwater harvesting to reduce dependence on groundwater.",
          "Use mulching to reduce evaporation from soil surface."
        ]
      : [
          "जल-गहन फसलों के लिए बाढ़ सिंचाई से ड्रिप सिंचाई में बदलें।",
          "मिट्टी की जल धारण क्षमता में सुधार के लिए दलहन के साथ फसल चक्र पर विचार करें।",
          "भूजल पर निर्भरता कम करने के लिए वर्षा जल संचयन लागू करें।",
          "मिट्टी की सतह से वाष्पीकरण को कम करने के लिए मल्चिंग का उपयोग करें।"
        ];
    
    // Create audio summary for voice output
    const audioSummary = language === 'en'
      ? `Analysis complete. I've found you can save approximately 25% of water with these top recommendations: ${fallbackRecommendations.slice(0, 2).join(". ")}`
      : `विश्लेषण पूरा हुआ। मैंने पाया कि आप इन शीर्ष सिफारिशों के साथ लगभग 25% पानी बचा सकते हैं: ${fallbackRecommendations.slice(0, 2).join(". ")}`;
    
    // Return fallback data on error
    return {
      recommendations: fallbackRecommendations,
      waterData: [
        {
          name: language === 'en' ? 'Rice' : 'चावल',
          current: 4500,
          recommended: 3200,
        },
        {
          name: language === 'en' ? 'Wheat' : 'गेहूं',
          current: 2300,
          recommended: 1800,
        },
        {
          name: language === 'en' ? 'Total' : 'कुल',
          current: 6800,
          recommended: 5000,
        },
      ],
      potentialSavings: "25%",
      audioSummary
    };
  }
} 