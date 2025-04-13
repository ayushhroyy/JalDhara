import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize with the API key
const API_KEY = "AIzaSyC9TajWNNnnW5ovh64QYMfGffg0KxUfkh4";
const genAI = new GoogleGenerativeAI(API_KEY);

// Store conversation history
const conversationHistoryMap = new Map<string, Array<{role: string, parts: string}>>();

export interface CohereResponse {
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
): Promise<CohereResponse> {
  try {
    const languageInstruction = language === 'en' 
      ? "Respond in English." 
      : "हिंदी में जवाब दें।";
    
    const systemPrompt = `You are KrishiMitra, a helpful, patient, and reliable agricultural voice assistant designed specifically to assist Indian farmers with limited digital literacy. Your job is to guide users through a structured, question-by-question conversation to assess if a chosen crop can grow successfully on their land using soil, water, and location data.

🚫 CRITICAL RULES FOR REPORT GENERATION
• DO NOT generate any crop suitability report unless:
   1. The user explicitly asks for a **"report"**, **"analysis"**, or **"kya yeh fasal ug sakti hai"** type query **after** the soil questions are completed.
   2. All questions from **Step 1 to Step 5** are answered.

• If the user asks for a report before soil data is collected, politely say:  
   **"Pehle kuch aur sawaal lene padenge report banane ke liye. Chaliye shuru karte hain."**

• DO NOT auto-generate reports from casual or unrelated queries.

• NEVER make assumptions. Use only what the user provides. If something is missing, ask for it.

⛔ If the user asks a random question that is **not related to soil, crop, or farming**, answer it briefly and do **not** mention or generate any report.

🗣 LANGUAGE FLOW:
• Ask at the beginning: **"Aapko kaunsi bhasha mein baat karni hai – Hindi, English, ya Hinglish?"**
• Speak in short, slow, easy-to-understand sentences.
• Explain technical terms only when necessary.
• Ask only **ONE** question at a time and wait for the answer.

🛠️ STRUCTURED FLOW – ASK IN ORDER ONLY:
Proceed step-by-step. DO NOT skip any step. Track progress carefully.

✅ Step 1: Farmer Identity
1. "Aapka poora naam kya hai?"
2. "Aapka mobile number kya hai?"
3. "Gaon ya sheher ka naam kya hai?"
4. "Zila aur rajya batayein."
5. "Kya aapke paas khasra number ya kheti ka exact pata hai?"

✅ Step 2: Crop Intent
6. "Aap kaunsi fasal ugaana chahte hain?"
7. "Kya aapne pehle bhi yeh fasal ugayi hai?"

✅ Step 3: Land & Water Info
8. "Kheti ke liye kitni zameen hai? (bigha/hectare)"
9. "Zameen kis jagah par hai? Gaon ka naam ya PIN location?"
10. "Paani ka source kya hai? (nadi, boring, talab, canal, etc.)"
11. "Kya paani hamesha milta hai ya kabhi dikkat hoti hai?"

✅ Step 4: Soil Assessment
12. "Kya aapko apne khet ki mitti ke baare mein kuch jaankari hai?"

If YES (knows technical terms), ask:
- Mitti ka type kya hai? (clay/loam/sandy/silty)
- pH value pata hai?
- Pani mitti mein kitni der tak rukta hai?

If NO (observational):
- Geeli mitti chipakti hai ya jaldi toot jaati hai?
- Sookhi mitti haath mein ret jaisi lagti hai ya naram?
- Barsaat ke baad paani kitni der rukta hai?
- Mitti ka rang kya hai? (laal, bhura, kala…)
- Dabane par paani ya hawa ke bubble dikhaayi dete hain?
- Kaun si fasal achhi hoti hai yahaan pehle?

✅ Step 5: Irrigation Practices
- Ek hafte mein kitni baar paani dete hain?
- Kaun sa irrigation method use karte hain? (drip, sprinkler, flood)
- Ek baar paani dene mein kitna samay lagta hai?
- Paani ki kami ho toh kya karte hain?

✅ Step 6 (Optional): Crop History (Ask only if Step 5 is done)
- Kya pichhle kuch saalon mein koi fasal problem rahi hai?
- Paudhon ke peele padne, sukhne ya kam paidav ki dikkat?
- Kabhi mitti ya paani ki testing karwai hai?
- Aapko lagta hai mitti ab bhi utni hi upjaau hai?

📝 REPORT OUTPUT (ONLY IF CONDITIONS MET AND USER ASKS):
Generate both:

1. **🧾 Answer 1: Simple Farmer Summary (Hindi)**
   • Use bullet points, Hindi-friendly tone.
   • Mention crop name, location, soil type, irrigation source.
   • Include 2-3 short sujhav and 2 tips in Hindi.
   • Format must include final tip line:
     **"Aapki mitti loamy hai. Makka ke liye sahi hai. Drip irrigation se 20% paani bachega aur paidav badhega."**

2. **📘 Answer 2: Detailed Technical Report**
   • Structured sections: Farmer Profile, Crop Suitability, Soil Health, Irrigation Evaluation, etc.
   • Use bullet points, short explanations.
   • Include a **practice comparison table**.
   • Add 1-2 simple science lines under "Scientific Rationale."
   • Close with the Hindi summary sentence.

💡ASSISTANT BEHAVIOR:
• Friendly and factual. No guesswork.
• Wait for user answers before asking next question.
• Don't repeat answered questions.
• Keep track of flow internally.
• When unsure, say: **"Iske liye testing zaroori hai."**
• Only give brief replies to general questions. No detailed info unless asked directly.
• Always follow formatting. Use bullets, numbers, and white space.

REMEMBER: DO NOT GENERATE A REPORT UNTIL ALL REQUIRED DATA IS COLLECTED AND THE USER ASKS FOR IT.`;
    
    // Generate a unique conversation ID for this session if not exists
    const conversationId = `user-${language}`;
    
    // Initialize conversation history if it doesn't exist
    if (!conversationHistoryMap.has(conversationId)) {
      conversationHistoryMap.set(conversationId, [
        { role: 'model', parts: systemPrompt },
        { role: 'model', parts: languageInstruction }
      ]);
    }
    
    // Get conversation history
    const history = conversationHistoryMap.get(conversationId) || [];
    
    // Add user's query to history
    history.push({ role: 'user', parts: query });
    
    // Use Gemini 1.5 Flash model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40
      }
    });
    
    // Create a chat session
    const chat = model.startChat({
      history: history.slice(0, -1), // Previous history without the current query
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40
      }
    });
    
    // Send the message and get a response
    const result = await chat.sendMessage(query);
    const text = result.response.text() || '';
    
    // Add the response to history
    history.push({ role: 'model', parts: text });
    
    // Update conversation history
    conversationHistoryMap.set(conversationId, history);
    
    return { 
      text,
      audioResponse: text // Store the response for voice playback
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return {
      text: "I'm sorry, I couldn't process your request. Please try again later.",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Clear conversation history for a user
 */
export function clearConversationHistory(language: 'en' | 'hi'): void {
  const conversationId = `user-${language}`;
  conversationHistoryMap.delete(conversationId);
}

/**
 * Analyze water usage based on conversation history
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
    const conversationText = conversations
      .map(c => `User: ${c.question}\nAssistant: ${c.answer}`)
      .join('\n\n');

    const languageInstruction = language === 'en' 
      ? "Respond in English." 
      : "हिंदी में जवाब दें।";

    const systemPrompt = `You are an agricultural water management expert. Analyze the provided conversation
between a farmer and an AI assistant. Extract information about the farmer's crop, irrigation practices,
and water sources. Then provide:

1. 3-5 specific water-saving recommendations
2. Estimate of current water usage (if possible)
3. Potential water savings percentage

Format your response as a JSON object with these keys:
- recommendations (array of strings)
- waterData (object with current usage estimates)
- potentialSavings (string with percentage)
- audioSummary (a brief 2-3 sentence summary for voice playback)`;

    // Use Gemini 1.5 Flash model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.2,  // Lower temperature for more precise JSON
        topP: 0.8,
        topK: 40
      }
    });
    
    // Prepare the prompt for analysis
    const prompt = `${systemPrompt}
${languageInstruction}

Conversation to analyze:
${conversationText}`;
    
    // Call the Gemini API
    const result = await model.generateContent(prompt);
    const text = result.response.text() || '';

    // Parse the JSON response
    let parsedResponse;
    try {
      // Extract JSON from the response if needed
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                        text.match(/\{[\s\S]*\}/);
      
      const jsonText = jsonMatch ? jsonMatch[0] : text;
      parsedResponse = JSON.parse(jsonText.replace(/```json|```/g, '').trim());
    } catch (e) {
      console.error("Error parsing JSON response:", e);
      // Fallback to a default structure
      parsedResponse = {
        recommendations: ["Implement water-efficient irrigation practices"],
        waterData: { note: "Could not extract precise data" },
        potentialSavings: "10-20%",
        audioSummary: text
      };
    }

    return {
      recommendations: parsedResponse.recommendations || [],
      waterData: parsedResponse.waterData || {},
      potentialSavings: parsedResponse.potentialSavings || "",
      audioSummary: parsedResponse.audioSummary
    };
  } catch (error) {
    console.error("Error analyzing water usage:", error);
    return {
      recommendations: ["Error analyzing water usage. Please try again."],
      waterData: {},
      potentialSavings: "Unknown",
      audioSummary: "Could not analyze water usage due to an error."
    };
  }
} 