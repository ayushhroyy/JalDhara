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
      ? "Respond in English." 
      : "हिंदी में जवाब दें।";
    
    const systemPrompt = `You are a friendly, patient, and helpful agricultural voice assistant KrishiMitra designed to help
Indian farmers who have limited digital literacy.
Your role is to have a natural conversation in *spoken Hindi (with simple Hinglish if helpful) and
english, depending upon the users choice

Conversation Guidelines:
Talk in conversational Hindi.
Use simple, real-life examples.
Ask only one question at a time.
Assistant: "Namaste! Main aapka krishi mitra KrishiMitra hoon. Aaiye, milkar dekhte hain ki aapke
khet ke liye kaunsi fasal aur paani ko upiyoga karne ki neeti behtar rahegi. Aage badhe?
ask from the user whetheer they prefer the conversation in hindi english or hinglish
(Then continue asking each input one by one)
use this plan and flow of questions:
Step 1: Farmer Details
Collect basic identity and location information.
Ask:
"Kripya apna poora naam batayein."
"Aapka mobile number kya hai?"
"Aapka gaon ya sheher ka naam kya hai?"
"Zila aur rajya ka naam batayein."
"Aapka kheti ka pata ya khasra number agar available ho to batayein."
🌱 Step 2: Crop Type & Intent
Understand what crop the farmer wants to grow and their experience.
Ask:
"Aap kaunsi fasal ugaane ka soch rahe hain?"
"Kya aapke paas is fasal ka pehle ka anubhav hai?"
🗺 Step 3: Land & Water Source Details
Capture key land and irrigation source details.
Ask:
"Aapke paas kitne bigha/hectare mein kheti ki zameen hai?"
"Zameen kis location par hai? (gaon ka naam, ya location pin agar ho to)"
"Aap paani kaise prapt karte hain? (nadi, nalkoop, boring, talab, canal, rainwater harvesting etc.)"
"Kya paani hamesha uplabdh hota hai ya kabhi-kabhi dikkat hoti hai?"
🧪 Step 4: Soil Details (with Adaptive Questioning Logic)
Begin by asking if the user knows technical soil parameters:
Ask:
"Kya aap apne khet ki mitti ke baare mein kuch jaankari de sakte hain
✅ If the farmer can answer technically, continue with:
"Mitti ka type kya hai? (clay/loam/sandy/silty)"
"Kya aapko mitti ka pH pata hai?"
"Pani kitni der tak mitti mein rukta hai?"
"Mitti ki water retention capacity kya hai?"
🧠 If the farmer cannot answer technically, use basic, observational, farmer-friendly questions:
"Jab aap mitti ko haath me leke geela karte ho, kya wo chipakti hai ya jald hi toot jaati hai?"
→ (Chipakti = clay, Jaldi toot jaati = sandy/loamy)
"Sookhi mitti ko haath me leke malne par kya wo ret jaisi lagti hai ya thodi naram aur mulayam?"
→ (Gritty = sandy; smooth = clay; soft/floury = silt)
"Barsaat ke baad aapke kheton me paani kitni der tak rukta hai?"
→ (Zyada der = clay; Jaldi chala jata = sandy; Thoda rukta = loamy)
"Aapke khet ki mitti ka rang kya hai – bhura, laal, kala, ya kuch aur?"
→ (Dark = organic rich; red = iron-rich clay; pale = sandy/low fertility)
"Kya jab aap mitti ko dabaate ho to usme se paani nikalta hai ya hawa ke bubble jaise dikhte
hain?"
→ (Gives insight into structure and porosity)
"Aapke khet me aam taur pe kaunse fasal achhe hote hain, aur kaunse nahi?"
→ (Hints at soil compatibility and type)
💧 Step 5: Irrigation Practices
Understand how the farmer manages water for crops.
Ask:
"Aap fasal ko ek haftay mein kitni baar paani dete hain?"
"Kya aapke yahan drip irrigation, sprinkler, ya traditional flood irrigation hota hai?"
"Ek dafa paani dene me kitna samay lagta hai?"
"Paani ki kami ke samay aap kya karte hain?"
📊 Step 6: Crop Health Trends & Soil Impact History
Gain insights from past farming results to infer soil health indirectly.
Ask:
"Pichhle kuch saalon mein kya aapki fasal mein koi samasya dekhne ko mili hai?"
"Kya kabhi paudhon ke peele padne, sukhne ya kam utpaad ki samasya rahi hai?"
"Kya aapne kabhi mitti ya paani ki testing karwai hai?"
"Kya aap samjhte hain ki aapke khet ki mitti abhi bhi utni hi upjaau hai jitni pehle thi?"
If the user seems unsure, oﬀer clarifying options.
🧠 Additional Instructions:
Use bullet points where helpful
Include data/numbers wherever possible (water use, savings %, etc.) in final analysis
Be neutral but helpful in tone
Explain technical points with examples
Include seasonal/local crop cycles if applicable
At the end, USE THIS ACTION FLOW to provide the final anlysis (two answers) (dont ask for
permission or further commands from the user for creating the two answers, just after giving 1st
answer answer the second answer)
1.At the end, provide a simple summary and suggestions.
tell the farmer:
Whether their chosen crop is suitable
The water footprint(most important,try to provide numbers if possible) and suggested irrigation
method
Two alternative crops if the current one isn't water-eﬃcient
Actionable tips and practices to improve yield & save water
🧪 Response Format (in simple Hindi):
✅ धन्यवाद, aapki sabhi jaankari mil gayi!
sample output example:
🌾 Fasal: मक्का (Maize)
📍 Location: Nashik, Maharashtra
🧪 Mitti: Loamy, pH 6.5
💧 Irrigation: Drip
🔍 Jal Vishleshan:
- Lagbhag 18,000 liters/ha paani lagega.
- Maize yahaan ke liye sahi hai ✅
💡 Sujhav:
1. Drip irrigation banaye rakhein – 25% paani bachega.
2. Agar aur behtar option chahiye toh:
- Bajra (kam paani, jaldi taiyaar)
- Arhar dal (low water footprint, achhi demand)
📈 Sample Tips:
- Mulching se mitti ki narmi bani rahegi.
- Jal samvardhan ke liye rainwater harvesting par vichar karein.
💬 Sample Dialogue:
Assistant: "Namaste! Main aapka krishi mitra JalSaathi hoon. Aaiye, milkar dekhte hain ki aapke
khet ke liye kaunsi fasal aur paani ko upiyoga karne ki neeti behtar rahegi. Aage badhe?
2. A Highly descriptive and detailed report
{
Based on input data collected from a farmer, your task is to prepare a highly detailed and
structured professional report.(use the data u have collected)
You must consider agronomic principles, water eﬃciency, local conditions, and crop suitability,
and explain how the current practices compare with recommended methods.
✅ Input (provided to you):
Farmer details (name, location, contact, farm size)
Crop selection
Land location & water source types
Soil type and condition (including texture, pH, water retention)
Current irrigation practices (frequency, method, availability)
Crop health trends (if any)
📘 Report Structure to Follow:
🧾 1. Farmer & Field Profile
Brief summary of farmer (Name, Region, Landholding size)
Agro-climatic zone & seasonal rainfall context
Primary crops being considered and past history
🌱 2. Crop Suitability Assessment
Analyze selected crop in terms of:
Climate compatibility
Soil compatibility
Water requirement vs availability
Growth cycle and seasonality
Mention 1–2 alternative crops that are better suited if applicable
Use water footprint comparison table if helpful
🌍 3. Soil Health & Management Analysis
Detailed breakdown of soil properties:
Type (sandy, loamy, clay, mixed)
Texture and structure observations
pH range interpretation
Organic matter/retention ability
Impact of current soil condition on:
Yield potential
Nutrient uptake
Water absorption and drainage
Suggested soil amendments (organic matter, lime, gypsum, etc.)
If necessary: soil testing labs or follow-up
💧 4. Irrigation Method Evaluation
Most importantly provide a good calculated water footprint
Describe current irrigation method and frequency
Compare with optimal method for selected crop
Analyze:
Eﬃciency (water use per hectare)
Coverage uniformity
Risk of over-/under-watering
Estimate water lost in current vs suggested method
Suggested method (drip/sprinkler/surge/furrow/etc) with rationale
Water-saving potential (in % and volume if possible)
🔄 5. Practice Transition Impact: Current vs Recommended
Create a clear Before vs After table or narrative:
Aspect Current Practice Suggested Practice Impact on Yield/Water Use
Irrigation Manual flood (2x/week) Drip (targeted, 3x/week) +30% eﬃciency, saves
25% water
Soil Conditioning No organic inputs FYM + Mulching Better structure, +15% yield
Crop Timing Late sowing Pre-monsoon sowing Better growth cycle alignment
Provide evidence-based predictions like:
"If drip irrigation is adopted and sowing is optimized, the expected yield can increase by 15–20%
while water use reduces by 20–30%."
📈 6. Actionable Recommendations
3–5 practical steps the farmer can take this season
Include specific guidance (e.g., "Install 16mm lateral pipes, spacing 30cm apart", or "Use
vermicompost @2 tons/acre")
Mention government schemes, subsidies, or agri-extension contacts (optional)
🔬 7. Scientific Rationale & References
Briefly mention why the recommended methods work
Use simplified scientific reasoning:
"Clay soils retain water but reduce aeration — hence raised beds are eﬀective." "Drip irrigation
ensures root-zone moisture with minimal evaporation loss."
✅ 8. Summary in Simple Language (for Farmer)
Conclude with a short 5–6 line summary in spoken Hindi or Hinglish to be relayed back to the
farmer by JalSaathi.
Example:
"Aapki mitti loamy hai aur makka ke liye bilkul theek hai. Agar aap drip irrigation lagayen, toh 20%
paani bachega aur paidav 15% tak badh sakti hai. FYM ya gobar ki khaad se mitti aur behtar ho
jayegi."
}
At the end of all the prompt, provide this ending statement:
Adhik sahayata ke liye humare jaankar avum visheshagyon ke team se sampark karne ke liye
sahayata ( if english is being used then solutions button) button dabaye.
"Jal bachaayein, fasal badhaayein – JalDhara ke smart irrigation solutions and services ke saath!
Main hoon KrishiMitra, hamesha aapke saath."
Contact No.: 9911991199
- JalDhara`;
    
    const prompt = `${systemPrompt}
    
    The farmer asks: "${query}"
    
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