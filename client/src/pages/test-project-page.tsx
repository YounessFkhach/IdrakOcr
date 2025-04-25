import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Project, OcrResult } from "@shared/schema";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ocr/image-upload";
import { ResultComparison } from "@/components/ocr/result-comparison";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft,
  Loader2,
  Save,
  AlertTriangle,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function TestProjectPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [processingResult, setProcessingResult] = useState<OcrResult | null>(null);
  const [isCustomPromptUpdated, setIsCustomPromptUpdated] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  // Fetch project
  const { 
    data: project, 
    isLoading: isLoadingProject, 
    error: projectError 
  } = useQuery<Project>({
    queryKey: [`/api/projects/${id}`],
    onSuccess: (data) => {
      setCustomPrompt(data.customPrompt || "");
    }
  });

  // Handle image upload
  const handleImageUpload = (file: File) => {
    setSelectedImage(file);
    // Reset processing result when a new image is uploaded
    setProcessingResult(null);
  };

  // Handle custom prompt change
  const handleCustomPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomPrompt(e.target.value);
    setIsCustomPromptUpdated(e.target.value !== project?.customPrompt);
  };

  // Handle update custom prompt
  const updatePromptMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", `/api/projects/${id}`, {
        customPrompt,
      });
      return await res.json();
    },
    onSuccess: (data: Project) => {
      toast({
        title: t("projects.promptUpdateSuccess"),
        description: t("projects.promptUpdated"),
      });
      
      // Invalidate project query
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
      setIsCustomPromptUpdated(false);
    },
    onError: (error: Error) => {
      toast({
        title: t("projects.promptUpdateFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle save prompt
  const handleSavePrompt = () => {
    updatePromptMutation.mutate();
  };

  // Handle process image
  const processMutation = useMutation({
    mutationFn: async () => {
      if (!selectedImage) throw new Error(t("test.noImageSelected"));
      
      const formData = new FormData();
      formData.append("image", selectedImage);
      
      const res = await fetch(`/api/projects/${id}/process`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || res.statusText);
      }
      
      return await res.json();
    },
    onSuccess: (data: OcrResult) => {
      setProcessingResult(data);
      toast({
        title: t("test.processingComplete"),
        description: t("test.resultsReady"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("test.processingFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle select model
  const selectModelMutation = useMutation({
    mutationFn: async (model: "gemini" | "openai") => {
      if (!processingResult) throw new Error(t("test.noResultToSelect"));
      
      const res = await apiRequest("POST", `/api/projects/${id}/results/${processingResult.id}/select`, {
        model,
      });
      
      return await res.json();
    },
    onSuccess: (data: OcrResult) => {
      // Update processing result
      setProcessingResult(data);
      
      // Invalidate project query to update preferred model
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
      
      toast({
        title: t("test.modelSelected"),
        description: t("test.modelSelectedDescription", {
          model: data.selectedResult === "gemini" ? "Gemini" : "OpenAI",
        }),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("test.modelSelectionFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSelectModel = (model: "gemini" | "openai") => {
    selectModelMutation.mutate(model);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 pt-24 pb-16">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              {t("common.backToProjects")}
            </Button>
          </Link>
        </div>
        
        {isLoadingProject ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : projectError ? (
          <div className="bg-destructive/10 text-destructive p-6 rounded-lg flex items-start gap-4">
            <AlertTriangle className="h-5 w-5 mt-0.5" />
            <div>
              <h3 className="font-medium">{t("projects.errorLoading")}</h3>
              <p className="text-sm">{projectError.message}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] })}
              >
                {t("common.retry")}
              </Button>
            </div>
          </div>
        ) : project ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">{project.name}: {t("test.testProcessing")}</h1>
              <p className="text-muted-foreground">{t("test.testDescription")}</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Upload Area */}
              <div>
                <ImageUpload
                  onImageUpload={handleImageUpload}
                  title={t("test.uploadTestDocument")}
                  isProcessing={processMutation.isPending}
                />
                
                <Card className="mt-6">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-medium mb-4">{t("test.customAIPrompt")}</h3>
                    <Textarea
                      value={customPrompt}
                      onChange={handleCustomPromptChange}
                      rows={6}
                      placeholder={t("test.promptPlaceholder")}
                      className="mb-4"
                    />
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        disabled={!isCustomPromptUpdated || updatePromptMutation.isPending}
                        onClick={handleSavePrompt}
                      >
                        {updatePromptMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        <Save className="h-4 w-4 mr-1" />
                        {t("test.savePrompt")}
                      </Button>
                      <Button
                        disabled={!selectedImage || processMutation.isPending}
                        onClick={() => processMutation.mutate()}
                      >
                        {processMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        <Sparkles className="h-4 w-4 mr-1" />
                        {t("test.processDocument")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Right Column: Results */}
              <div>
                <ResultComparison
                  geminiResult={processingResult?.geminiResult || ""}
                  openaiResult={processingResult?.openaiResult || ""}
                  onSelectModel={handleSelectModel}
                  isLoading={processMutation.isPending}
                  selectedModel={processingResult?.selectedResult || undefined}
                />
                {/* For debugging */}
                {processingResult && (
                  <div className="mt-4 p-4 bg-muted rounded-lg text-xs">
                    <details>
                      <summary className="cursor-pointer font-medium">Debug Info</summary>
                      <pre className="mt-2 overflow-auto max-h-36">
                        {JSON.stringify(processingResult, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
                
                {processingResult && processingResult.selectedResult && (
                  <div className="mt-6 text-center">
                    <Link href={`/projects/${id}/deploy`}>
                      <Button size="lg" className="px-8">
                        {t("test.proceedToDeploy")}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </main>
      
      <Footer />
    </div>
  );
}
