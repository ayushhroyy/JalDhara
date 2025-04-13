import { SupportedLanguage } from '@/App';
import { NewsItem } from './index';

// Common constants to use across all translations
const CURRENT_DATE = new Date().toISOString();
const BASE_IMAGE_URL = 'https://fastly.picsum.photos/id/136/800/500.jpg?hmac=j1PFUP8ynYL82wTQBBbHaaqsQoXlVS5xmLRz0YGttws';

// Base news in English to translate from
const BASE_FARMING_NEWS: NewsItem[] = [
  {
    title: "New Water Conservation Techniques Show Promise for Indian Farmers",
    content: "Recent trials of water conservation techniques have shown a 30% reduction in water usage while maintaining crop yields. The methods include micro-irrigation, mulching, and improved water scheduling.",
    image_url: BASE_IMAGE_URL,
    link: "https://example.com/water-conservation",
    pubDate: CURRENT_DATE,
    source_id: "Agriculture Today",
    description: "Innovative water-saving techniques are helping farmers across India improve efficiency."
  },
  {
    title: "Climate-Resilient Crop Varieties Released by ICAR",
    content: "The Indian Council of Agricultural Research (ICAR) has released five new climate-resilient crop varieties that can withstand drought and higher temperatures. These varieties are specifically developed for regions facing water scarcity.",
    image_url: BASE_IMAGE_URL,
    link: "https://example.com/climate-crops",
    pubDate: CURRENT_DATE,
    source_id: "Rural News Network",
    description: "New crop varieties help farmers adapt to changing climate conditions."
  },
  {
    title: "Digital Farming Tools Reaching More Rural Communities",
    content: "Mobile applications and SMS-based advisory services are now reaching over 10 million farmers across India, providing weather forecasts, market prices, and farming tips in local languages.",
    image_url: BASE_IMAGE_URL,
    link: "https://example.com/digital-farming",
    pubDate: CURRENT_DATE,
    source_id: "Agri-Tech Monthly",
    description: "Technology adoption in rural areas is accelerating with multilingual support."
  }
];

const BASE_GOVERNMENT_SCHEMES: NewsItem[] = [
  {
    title: "PM-Kisan Scheme Expands to Include More Farmers",
    content: "The government has expanded the PM-Kisan scheme to include more marginal farmers. The scheme now provides ₹6,000 per year to eligible farming households in three equal installments.",
    image_url: BASE_IMAGE_URL,
    link: "https://example.com/pm-kisan-update",
    pubDate: CURRENT_DATE,
    source_id: "Government Bulletin",
    description: "Financial support reaching more farming families through expanded eligibility criteria."
  },
  {
    title: "New Subsidy for Solar-Powered Irrigation Systems",
    content: "A new government subsidy covers up to 80% of the cost of installing solar-powered irrigation systems. The program aims to reduce dependency on diesel pumps and decrease farming costs.",
    image_url: BASE_IMAGE_URL,
    link: "https://example.com/solar-subsidy",
    pubDate: CURRENT_DATE,
    source_id: "Energy & Agriculture",
    description: "Green energy initiative makes solar irrigation more affordable for farmers."
  },
  {
    title: "Crop Insurance Scheme Simplified with Faster Claims Processing",
    content: "The Pradhan Mantri Fasal Bima Yojana has been revamped with simplified documentation and faster claim settlements. Farmers can now receive compensation within two weeks of claim approval.",
    image_url: BASE_IMAGE_URL,
    link: "https://example.com/crop-insurance-update",
    pubDate: CURRENT_DATE,
    source_id: "Rural Finance Today",
    description: "Improved crop insurance processes reduce waiting time for compensation payments."
  }
];

// Hindi translations
const HINDI_FARMING_NEWS: NewsItem[] = [
  {
    title: "भारतीय किसानों के लिए नई जल संरक्षण तकनीकें आशाजनक दिखती हैं",
    content: "जल संरक्षण तकनीकों के हाल के परीक्षणों से फसल उपज को बनाए रखते हुए पानी के उपयोग में 30% की कमी दिखाई है। इन विधियों में सूक्ष्म-सिंचाई, मल्चिंग और बेहतर जल अनुसूची शामिल हैं।",
    image_url: BASE_IMAGE_URL,
    link: "https://example.com/water-conservation",
    pubDate: CURRENT_DATE,
    source_id: "कृषि आज",
    description: "नवीन जल-बचत तकनीकें भारत भर के किसानों को दक्षता में सुधार करने में मदद कर रही हैं।"
  },
  {
    title: "ICAR द्वारा जारी जलवायु-लचीला फसल किस्में",
    content: "भारतीय कृषि अनुसंधान परिषद (ICAR) ने पांच नई जलवायु-लचीला फसल किस्में जारी की हैं जो सूखे और उच्च तापमान का सामना कर सकती हैं। ये किस्में विशेष रूप से पानी की कमी वाले क्षेत्रों के लिए विकसित की गई हैं।",
    image_url: BASE_IMAGE_URL,
    link: "https://example.com/climate-crops",
    pubDate: CURRENT_DATE,
    source_id: "ग्रामीण समाचार नेटवर्क",
    description: "नई फसल किस्में किसानों को बदलती जलवायु परिस्थितियों के अनुकूल बनाने में मदद करती हैं।"
  },
  {
    title: "डिजिटल खेती के उपकरण अधिक ग्रामीण समुदायों तक पहुंच रहे हैं",
    content: "मोबाइल एप्लिकेशन और एसएमएस-आधारित सलाहकार सेवाएं अब भारत भर में 10 मिलियन से अधिक किसानों तक पहुंच रही हैं, जो स्थानीय भाषाओं में मौसम का पूर्वानुमान, बाजार मूल्य और खेती के टिप्स प्रदान कर रही हैं।",
    image_url: BASE_IMAGE_URL,
    link: "https://example.com/digital-farming",
    pubDate: CURRENT_DATE,
    source_id: "कृषि-तकनीक मासिक",
    description: "बहुभाषी समर्थन के साथ ग्रामीण क्षेत्रों में प्रौद्योगिकी अपनाना तेज हो रहा है।"
  }
];

const HINDI_GOVERNMENT_SCHEMES: NewsItem[] = [
  {
    title: "पीएम-किसान योजना का विस्तार अधिक किसानों को शामिल करने के लिए",
    content: "सरकार ने पीएम-किसान योजना का विस्तार अधिक सीमांत किसानों को शामिल करने के लिए किया है। यह योजना अब पात्र कृषि परिवारों को तीन समान किस्तों में प्रति वर्ष ₹6,000 प्रदान करती है।",
    image_url: BASE_IMAGE_URL,
    link: "https://example.com/pm-kisan-update",
    pubDate: CURRENT_DATE,
    source_id: "सरकारी बुलेटिन",
    description: "विस्तारित पात्रता मानदंडों के माध्यम से अधिक कृषि परिवारों तक वित्तीय सहायता पहुंच रही है।"
  },
  {
    title: "सौर ऊर्जा संचालित सिंचाई प्रणालियों के लिए नई सब्सिडी",
    content: "एक नई सरकारी सब्सिडी सौर ऊर्जा संचालित सिंचाई प्रणालियों को स्थापित करने की लागत का 80% तक कवर करती है। कार्यक्रम का उद्देश्य डीजल पंपों पर निर्भरता कम करना और खेती की लागत कम करना है।",
    image_url: BASE_IMAGE_URL,
    link: "https://example.com/solar-subsidy",
    pubDate: CURRENT_DATE,
    source_id: "ऊर्जा और कृषि",
    description: "हरित ऊर्जा पहल किसानों के लिए सौर सिंचाई को अधिक किफायती बनाती है।"
  },
  {
    title: "फसल बीमा योजना को तेज दावा प्रसंस्करण के साथ सरल बनाया गया",
    content: "प्रधान मंत्री फसल बीमा योजना को सरलीकृत दस्तावेजीकरण और तेज दावा निपटान के साथ नया रूप दिया गया है। किसान अब दावा अनुमोदन के दो सप्ताह के भीतर मुआवजा प्राप्त कर सकते हैं।",
    image_url: BASE_IMAGE_URL,
    link: "https://example.com/crop-insurance-update",
    pubDate: CURRENT_DATE,
    source_id: "ग्रामीण वित्त आज",
    description: "बेहतर फसल बीमा प्रक्रियाएं मुआवजा भुगतान के लिए प्रतीक्षा समय कम करती हैं।"
  }
];

// Bengali translations
const BENGALI_FARMING_NEWS: NewsItem[] = [
  {
    title: "ভারতীয় কৃষকদের জন্য নতুন জল সংরক্ষণ কৌশল আশাব্যঞ্জক দেখাচ্ছে",
    content: "জল সংরক্ষণ কৌশলের সাম্প্রতিক পরীক্ষায় ফসলের ফলন বজায় রেখে পানির ব্যবহার 30% কমেছে। এই পদ্ধতিগুলির মধ্যে রয়েছে মাইক্রো-সেচ, মালচিং এবং উন্নত জল সময়সূচী।",
    image_url: BASE_IMAGE_URL,
    link: "https://example.com/water-conservation",
    pubDate: CURRENT_DATE,
    source_id: "কৃষি আজ",
    description: "উদ্ভাবনী জল-সাশ্রয়ী কৌশলগুলি সারা ভারতের কৃষকদের দক্ষতা উন্নত করতে সাহায্য করছে।"
  },
  {
    title: "ICAR দ্বারা প্রকাশিত জলবায়ু-সহনশীল ফসল জাত",
    content: "ভারতীয় কৃষি গবেষণা পরিষদ (ICAR) পাঁচটি নতুন জলবায়ু-সহনশীল ফসল প্রজাতি প্রকাশ করেছে যা খরা এবং উচ্চতর তাপমাত্রা সহ্য করতে পারে। এই প্রজাতিগুলি বিশেষভাবে জলসংকট সম্মুখীন অঞ্চলগুলির জন্য তৈরি করা হয়েছে।",
    image_url: BASE_IMAGE_URL,
    link: "https://example.com/climate-crops",
    pubDate: CURRENT_DATE,
    source_id: "গ্রামীণ সংবাদ নেটওয়ার্ক",
    description: "নতুন ফসলের প্রজাতি কৃষকদের পরিবর্তিত জলবায়ু অবস্থার সাথে খাপ খাইয়ে নিতে সাহায্য করে।"
  },
  {
    title: "ডিজিটাল কৃষি টুল আরও গ্রামীণ সম্প্রদায়ে পৌঁছাচ্ছে",
    content: "মোবাইল অ্যাপ্লিকেশন এবং এসএমএস-ভিত্তিক পরামর্শ পরিষেবা এখন ভারত জুড়ে 10 মিলিয়নেরও বেশি কৃষকের কাছে পৌঁছাচ্ছে, স্থানীয় ভাষায় আবহাওয়ার পূর্বাভাস, বাজার মূল্য এবং কৃষি টিপস প্রদান করছে।",
    image_url: BASE_IMAGE_URL,
    link: "https://example.com/digital-farming",
    pubDate: CURRENT_DATE,
    source_id: "কৃষি-প্রযুক্তি মাসিক",
    description: "বহুভাষিক সমর্থন সহ গ্রামীণ এলাকায় প্রযুক্তি গ্রহণ ত্বরান্বিত হচ্ছে।"
  }
];

const BENGALI_GOVERNMENT_SCHEMES: NewsItem[] = [
  {
    title: "PM-কিষাণ প্রকল্প আরও কৃষকদের অন্তর্ভুক্ত করার জন্য সম্প্রসারিত",
    content: "সরকার আরও প্রান্তিক কৃষকদের অন্তর্ভুক্ত করতে PM-কিষাণ প্রকল্প সম্প্রসারিত করেছে। এই প্রকল্প এখন যোগ্য কৃষক পরিবারগুলিকে তিনটি সমান কিস্তিতে বছরে ₹6,000 প্রদান করে।",
    image_url: BASE_IMAGE_URL,
    link: "https://example.com/pm-kisan-update",
    pubDate: CURRENT_DATE,
    source_id: "সরকারি বুলেটিন",
    description: "সম্প্রসারিত যোগ্যতা মানদণ্ডের মাধ্যমে আরও কৃষক পরিবারে আর্থিক সহায়তা পৌঁছাচ্ছে।"
  },
  {
    title: "সৌর-চালিত সেচ ব্যবস্থার জন্য নতুন ভর্তুকি",
    content: "একটি নতুন সরকারী ভর্তুকি সৌর-চালিত সেচ ব্যবস্থা স্থাপনের খরচের 80% পর্যন্ত কভার করে। প্রোগ্রামটির লক্ষ্য ডিজেল পাম্পের উপর নির্ভরতা কমানো এবং কৃষির খরচ কমানো।",
    image_url: BASE_IMAGE_URL,
    link: "https://example.com/solar-subsidy",
    pubDate: CURRENT_DATE,
    source_id: "শক্তি ও কৃষি",
    description: "সবুজ শক্তি উদ্যোগ কৃষকদের জন্য সৌর সেচ আরও সাশ্রয়ী করে তোলে।"
  },
  {
    title: "ফসল বীমা প্রকল্প দ্রুত দাবি প্রক্রিয়াকরণের সাথে সহজ করা হয়েছে",
    content: "প্রধান মন্ত্রী ফসল বীমা যোজনা সরলীকৃত নথিপত্র এবং দ্রুত দাবি নিষ্পত্তির সাথে পুনর্গঠিত করা হয়েছে। কৃষকরা এখন দাবি অনুমোদনের দুই সপ্তাহের মধ্যে ক্ষতিপূরণ পেতে পারেন।",
    image_url: BASE_IMAGE_URL,
    link: "https://example.com/crop-insurance-update",
    pubDate: CURRENT_DATE,
    source_id: "গ্রামীণ অর্থনীতি আজ",
    description: "উন্নত ফসল বীমা প্রক্রিয়া ক্ষতিপূরণ পেমেন্টের জন্য অপেক্ষার সময় কমায়।"
  }
];

// Create basic mock data structure for all languages
export const mockFarmingNews: Record<SupportedLanguage, NewsItem[]> = {
  en: BASE_FARMING_NEWS,
  hi: HINDI_FARMING_NEWS,
  bn: BENGALI_FARMING_NEWS,
  // For other languages, copy English for now but in a real implementation, 
  // these would be properly translated for each language
  mr: BASE_FARMING_NEWS,
  te: BASE_FARMING_NEWS,
  ta: BASE_FARMING_NEWS,
  gu: BASE_FARMING_NEWS,
  ur: BASE_FARMING_NEWS,
  kn: BASE_FARMING_NEWS,
  ml: BASE_FARMING_NEWS,
  pa: BASE_FARMING_NEWS,
};

export const mockGovernmentSchemes: Record<SupportedLanguage, NewsItem[]> = {
  en: BASE_GOVERNMENT_SCHEMES,
  hi: HINDI_GOVERNMENT_SCHEMES,
  bn: BENGALI_GOVERNMENT_SCHEMES,
  // For other languages, copy English for now but in a real implementation,
  // these would be properly translated for each language
  mr: BASE_GOVERNMENT_SCHEMES,
  te: BASE_GOVERNMENT_SCHEMES,
  ta: BASE_GOVERNMENT_SCHEMES,
  gu: BASE_GOVERNMENT_SCHEMES,
  ur: BASE_GOVERNMENT_SCHEMES,
  kn: BASE_GOVERNMENT_SCHEMES,
  ml: BASE_GOVERNMENT_SCHEMES,
  pa: BASE_GOVERNMENT_SCHEMES,
}; 