import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Project, OcrResult } from "@shared/schema";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUpload } from "@/components/ocr/image-upload";
import { ProcessingQueue } from "@/components/ocr/processing-queue";
import { MarkdownPreview } from "@/components/ocr/markdown-preview";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Download,
  AlarmClockCheck,
  Sparkles,
  Binary,
  Hourglass,
} from "lucide-react";

export default function DeployProjectPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processingResults, setProcessingResults] = useState<OcrResult[]>([]);
  const [resultIds, setResultIds] = useState<number[]>([]);
  const [outputFormat, setOutputFormat] = useState("markdown");
  const [saveResults, setSaveResults] = useState(true);
  const [enableBatchOptimization, setEnableBatchOptimization] = useState(true);
  const [isPolling, setIsPolling] = useState(false);

  // Fetch project
  const {
    data: project,
    isLoading: isLoadingProject,
    error: projectError,
  } = useQuery<Project>({
    queryKey: [`/api/projects/${id}`],
  });

  // Check if project has preferred model
  const hasPreferedModel = project?.preferredModel && ["gemini", "openai"].includes(project.preferredModel);

  // Get results when resultIds are available
  const {
    data: results,
    isLoading: isLoadingResults,
    error: resultsError,
    refetch: refetchResults,
  } = useQuery<OcrResult[]>({
    queryKey: [`/api/projects/${id}/results`],
    enabled: resultIds.length > 0 && isPolling,
  });

  // Poll for results while processing
  useEffect(() => {
    let intervalId: number;
    
    if (isPolling && resultIds.length > 0) {
      intervalId = window.setInterval(() => {
        refetchResults();
      }, 3000); // Poll every 3 seconds
    }
    
    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [isPolling, resultIds, refetchResults]);

  // Update processing results when new results are fetched
  useEffect(() => {
    if (results) {
      setProcessingResults(results.filter(r => resultIds.includes(r.id)));
      
      // Check if all processing is complete
      const allComplete = results
        .filter(r => resultIds.includes(r.id))
        .every(r => r.status === "complete" || r.status === "failed");
      
      if (allComplete && isPolling) {
        setIsPolling(false);
        toast({
          title: t("deploy.processingComplete"),
          description: t("deploy.allDocumentsProcessed"),
        });
      }
    }
  }, [results, resultIds, isPolling, toast, t]);

  // Handle image upload
  const handleImageUpload = (file: File) => {
    setSelectedFiles(prev => [...prev, file]);
  };

  // Start processing
  const deployMutation = useMutation({
    mutationFn: async () => {
      if (selectedFiles.length === 0) throw new Error(t("deploy.noFilesSelected"));
      
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append("images", file);
      });
      
      const res = await fetch(`/api/projects/${id}/deploy`, {
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
    onSuccess: (data: { message: string; resultIds: number[] }) => {
      toast({
        title: t("deploy.processingStarted"),
        description: t("deploy.processingDescription", { count: selectedFiles.length }),
      });
      
      // Set result IDs and start polling
      setResultIds(data.resultIds);
      setIsPolling(true);
    },
    onError: (error: Error) => {
      toast({
        title: t("deploy.processingFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate progress
  const getProgress = () => {
    if (resultIds.length === 0) return 0;
    
    const completed = processingResults.filter(r => 
      r.status === "complete" || r.status === "failed"
    ).length;
    
    return Math.round((completed / resultIds.length) * 100);
  };

  // Estimate completion time
  const getEstimatedTime = () => {
    if (resultIds.length === 0 || processingResults.length === 0) return "";
    
    const completed = processingResults.filter(r => 
      r.status === "complete" || r.status === "failed"
    ).length;
    
    if (completed === 0) return t("deploy.calculatingEta");
    
    const remaining = resultIds.length - completed;
    const minutes = Math.ceil(remaining * 1.5); // Assuming 1.5 minutes per file
    
    return t("deploy.estimatedTime", { minutes });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 pt-24 pb-16">
        <div className="mb-6">
          <Link href={`/projects/${id}/test`}>
            <Button variant="ghost" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              {t("deploy.backToTesting")}
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
                onClick={() => window.location.reload()}
              >
                {t("common.retry")}
              </Button>
            </div>
          </div>
        ) : project ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">{project.name}: {t("deploy.deployment")}</h1>
              <p className="text-muted-foreground">
                {hasPreferedModel ? 
                  t("deploy.processMultipleFiles", { model: project.preferredModel === "gemini" ? "Gemini" : "ChatGPT" }) : 
                  t("deploy.noModelWarning")}
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Upload Area */}
              <div className="lg:col-span-1">
                <ImageUpload
                  onImageUpload={handleImageUpload}
                  title={t("deploy.uploadDocuments")}
                  description={t("deploy.dragDropMultiple")}
                  isMultiple={true}
                  isProcessing={deployMutation.isPending || isPolling}
                />
                
                <div className="mt-6 text-center">
                  <Button
                    size="lg"
                    onClick={() => {
                      // If no model is selected, automatically set one before processing
                      if (!hasPreferedModel && project) {
                        fetch(`/api/projects/${id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ preferredModel: "gemini" }),
                          credentials: "include"
                        }).then(() => {
                          // Update project locally
                          if (project) project.preferredModel = "gemini";
                          // Start processing
                          deployMutation.mutate();
                          toast({
                            title: t("deploy.modelAutoSelected"),
                            description: t("deploy.geminiSelectedAuto")
                          });
                        });
                      } else {
                        // Process normally if model is already selected
                        deployMutation.mutate();
                      }
                    }}
                    disabled={selectedFiles.length === 0 || deployMutation.isPending || isPolling}
                    className="px-8"
                  >
                    {(deployMutation.isPending || isPolling) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {t("deploy.startProcessing")}
                  </Button>
                </div>
                
                <Card className="mt-6">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-medium mb-4">{t("deploy.processingSettings")}</h3>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">{t("deploy.selectedModel")}</label>
                      <div className="flex items-center justify-between bg-background p-4 rounded-lg">
                        <div className="flex items-center">
                          {project.preferredModel === "gemini" ? (
                            <Sparkles className="h-4 w-4 text-primary mr-2" />
                          ) : project.preferredModel === "openai" ? (
                            <Binary className="h-4 w-4 text-primary mr-2" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-destructive mr-2" />
                          )}
                          <span>
                            {project.preferredModel === "gemini" ? "Gemini" : 
                             project.preferredModel === "openai" ? "ChatGPT" : 
                             t("deploy.noModelSelected")}
                          </span>
                        </div>
                        {hasPreferedModel && (
                          <span className="text-sm text-muted-foreground">{t("deploy.default")}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">{t("deploy.outputFormat")}</label>
                      <Select value={outputFormat} onValueChange={setOutputFormat}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("deploy.selectFormat")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="markdown">Markdown</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="text">Plain Text</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="save-results" 
                          checked={saveResults} 
                          onCheckedChange={(checked) => setSaveResults(!!checked)}
                        />
                        <label htmlFor="save-results" className="text-sm">
                          {t("deploy.saveResults")}
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="batch-optimization" 
                          checked={enableBatchOptimization} 
                          onCheckedChange={(checked) => setEnableBatchOptimization(!!checked)}
                        />
                        <label htmlFor="batch-optimization" className="text-sm">
                          {t("deploy.enableBatchOptimization")}
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Right Column: Results */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle>{t("deploy.processingQueue")}</CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={processingResults.length === 0 || isPolling}
                        onClick={() => {
                          setProcessingResults([]);
                          setResultIds([]);
                          setSelectedFiles([]);
                        }}
                      >
                        {t("deploy.clearAll")}
                      </Button>
                    </div>
                    <CardDescription>
                      {resultIds.length > 0 
                        ? t("deploy.processingProgress", { 
                            completed: processingResults.filter(r => r.status === "complete").length,
                            total: resultIds.length
                          })
                        : t("deploy.noFilesInQueue")
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProcessingQueue 
                      results={processingResults}
                      isLoading={isLoadingResults}
                      error={resultsError}
                    />
                  </CardContent>
                </Card>
                
                <Card className="mt-6">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle>{t("deploy.results")}</CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={processingResults.filter(r => r.status === "complete").length === 0}
                        className="flex items-center"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        {t("deploy.exportAll")}
                      </Button>
                    </div>
                    <CardDescription>
                      {processingResults.filter(r => r.status === "complete").length > 0
                        ? t("deploy.completedResults", { 
                            count: processingResults.filter(r => r.status === "complete").length 
                          })
                        : t("deploy.noResultsYet")
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {processingResults.filter(r => r.status === "complete").length > 0 ? (
                      <div className="space-y-6 max-h-96 overflow-y-auto">
                        {processingResults
                          .filter(r => r.status === "complete")
                          .map((result) => (
                            <div key={result.id} className="border-b border-muted pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium">{result.fileName}</h4>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="bg-background rounded-lg p-4 max-h-64 overflow-y-auto text-sm">
                                <MarkdownPreview 
                                  content={
                                    project.preferredModel === "gemini" 
                                      ? (result.geminiResult || t("deploy.noContentAvailable"))
                                      : (result.openaiResult || t("deploy.noContentAvailable"))
                                  } 
                                />
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    ) : isPolling ? (
                      <div className="flex flex-col items-center justify-center text-muted-foreground py-10">
                        <Hourglass className="h-8 w-8 mb-3 animate-pulse" />
                        <p>{t("deploy.waitingForResults")}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground py-10">
                        <AlarmClockCheck className="h-8 w-8 mb-3" />
                        <p>{t("deploy.uploadAndProcess")}</p>
                      </div>
                    )}
                  </CardContent>
                  
                  {isPolling && (
                    <div className="px-6 pb-6">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium text-foreground">{getProgress()}%</span> {t("deploy.complete")}
                        </div>
                        <div>
                          {getEstimatedTime()}
                        </div>
                      </div>
                      <div className="w-full h-1 bg-muted rounded-full mt-2 overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${getProgress()}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </>
        ) : null}
      </main>
      
      <Footer />
    </div>
  );
}
