import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Edit, Save, Binary, Sparkles } from "lucide-react";
import { MarkdownPreview } from "./markdown-preview";

interface ResultComparisonProps {
  geminiResult: string;
  openaiResult: string;
  onSelectModel: (model: "gemini" | "openai") => void;
  isLoading?: boolean;
  selectedModel?: string;
}

export function ResultComparison({
  geminiResult,
  openaiResult,
  onSelectModel,
  isLoading = false,
  selectedModel
}: ResultComparisonProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("gemini");
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  
  const handleSelectModel = () => {
    onSelectModel(activeTab as "gemini" | "openai");
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-medium mb-4">{t("results.processing")}</h3>
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="h-1 w-full bg-muted relative overflow-hidden rounded-full">
              <div className="absolute h-full bg-primary animate-pulse left-0 right-0"></div>
            </div>
            <div className="flex items-center">
              <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
              <p className="text-muted-foreground">{t("results.processingWithAI")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-xl font-medium mb-4">{t("results.comparison")}</h3>
        
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-2">{t("results.chooseBest")}</p>
          <Tabs defaultValue="gemini" value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="gemini" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>{t("results.geminiResult")}</span>
              </TabsTrigger>
              <TabsTrigger value="openai" className="flex items-center gap-2">
                <Binary className="h-4 w-4" />
                <span>{t("results.openaiResult")}</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="gemini" className="mt-4">
              <div className="bg-background rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
                <MarkdownPreview content={geminiResult || t("results.noData")} />
              </div>
            </TabsContent>
            <TabsContent value="openai" className="mt-4">
              <div className="bg-background rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
                <MarkdownPreview content={openaiResult || t("results.noData")} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            {t("results.edit")}
          </Button>
          <Button 
            onClick={handleSelectModel}
            variant={selectedModel === activeTab ? "secondary" : "default"}
            disabled={selectedModel === activeTab}
          >
            <Save className="h-4 w-4 mr-2" />
            {selectedModel === activeTab 
              ? t("results.modelSelected", { model: activeTab }) 
              : t("results.useThisModel")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
