import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { AlertCircle, Download, Eye, Share2, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SoilReport {
  id: string;
  date: string;
  location: string;
  type: "basic" | "detailed";
  data: Record<string, any>;
  soilHealth?: string;
}

interface SavedReportsProps {
  language: string;
}

const SavedReports: React.FC<SavedReportsProps> = ({ language }) => {
  const { t } = useTranslation(language);
  const navigate = useNavigate();
  const [reports, setReports] = useState<SoilReport[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedReports = localStorage.getItem("soilReports");
      if (savedReports) {
        const parsedReports = JSON.parse(savedReports) as SoilReport[];
        setReports(parsedReports);
      }
    } catch (err) {
      console.error("Failed to load saved reports:", err);
      setError(t("Failed to load saved reports"));
    }
  }, [t]);

  const filteredReports = reports.filter((report) => {
    if (activeTab === "all") return true;
    if (activeTab === "basic") return report.type === "basic";
    if (activeTab === "detailed") return report.type === "detailed";
    return true;
  });

  const handleViewReport = (reportId: string) => {
    navigate(`/report/${reportId}`);
  };

  const handleDeleteReport = (reportId: string) => {
    try {
      const updatedReports = reports.filter((report) => report.id !== reportId);
      setReports(updatedReports);
      localStorage.setItem("soilReports", JSON.stringify(updatedReports));
      toast.success(t("Report Deleted"), {
        description: t("The report has been deleted successfully"),
      });
    } catch (err) {
      console.error("Failed to delete report:", err);
      toast.error(t("Error"), {
        description: t("Failed to delete report"),
      });
    }
  };

  const handleDownloadReport = (report: SoilReport) => {
    try {
      const reportData = JSON.stringify(report, null, 2);
      const blob = new Blob([reportData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `soil-report-${report.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(t("Report Downloaded"), {
        description: t("The report has been downloaded successfully"),
      });
    } catch (err) {
      console.error("Failed to download report:", err);
      toast.error(t("Error"), {
        description: t("Failed to download report"),
      });
    }
  };

  const handleShareReport = (report: SoilReport) => {
    if (navigator.share) {
      navigator
        .share({
          title: t("Soil Report"),
          text: `${t("Check out this soil report for")} ${report.location}`,
          url: `${window.location.origin}/report/${report.id}`,
        })
        .catch((error) => console.error("Error sharing:", error));
    } else {
      toast.error(t("Sharing not supported"), {
        description: t("Your browser doesn't support the Web Share API"),
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">{t("Saved Soil Reports")}</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("Error")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="all" className="mb-8" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="all">{t("All Reports")}</TabsTrigger>
          <TabsTrigger value="basic">{t("Basic Reports")}</TabsTrigger>
          <TabsTrigger value="detailed">{t("Detailed Reports")}</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          {renderReportGrid(filteredReports)}
        </TabsContent>
        <TabsContent value="basic" className="mt-0">
          {renderReportGrid(filteredReports)}
        </TabsContent>
        <TabsContent value="detailed" className="mt-0">
          {renderReportGrid(filteredReports)}
        </TabsContent>
      </Tabs>
    </div>
  );

  function renderReportGrid(reports: SoilReport[]) {
    if (reports.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">{t("No saved reports found")}</p>
          <Button onClick={() => navigate("/soil-test")}>
            {t("Create a new report")}
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Card key={report.id} className="overflow-hidden">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">{report.location}</h3>
              <p className="text-sm text-gray-500 mb-4">{report.date}</p>
              <div className="flex items-center mb-2">
                <span className="text-xs font-medium mr-2">{t("Report Type")}:</span>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {report.type === "basic" ? t("Basic") : t("Detailed")}
                </span>
              </div>
              {report.soilHealth && (
                <div className="mt-4 p-2 rounded bg-green-50 text-green-700 text-sm">
                  {report.soilHealth}
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-muted/50 px-6 py-3 flex justify-between">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleViewReport(report.id)}
              >
                <Eye className="h-4 w-4 mr-1" />
                {t("View")}
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleDownloadReport(report)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleShareReport(report)}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteReport(report.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
};

export default SavedReports; 