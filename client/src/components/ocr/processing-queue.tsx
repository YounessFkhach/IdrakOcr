import { useState } from "react";
import { useTranslation } from "react-i18next";
import { OcrResult } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";

interface ProcessingQueueProps {
  results: OcrResult[];
  isLoading?: boolean;
  error?: Error | null;
}

export function ProcessingQueue({
  results,
  isLoading = false,
  error = null,
}: ProcessingQueueProps) {
  const { t } = useTranslation();

  // Function to format file size
  const formatFileSize = (bytes: number | null | undefined): string => {
    if (!bytes) return "0 B";
    
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  // Get status component
  const getStatusComponent = (status: string) => {
    switch (status) {
      case "complete":
        return (
          <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t("queue.complete")}
          </span>
        );
      case "processing":
        return (
          <div className="flex items-center">
            <Loader2 className="h-3 w-3 text-primary animate-spin mr-1" />
            <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full">
              {t("queue.processing")}
            </span>
          </div>
        );
      case "failed":
        return (
          <span className="text-xs px-2 py-1 bg-destructive/20 text-destructive rounded-full flex items-center">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {t("queue.failed")}
          </span>
        );
      default:
        return (
          <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {t("queue.queued")}
          </span>
        );
    }
  };

  // Get position in queue
  const getPositionInfo = (index: number) => {
    const processingFiles = results.filter(r => r.status === "processing").length;
    const position = index - processingFiles;
    
    if (position <= 0) return "";
    
    return t("queue.position", { position });
  };

  // If loading
  if (isLoading && results.length === 0) {
    return (
      <div className="space-y-4 py-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-muted rounded-lg p-4 animate-pulse">
            <div className="h-4 w-3/4 bg-muted-foreground/20 rounded mb-2"></div>
            <div className="h-3 w-1/2 bg-muted-foreground/20 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  // If error
  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <div>
          <p className="font-medium">{t("queue.errorLoading")}</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  // If no results
  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">{t("queue.noFilesInQueue")}</p>
      </div>
    );
  }

  // Render results
  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-4 pr-4">
        {results.map((result, index) => (
          <div key={result.id} className="bg-background rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <FileText className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="truncate max-w-[200px]">{result.fileName}</span>
              </div>
              {getStatusComponent(result.status)}
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatFileSize(result.fileSize)}</span>
              {result.status === "processing" ? (
                <div className="w-1/2">
                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-full animate-pulse"></div>
                  </div>
                </div>
              ) : result.status === "complete" ? (
                <span>{t("queue.processingTime", { time: "3.2s" })}</span>
              ) : (
                <span>{getPositionInfo(index)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
