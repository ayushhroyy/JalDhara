import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer, Share2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import WaterUsageChart from '@/components/WaterUsageChart';
import AiAdviceWidget from '@/components/AiAdviceWidget';

interface ReportsProps {
  language: 'en' | 'hi';
}

const Reports: React.FC<ReportsProps> = ({ language }) => {
  const content = {
    en: {
      title: "Water Usage Reports",
      noReports: "No reports available yet. Complete a water assessment to generate your first report.",
      sampleReport: {
        title: "Farm Water Assessment",
        date: "April 12, 2025",
        summary: "Based on your input, we've analyzed your current water usage and identified potential water-saving opportunities.",
        farmDetails: "Farm Details",
        detailsContent: [
          { label: "Crops", value: "Rice, Wheat" },
          { label: "Soil Type", value: "Black, fertile" },
          { label: "Water Source", value: "Groundwater" },
          { label: "Rainfall", value: "Moderate during monsoon" }
        ],
        recommendations: "Recommendations",
        download: "Download PDF",
        print: "Print Report",
        share: "Share Report"
      }
    },
    hi: {
      title: "जल उपयोग रिपोर्ट्स",
      noReports: "अभी तक कोई रिपोर्ट उपलब्ध नहीं है। अपनी पहली रिपोर्ट जनरेट करने के लिए जल मूल्यांकन पूरा करें।",
      sampleReport: {
        title: "खेत जल मूल्यांकन",
        date: "12 अप्रैल, 2025",
        summary: "आपके इनपुट के आधार पर, हमने आपके वर्तमान जल उपयोग का विश्लेषण किया है और संभावित जल-बचत के अवसरों की पहचान की है।",
        farmDetails: "खेत विवरण",
        detailsContent: [
          { label: "फसलें", value: "चावल, गेहूं" },
          { label: "मिट्टी का प्रकार", value: "काली, उपजाऊ" },
          { label: "जल स्रोत", value: "भूजल" },
          { label: "वर्षा", value: "मानसून के दौरान मध्यम" }
        ],
        recommendations: "सिफारिशें",
        download: "PDF डाउनलोड करें",
        print: "रिपोर्ट प्रिंट करें",
        share: "रिपोर्ट शेयर करें"
      }
    }
  };

  const sampleWaterData = [
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
  ];

  const recommendations = language === 'en' 
    ? [
        "Switch from flood irrigation to drip irrigation for rice crops.",
        "Consider crop rotation with pulses to improve soil water retention.",
        "Implement rainwater harvesting to reduce dependence on groundwater.",
        "Use mulching to reduce evaporation from soil surface."
      ]
    : [
        "चावल की फसलों के लिए बाढ़ सिंचाई से ड्रिप सिंचाई में बदलें।",
        "मिट्टी की जल धारण क्षमता में सुधार के लिए दलहन के साथ फसल चक्र पर विचार करें।",
        "भूजल पर निर्भरता कम करने के लिए वर्षा जल संचयन लागू करें।",
        "मिट्टी की सतह से वाष्पीकरण को कम करने के लिए मल्चिंग का उपयोग करें।"
      ];

  const handleAction = (action: string) => {
    const messages = {
      en: {
        download: "Report downloaded successfully!",
        print: "Sending report to printer...",
        share: "Report sharing options opened"
      },
      hi: {
        download: "रिपोर्ट सफलतापूर्वक डाउनलोड की गई!",
        print: "रिपोर्ट प्रिंटर को भेज रहे हैं...",
        share: "रिपोर्ट साझाकरण विकल्प खोले गए"
      }
    };
    
    toast.success(messages[language][action as keyof typeof messages.en]);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">{content[language].title}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{content[language].sampleReport.title}</span>
                <span className="text-sm font-normal text-muted-foreground">{content[language].sampleReport.date}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p>{content[language].sampleReport.summary}</p>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">{content[language].sampleReport.farmDetails}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {content[language].sampleReport.detailsContent.map((item, index) => (
                    <div key={index} className="border rounded p-3">
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                      <p className="font-medium">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <WaterUsageChart data={sampleWaterData} language={language} />
              
              <div>
                <h3 className="text-lg font-semibold mb-2">{content[language].sampleReport.recommendations}</h3>
                <div className="space-y-2">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start">
                      <div className="bg-earth text-white rounded-full h-6 w-6 flex items-center justify-center text-sm mr-2 flex-shrink-0">
                        {index + 1}
                      </div>
                      <p>{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-water/10 p-4 rounded-lg mt-6">
                <p className="font-semibold text-water-dark">
                  {language === 'en' ? 'Potential Water Savings: 35%' : 'संभावित जल बचत: 35%'}
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-3 border-t pt-6">
              <Button 
                variant="outline" 
                className="gap-2" 
                onClick={() => handleAction('download')}
              >
                <Download className="h-4 w-4" />
                {content[language].sampleReport.download}
              </Button>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => handleAction('print')}
              >
                <Printer className="h-4 w-4" />
                {content[language].sampleReport.print}
              </Button>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => handleAction('share')}
              >
                <Share2 className="h-4 w-4" />
                {content[language].sampleReport.share}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div>
          <AiAdviceWidget language={language} />
        </div>
      </div>
    </div>
  );
};

export default Reports;
