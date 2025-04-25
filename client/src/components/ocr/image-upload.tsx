import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
  title?: string;
  description?: string;
  maxFileSizeMB?: number;
  acceptedFileTypes?: string;
  isMultiple?: boolean;
  isProcessing?: boolean;
}

export function ImageUpload({
  onImageUpload,
  title,
  description,
  maxFileSizeMB = 10,
  acceptedFileTypes = "image/jpeg, image/png, application/pdf",
  isMultiple = false,
  isProcessing = false,
}: ImageUploadProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const maxSizeBytes = maxFileSizeMB * 1024 * 1024;

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const validFiles: File[] = [];
    const validFileUrls: string[] = [];
    
    Array.from(files).forEach(file => {
      // Check file type
      if (!acceptedFileTypes.includes(file.type)) {
        toast({
          title: t("upload.invalidType"),
          description: t("upload.acceptedTypes", { types: acceptedFileTypes }),
          variant: "destructive",
        });
        return;
      }
      
      // Check file size
      if (file.size > maxSizeBytes) {
        toast({
          title: t("upload.fileTooBig"),
          description: t("upload.maxSize", { size: maxFileSizeMB }),
          variant: "destructive",
        });
        return;
      }
      
      validFiles.push(file);
      
      // Create preview URL for images only
      if (file.type.startsWith('image/')) {
        validFileUrls.push(URL.createObjectURL(file));
      } else {
        // For PDFs just add a placeholder
        validFileUrls.push('pdf');
      }
    });
    
    if (validFiles.length > 0) {
      if (isMultiple) {
        setSelectedFiles(prev => [...prev, ...validFiles]);
        setPreviewUrls(prev => [...prev, ...validFileUrls]);
        
        // Call the callback for each file in multiple mode
        validFiles.forEach(file => onImageUpload(file));
      } else {
        // In single file mode, replace the current file
        setSelectedFiles([validFiles[0]]);
        setPreviewUrls([validFileUrls[0]]);
        onImageUpload(validFiles[0]);
      }
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    const newUrls = [...previewUrls];
    
    // Revoke the object URL to avoid memory leaks
    if (newUrls[index] !== 'pdf') {
      URL.revokeObjectURL(newUrls[index]);
    }
    
    newFiles.splice(index, 1);
    newUrls.splice(index, 1);
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-xl font-medium mb-4">{title || t("upload.title")}</h3>
        
        <div
          className={`image-drop-area flex flex-col items-center justify-center py-10 px-4 ${isDragging ? 'active' : ''} ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {selectedFiles.length === 0 ? (
            <>
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center mb-2">
                {description || t("upload.dragDrop")}
              </p>
              <p className="text-muted-foreground/60 text-sm text-center">
                {t("upload.supportedFormats", { size: maxFileSizeMB })}
              </p>
              <Button 
                className="mt-6" 
                onClick={openFileDialog}
                variant="secondary"
                disabled={isProcessing}
              >
                {t("upload.browse")}
              </Button>
            </>
          ) : (
            <div className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative bg-background/50 rounded-md p-2 flex items-center">
                    {url === 'pdf' ? (
                      <div className="w-12 h-12 flex items-center justify-center bg-muted rounded-md mr-3">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    ) : (
                      <img 
                        src={url} 
                        alt={selectedFiles[index].name} 
                        className="w-12 h-12 object-cover rounded-md mr-3" 
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {selectedFiles[index].name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFiles[index].size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button 
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => removeFile(index)}
                      disabled={isProcessing}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              {isMultiple && (
                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={openFileDialog}
                    disabled={isProcessing}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {t("upload.addMore")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelect}
          accept={acceptedFileTypes}
          multiple={isMultiple}
          disabled={isProcessing}
        />
      </CardContent>
    </Card>
  );
}
