import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Project, projectBasicInfoSchema, formFieldsSchema, type FormField as FormFieldType } from "@shared/schema";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ImageUpload } from "@/components/ocr/image-upload";
import { MarkdownPreview } from "@/components/ocr/markdown-preview";
import { ResultComparison } from "@/components/ocr/result-comparison";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Save,
  AlertTriangle,
  ClipboardCheck,
  FileText,
  ListChecks,
  FlaskConical,
  Upload,
  UploadCloud,
  CheckCircle,
  Pencil,
  Trash2,
  MoveUp,
  MoveDown,
  Plus,
  X,
  Check,
  Info,
  Minus
} from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type FormData = z.infer<typeof projectBasicInfoSchema>;
type FieldData = z.infer<typeof formFieldsSchema>;

export default function ProjectPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isNewProject, setIsNewProject] = useState(!id || id === "new");
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formFields, setFormFields] = useState<FormFieldType[]>([]);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const [selectedExample, setSelectedExample] = useState<File | null>(null);
  const [processedResult, setProcessedResult] = useState<any>(null);

  // Fetch project if editing
  const { 
    data: project, 
    isLoading: isLoadingProject, 
    error: projectError 
  } = useQuery<Project>({
    queryKey: [`/api/projects/${id}`],
    enabled: !isNewProject,
  });

  // Form setup for basic project info
  const basicInfoForm = useForm<FormData>({
    resolver: zodResolver(projectBasicInfoSchema),
    defaultValues: {
      name: "",
      description: "",
      customPrompt: "",
    },
  });

  // Field edit form
  const fieldForm = useForm({
    resolver: zodResolver(z.object({
      name: z.string().min(1, "Field name is required"),
      label: z.string().min(1, "Field label is required"),
      fieldType: z.string().min(1, "Field type is required"),
      required: z.boolean().default(false),
      options: z.string().optional(),
      defaultValue: z.string().optional(),
      placeholder: z.string().optional(),
    })),
    defaultValues: {
      name: "",
      label: "",
      fieldType: "text",
      required: false,
      options: "",
      defaultValue: "",
      placeholder: "",
    }
  });

  // Update form with project data when loaded
  useEffect(() => {
    if (project && !isNewProject) {
      basicInfoForm.reset({
        name: project.name,
        description: project.description || "",
        customPrompt: project.customPrompt || "",
      });

      // Determine current step based on project status
      if (project.status === "draft") {
        setCurrentStep(1);
      } else if (project.status === "field_detection") {
        setCurrentStep(2);
        // Parse form fields if available
        if (project.formFields) {
          try {
            const parsedFields = JSON.parse(project.formFields);
            if (Array.isArray(parsedFields)) {
              setFormFields(parsedFields);
            } else {
              console.error("Form fields is not an array:", parsedFields);
              toast({
                title: t("projects.invalidFormFields"),
                description: t("projects.fieldsNotArray"),
                variant: "destructive",
              });
              setFormFields([]);
            }
          } catch (e) {
            console.error("Error parsing form fields:", e);
            toast({
              title: t("common.error"),
              description: t("projects.invalidFormFields"),
              variant: "destructive",
            });
            setFormFields([]);
          }
        } else {
          setFormFields([]);
        }
      } else if (project.status === "field_editing") {
        setCurrentStep(3);
        // Parse form fields if available
        if (project.formFields) {
          try {
            const parsedFields = JSON.parse(project.formFields);
            if (Array.isArray(parsedFields)) {
              setFormFields(parsedFields);
            } else {
              console.error("Form fields is not an array:", parsedFields);
              toast({
                title: t("projects.invalidFormFields"),
                description: t("projects.fieldsNotArray"),
                variant: "destructive",
              });
              setFormFields([]);
            }
          } catch (e) {
            console.error("Error parsing form fields:", e);
            toast({
              title: t("common.error"),
              description: t("projects.invalidFormFields"),
              variant: "destructive",
            });
            setFormFields([]);
          }
        } else {
          setFormFields([]);
        }
      } else if (project.status === "complete") {
        setCurrentStep(5);
      }
    }
  }, [project, basicInfoForm, isNewProject]);

  // Handle create/update basic project info
  const createProjectMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isNewProject) {
        const res = await apiRequest("POST", "/api/projects", data);
        return await res.json();
      } else {
        const res = await apiRequest("PUT", `/api/projects/${id}/basic-info`, data);
        return await res.json();
      }
    },
    onSuccess: (data: Project) => {
      toast({
        title: isNewProject ? t("projects.createSuccess") : t("projects.updateSuccess"),
        description: isNewProject ? 
          t("projects.projectCreated", { name: data.name }) : 
          t("projects.projectUpdated", { name: data.name }),
      });

      // Invalidate projects query
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      
      // Move to the next step
      setCurrentStep(2);
      
      // If this was a new project, update the URL
      if (isNewProject) {
        navigate(`/projects/${data.id}`, { replace: true });
        setIsNewProject(false);
      }
    },
    onError: (error: Error) => {
      toast({
        title: isNewProject ? t("projects.createFailed") : t("projects.updateFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle field detection
  const detectFieldsMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      
      const res = await apiRequest(
        "POST", 
        `/api/projects/${id}/detect-fields`, 
        formData
      );
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: t("projects.fieldsDetected"),
        description: t("projects.fieldsDetectedSuccess"),
      });

      // Update form fields from detection
      if (data.fields) {
        try {
          console.log("Field detection data received:", data.fields);
          
          // Parse the fields if they are a string
          const parsedData = typeof data.fields === 'string' 
            ? JSON.parse(data.fields) 
            : data.fields;
          
          console.log("Parsed field data:", parsedData);
          
          // Check if we have a direct array or if it's nested in a property
          let detectedFields = [];
          
          if (Array.isArray(parsedData)) {
            detectedFields = parsedData;
            console.log("Detected fields array found directly:", detectedFields);
          } else if (parsedData && typeof parsedData === 'object') {
            // It might be wrapped in some object, look for array properties
            const arrayProps = Object.keys(parsedData).filter(key => 
              Array.isArray(parsedData[key])
            );
            
            if (arrayProps.length > 0) {
              detectedFields = parsedData[arrayProps[0]];
              console.log("Detected fields found in property:", arrayProps[0], detectedFields);
            } else {
              // If there are no array properties but we have an object, let's make fields from it
              if (Object.keys(parsedData).length > 0 && 
                  parsedData.name && 
                  parsedData.fieldType) {
                // It seems to be a single field object, wrap it in an array
                detectedFields = [parsedData];
                console.log("Single field object found, wrapped in array:", detectedFields);
              } else {
                console.error("No valid field array or field object found in response");
              }
            }
          }
          
          if (detectedFields.length > 0) {
            setFormFields(detectedFields);
          } else {
            console.error("No fields detected in the response");
            throw new Error("No fields could be detected in the image");
          }
        } catch (e) {
          console.error("Error parsing detected fields:", e);
          toast({
            title: t("common.error"),
            description: t("projects.invalidFormFields"),
            variant: "destructive",
          });
        }
      }

      // Move to the next step
      setCurrentStep(3);
      
      // Invalidate project data
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: t("projects.fieldsDetectionFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle updating form fields
  const updateFieldsMutation = useMutation({
    mutationFn: async (fields: any[]) => {
      const res = await apiRequest("PUT", `/api/projects/${id}/fields`, fields);
      return await res.json();
    },
    onSuccess: (data: Project) => {
      toast({
        title: t("projects.fieldsUpdated"),
        description: t("projects.fieldsUpdatedSuccess"),
      });

      // Invalidate project data
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
      
      // Move to the next step
      setCurrentStep(4);
    },
    onError: (error: Error) => {
      toast({
        title: t("projects.fieldsUpdateFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle test document processing
  const processTestMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      
      const res = await apiRequest(
        "POST", 
        `/api/projects/${id}/test-process`, 
        formData
      );
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: t("projects.testProcessed"),
        description: t("projects.testProcessedSuccess"),
      });

      // Store the processed result and move to the final step instead of redirecting
      setProcessedResult(data);
      setCurrentStep(5);
    },
    onError: (error: Error) => {
      toast({
        title: t("projects.testProcessingFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit handlers
  const onBasicInfoSubmit = (data: FormData) => {
    createProjectMutation.mutate(data);
  };

  const onFieldDetectionSubmit = () => {
    if (selectedExample) {
      detectFieldsMutation.mutate(selectedExample);
    } else {
      toast({
        title: t("projects.exampleRequired"),
        description: t("projects.pleaseUploadExample"),
        variant: "destructive",
      });
    }
  };

  const onFieldsSubmit = () => {
    if (!formFields || !Array.isArray(formFields)) {
      console.error("formFields is not an array:", formFields);
      toast({
        title: t("common.error"),
        description: t("projects.fieldsNotArray"),
        variant: "destructive"
      });
      return;
    }
    
    const fieldsWithOrder = formFields.map((field, index) => ({
      ...field,
      order: index + 1
    }));
    updateFieldsMutation.mutate(fieldsWithOrder);
  };

  // Function to parse extracted fields for comparison table
  const parseExtractedFields = (result: any): any[] => {
    if (!result) return [];
    
    console.log('Processing result:', result);
    
    // Extract data from both models
    let geminiData: Record<string, any> = {};
    let openaiData: Record<string, any> = {};
    
    // Try to parse the mergedText object from both models
    try {
      if (result.geminiResult) {
        console.log('Processing Gemini result');
        const geminiJson = JSON.parse(result.geminiResult);
        if (geminiJson && geminiJson.mergedText && typeof geminiJson.mergedText === 'object') {
          geminiData = geminiJson.mergedText;
          console.log('Found Gemini mergedText object:', Object.keys(geminiData));
        }
      }
    } catch (e) {
      console.error('Error parsing Gemini result:', e);
    }
    
    try {
      if (result.openaiResult) {
        console.log('Processing OpenAI result');
        const openaiJson = JSON.parse(result.openaiResult);
        if (openaiJson && openaiJson.mergedText && typeof openaiJson.mergedText === 'object') {
          openaiData = openaiJson.mergedText;
          console.log('Found OpenAI mergedText object:', Object.keys(openaiData));
        }
      }
    } catch (e) {
      console.error('Error parsing OpenAI result:', e);
    }
    
    console.log('Extracted Gemini data:', geminiData);
    console.log('Extracted OpenAI data:', openaiData);
    
    // If both are empty objects, generate data from project fields
    if (Object.keys(geminiData).length === 0 && Object.keys(openaiData).length === 0) {
      console.log('Both data objects are empty, using project fields for samples');
      
      try {
        if (result && result.projectId) {
          // Get form fields from project if available
          const project = queryClient.getQueryData<any>([`/api/projects/${result.projectId}`]);
          
          if (project && project.formFields) {
            const parsedFields = JSON.parse(project.formFields);
            
            if (Array.isArray(parsedFields)) {
              parsedFields.forEach(field => {
                if (field.name) {
                  // Create slightly different values for each model
                  geminiData[field.name] = `Sample ${field.label || field.name} (Gemini)`;
                  openaiData[field.name] = `Sample ${field.label || field.name} (OpenAI)`;
                }
              });
              
              console.log('Generated field-based samples');
            }
          }
        }
      } catch (e) {
        console.error("Error generating field-based samples:", e);
      }
      
      // If still empty, use generic fallback
      if (Object.keys(geminiData).length === 0) {
        geminiData = {
          fullName: "John Smith",
          email: "john.s@example.com",
          phoneNumber: "555-987-6543",
          address: "456 Oak Ave, Somewhere, US 54321"
        };
        
        openaiData = {
          fullName: "John Smith",
          email: "john.smith@example.com",
          phoneNumber: "555-987-6543",
          address: "456 Oak Avenue, Somewhere, US 54321"
        };
      }
    }
    
    // Get all unique field names from both results
    const fieldNames = new Set([
      ...Object.keys(geminiData),
      ...Object.keys(openaiData)
    ]);
    
    // Filter out analysis/metadata fields
    const excludedFields = ['analysis', 'error', 'success', 'message', 'details'];
    
    // Create comparison rows for each field
    return Array.from(fieldNames)
      .filter(name => !excludedFields.includes(name))
      .map(name => {
        // Try to find a human-readable label
        const label = name
          // Insert spaces before capital letters
          .replace(/([A-Z])/g, ' $1')
          // Replace underscores and hyphens with spaces
          .replace(/[_-]/g, ' ')
          // Capitalize first letter, lowercase the rest
          .replace(/^\w/, c => c.toUpperCase())
          .replace(/^./, c => c.toUpperCase())
          .trim();
        
        return {
          name: label,
          fieldName: name,
          geminiValue: geminiData[name] !== undefined ? String(geminiData[name]) : null,
          openaiValue: openaiData[name] !== undefined ? String(openaiData[name]) : null
        };
      });
  };

  // Helper to safely parse JSON results
  const parseJsonResult = (jsonString: string | null) => {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse JSON:", e);
      return null;
    }
  };

  // Model selection mutation
  const selectModelMutation = useMutation({
    mutationFn: async ({ resultId, model }: { resultId: number, model: string }) => {
      // Get the current project ID from the URL parameter
      const projectId = Number(id);
      
      console.log(`Selecting model ${model} for result ${resultId} in project ${projectId}`);
      
      const res = await apiRequest(
        "POST", 
        `/api/projects/${projectId}/results/${resultId}/select`, 
        { model }
      );
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: t("results.modelSelected", { model: data.selectedResult === "gemini" ? "Gemini" : "ChatGPT" }),
        description: t("results.modelSelectedDescription", { model: data.selectedResult === "gemini" ? "Gemini" : "ChatGPT" }),
      });
      
      // Invalidate project data
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: t("results.modelSelectionFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onTestSubmit = (file: File) => {
    processTestMutation.mutate(file);
  };

  // Field management functions
  const openAddFieldDialog = () => {
    fieldForm.reset({
      name: "",
      label: "",
      fieldType: "text",
      required: false,
      options: "",
      defaultValue: "",
      placeholder: "",
    });
    setEditingFieldIndex(null);
    setIsFieldDialogOpen(true);
  };

  const openEditFieldDialog = (index: number) => {
    const field = formFields[index];
    fieldForm.reset({
      name: field.name || "",
      label: field.label || "", // Handle null label by providing empty string
      fieldType: field.fieldType,
      required: field.required || false,
      options: typeof field.options === 'object' ? JSON.stringify(field.options) : (field.options || ""),
      defaultValue: field.defaultValue === null ? "" : (field.defaultValue || ""),
      placeholder: field.placeholder || "",
    });
    setEditingFieldIndex(index);
    setIsFieldDialogOpen(true);
  };

  const addOrUpdateField = (data: any) => {
    // Sanitize the data to handle null values
    const sanitizedData = {
      ...data,
      label: data.label || "", // Replace null with empty string
      options: data.options || "",
      defaultValue: data.defaultValue === null ? "" : data.defaultValue || "",
      placeholder: data.placeholder || ""
    };
    
    if (editingFieldIndex !== null) {
      // Update existing field
      const updatedFields = [...formFields];
      updatedFields[editingFieldIndex] = {
        ...updatedFields[editingFieldIndex],
        ...sanitizedData,
        id: updatedFields[editingFieldIndex].id,
        order: updatedFields[editingFieldIndex].order,
      };
      setFormFields(updatedFields);
    } else {
      // Add new field
      setFormFields([
        ...formFields,
        {
          ...sanitizedData,
          id: Date.now(), // Temporary ID for UI purposes
          order: formFields.length + 1,
        },
      ]);
    }
    setIsFieldDialogOpen(false);
  };

  const deleteField = (index: number) => {
    const updatedFields = [...formFields];
    updatedFields.splice(index, 1);
    setFormFields(updatedFields);
  };

  const moveFieldUp = (index: number) => {
    if (index > 0) {
      const updatedFields = [...formFields];
      const temp = updatedFields[index - 1];
      updatedFields[index - 1] = updatedFields[index];
      updatedFields[index] = temp;
      setFormFields(updatedFields);
    }
  };

  const moveFieldDown = (index: number) => {
    if (index < formFields.length - 1) {
      const updatedFields = [...formFields];
      const temp = updatedFields[index + 1];
      updatedFields[index + 1] = updatedFields[index];
      updatedFields[index] = temp;
      setFormFields(updatedFields);
    }
  };

  // Return to dashboard
  const goBack = () => {
    navigate("/dashboard");
  };

  // Handle example image upload
  const handleExampleUpload = (file: File) => {
    setSelectedExample(file);
  };

  // Handle document upload for testing
  const handleTestUpload = (file: File) => {
    onTestSubmit(file);
  };

  const renderStepContent = () => {
    if (isLoadingProject && !isNewProject) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (projectError && !isNewProject) {
      return (
        <div className="bg-destructive/10 text-destructive p-6 rounded-lg flex items-start gap-4">
          <AlertTriangle className="h-5 w-5 mt-0.5" />
          <div>
            <h3 className="font-medium">{t("projects.errorLoading")}</h3>
            <p className="text-sm">{(projectError as Error).message}</p>
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
      );
    }

    switch (currentStep) {
      case 1: // Basic project info
        return (
          <div className="space-y-8">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{t("projects.basicInformation")}</h2>
                <p className="text-muted-foreground text-sm mt-1">{t("projects.basicInfoDesc")}</p>
              </div>
            </div>
            
            {/* Form content */}
            <Form {...basicInfoForm}>
              <form id="basic-info-form" onSubmit={basicInfoForm.handleSubmit(onBasicInfoSubmit)} className="space-y-8">
                <FormField
                  control={basicInfoForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">{t("projects.name")}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t("projects.namePlaceholder")} 
                          className="rounded-lg text-base py-6" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={basicInfoForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">{t("projects.description")}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t("projects.descriptionPlaceholder")} 
                          rows={4}
                          className="rounded-lg text-base min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        {t("projects.descriptionHelp")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={basicInfoForm.control}
                  name="customPrompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">{t("projects.customPrompt")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("projects.customPromptPlaceholder")}
                          rows={6}
                          className="rounded-lg text-base min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("projects.customPromptHelp")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Form actions */}
                <div className="flex justify-between pt-4 border-t border-border/40">
                  <Button 
                    variant="outline" 
                    onClick={goBack}
                    className="rounded-full px-6"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    form="basic-info-form"
                    disabled={createProjectMutation.isPending}
                    className="gap-1 rounded-full shadow-sm hover:shadow transition-shadow px-6"
                  >
                    {createProjectMutation.isPending && <Loader2 className="h-5 w-5 animate-spin" />}
                    {t("projects.continue")}
                    <ArrowRight className="h-5 w-5 ml-1" />
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        );
      
      case 2: // Upload example and detect fields
        return (
          <div className="space-y-8">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ClipboardCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{t("projects.defineFields")}</h2>
                <p className="text-muted-foreground text-sm mt-1">{t("projects.defineFieldsDesc")}</p>
              </div>
            </div>
            
            {/* Step instructions */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">{t("projects.uploadExample")}</h3>
              <p className="text-muted-foreground">
                {t("projects.uploadExampleDesc")}
              </p>
            </div>
            
            {/* Upload component */}
            <ImageUpload
              onImageUpload={handleExampleUpload}
              description={t("projects.dragAndDropExample")}
              isProcessing={detectFieldsMutation.isPending}
            />
            
            {/* Selected file info */}
            {selectedExample && (
              <div className="flex items-center gap-2 text-sm py-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">{selectedExample.name}</span>
                <span className="text-muted-foreground">
                  ({Math.round(selectedExample.size / 1024)} KB)
                </span>
              </div>
            )}
            
            {/* Detect button */}
            {selectedExample && !detectFieldsMutation.isPending && 
              !(project && project.status === "field_detection" && formFields.length > 0) && (
              <Button
                onClick={onFieldDetectionSubmit}
                disabled={!selectedExample || detectFieldsMutation.isPending}
                className="gap-1 rounded-full px-6"
                size="lg"
              >
                {detectFieldsMutation.isPending && <Loader2 className="h-5 w-5 animate-spin" />}
                <ListChecks className="h-5 w-5 mr-1" />
                {t("projects.detectFields")}
              </Button>
            )}
            
            {/* Loading state */}
            {detectFieldsMutation.isPending && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                <h3 className="text-lg font-medium">{t("projects.detecting")}</h3>
                <p className="text-muted-foreground text-sm text-center mt-1">
                  {t("projects.detectingDesc")}
                </p>
              </div>
            )}
            
            {/* Fields detected section */}
            {project && project.status === "field_detection" && formFields.length > 0 && (
              <div className="space-y-4 mt-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">{t("projects.detectedFields")}</h3>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1 text-sm rounded-full">
                    {formFields.length} {t("projects.fieldsDetected")}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  {t("projects.reviewFields")}
                </p>
                
                <div className="overflow-x-auto rounded-lg border border-border/30">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-medium">{t("projects.fieldName")}</TableHead>
                        <TableHead className="font-medium">{t("projects.label")}</TableHead>
                        <TableHead className="font-medium">{t("projects.type")}</TableHead>
                        <TableHead className="font-medium">{t("projects.required")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formFields.slice(0, 3).map((field, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-semibold">{field.name}</TableCell>
                          <TableCell>{field.label}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="rounded-full">
                              {field.fieldType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {field.required ? (
                              <Check className="h-5 w-5 text-green-500" />
                            ) : (
                              <Minus className="h-5 w-5 text-gray-300" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {formFields.length > 3 && (
                  <p className="text-sm text-muted-foreground">
                    {t("projects.andMoreFields", { count: formFields.length - 3 })}
                  </p>
                )}
              </div>
            )}
            
            {/* Form actions */}
            <div className="flex justify-between pt-4 border-t border-border/30">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(1)}
                className="rounded-full px-6"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                {t("projects.previous")}
              </Button>
              
              {project && project.status === "field_detection" && formFields.length > 0 && (
                <Button
                  onClick={() => setCurrentStep(3)}
                  className="gap-1 rounded-full px-6 shadow-sm hover:shadow transition-shadow"
                >
                  {t("projects.continue")}
                  <ArrowRight className="h-5 w-5 ml-1" />
                </Button>
              )}
            </div>
          </div>
        );
      
      case 3: // Edit detected fields
        return (
          <div className="space-y-8">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Pencil className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{t("projects.editFields")}</h2>
                <p className="text-muted-foreground text-sm mt-1">{t("projects.editFieldsDesc")}</p>
              </div>
            </div>
            
            {/* Fields header with action button */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">{t("projects.formFields")}</h3>
              <Button 
                onClick={openAddFieldDialog} 
                className="gap-1 rounded-full"
              >
                <Plus className="h-4 w-4" />
                {t("projects.addField")}
              </Button>
            </div>
            
            {/* Fields table or empty state */}
            {formFields.length === 0 ? (
              <div className="border border-dashed border-border rounded-xl p-12 text-center bg-muted/10">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-primary/70" />
                </div>
                <h3 className="text-lg font-medium mb-2">{t("projects.noFields")}</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {t("projects.noFieldsDesc")}
                </p>
                <Button onClick={openAddFieldDialog} variant="secondary" className="gap-1 rounded-full px-6">
                  <Plus className="h-4 w-4" />
                  {t("projects.addFirstField")}
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-xl">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-medium">{t("projects.fieldName")}</TableHead>
                      <TableHead className="font-medium">{t("projects.label")}</TableHead>
                      <TableHead className="font-medium">{t("projects.type")}</TableHead>
                      <TableHead className="font-medium">{t("projects.required")}</TableHead>
                      <TableHead className="text-right font-medium">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formFields && Array.isArray(formFields) ? formFields.map((field, index) => (
                      <TableRow key={field.id || index}>
                        <TableCell className="font-semibold">{field.name}</TableCell>
                        <TableCell>{field.label}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-full">
                            {field.fieldType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {field.required ? 
                            <Check className="h-5 w-5 text-green-500" /> : 
                            <X className="h-5 w-5 text-muted-foreground" />
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full"
                              onClick={() => moveFieldUp(index)}
                              disabled={index === 0}
                            >
                              <MoveUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full"
                              onClick={() => moveFieldDown(index)}
                              disabled={index === formFields.length - 1}
                            >
                              <MoveDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full"
                              onClick={() => openEditFieldDialog(index)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="rounded-full text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t("projects.deleteField")}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t("projects.deleteFieldConfirm", { name: field.name })}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-full">{t("common.cancel")}</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteField(index)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full"
                                  >
                                    {t("common.delete")}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {/* Save fields action */}
            {formFields.length > 0 && (
              <div className="py-4">
                <Button 
                  variant="outline" 
                  onClick={() => updateFieldsMutation.mutate(formFields)}
                  className="gap-1 rounded-full border-primary/30 text-primary"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {t("projects.saveFields")}
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("projects.saveFieldsDesc")}
                </p>
              </div>
            )}
            
            {/* Field edit dialog */}
            <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
              <DialogContent className="sm:max-w-[500px] rounded-xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingFieldIndex !== null ? t("projects.editField") : t("projects.addField")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("projects.editFieldDesc")}
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...fieldForm}>
                  <form onSubmit={fieldForm.handleSubmit(addOrUpdateField)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={fieldForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("projects.fieldName")}</FormLabel>
                            <FormControl>
                              <Input placeholder="firstName" className="rounded-lg" {...field} />
                            </FormControl>
                            <FormDescription>
                              {t("projects.fieldNameDesc")}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={fieldForm.control}
                        name="label"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("projects.label")}</FormLabel>
                            <FormControl>
                              <Input placeholder="First Name" className="rounded-lg" {...field} />
                            </FormControl>
                            <FormDescription>
                              {t("projects.labelDesc")}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={fieldForm.control}
                        name="fieldType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("projects.fieldType")}</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="rounded-lg">
                                  <SelectValue placeholder={t("projects.selectType")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="date">Date</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="tel">Phone</SelectItem>
                                <SelectItem value="checkbox">Checkbox</SelectItem>
                                <SelectItem value="radio">Radio</SelectItem>
                                <SelectItem value="select">Select</SelectItem>
                                <SelectItem value="textarea">Textarea</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={fieldForm.control}
                        name="required"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between p-3 shadow-sm rounded-lg border mt-8">
                            <div className="space-y-0.5">
                              <FormLabel>{t("projects.required")}</FormLabel>
                              <FormDescription className="text-xs">
                                {t("projects.requiredDesc")}
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {(fieldForm.watch("fieldType") === "radio" || 
                      fieldForm.watch("fieldType") === "select" || 
                      fieldForm.watch("fieldType") === "checkbox") && (
                      <FormField
                        control={fieldForm.control}
                        name="options"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("projects.options")}</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="option1, option2, option3"
                                className="rounded-lg"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              {t("projects.optionsDesc")}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={fieldForm.control}
                        name="defaultValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("projects.defaultValue")}</FormLabel>
                            <FormControl>
                              <Input className="rounded-lg" {...field} />
                            </FormControl>
                            <FormDescription>
                              {t("projects.defaultValueDesc")}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={fieldForm.control}
                        name="placeholder"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("projects.placeholder")}</FormLabel>
                            <FormControl>
                              <Input className="rounded-lg" {...field} />
                            </FormControl>
                            <FormDescription>
                              {t("projects.placeholderDesc")}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsFieldDialogOpen(false)}
                        className="rounded-full"
                      >
                        {t("common.cancel")}
                      </Button>
                      <Button type="submit" className="rounded-full">
                        {editingFieldIndex !== null ? t("common.update") : t("common.add")}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            {/* Form actions */}
            <div className="flex justify-between pt-4 border-t border-border/30">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(2)}
                className="rounded-sm px-6 paper-button"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                {t("projects.previous")}
              </Button>
              
              <Button
                onClick={onFieldsSubmit}
                disabled={formFields.length === 0 || updateFieldsMutation.isPending}
                className="gap-1 rounded-sm px-6 shadow-sm hover:shadow transition-shadow paper-button"
              >
                {updateFieldsMutation.isPending && <Loader2 className="h-5 w-5 animate-spin" />}
                {t("projects.continue")}
                <ArrowRight className="h-5 w-5 ml-1" />
              </Button>
            </div>
          </div>
        );
      
      case 4: // Test the form with a document
        return (
          <div className="space-y-8">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FlaskConical className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{t("projects.testProject")}</h2>
                <p className="text-muted-foreground text-sm mt-1">{t("projects.testProjectDesc")}</p>
              </div>
            </div>
            
            {/* Step instructions */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">{t("projects.uploadTest")}</h3>
              <p className="text-muted-foreground">
                {t("projects.uploadTestDesc")}
              </p>
            </div>
            
            {/* Upload component */}
            <ImageUpload
              onImageUpload={handleTestUpload}
              description={t("projects.dragAndDropTest")}
              isProcessing={processTestMutation.isPending}
            />
            
            {/* Loading state */}
            {processTestMutation.isPending && (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                <h3 className="text-lg font-medium">{t("projects.processing")}</h3>
                <p className="text-muted-foreground text-sm text-center mt-1">
                  {t("projects.processingDesc")}
                </p>
              </div>
            )}
            
            {/* Form actions */}
            <div className="flex justify-between pt-4 border-t border-border/30">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(3)}
                className="rounded-sm px-6 paper-button"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                {t("projects.previous")}
              </Button>
              
              <Button
                onClick={() => setCurrentStep(5)}
                className="gap-1 rounded-sm px-6 shadow-sm hover:shadow transition-shadow paper-button"
              >
                {t("projects.skipTest")}
                <ArrowRight className="h-5 w-5 ml-1" />
              </Button>
            </div>
          </div>
        );
      
      case 5: // Deploy project
        return (
          <div className="space-y-8">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{t("projects.deployProject")}</h2>
                <p className="text-muted-foreground text-sm mt-1">{t("projects.deployProjectDesc")}</p>
              </div>
            </div>
            
            {/* Test results section */}
            {processedResult && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium">{t("projects.testResults")}</h3>
                <p className="text-muted-foreground mb-4">
                  {t("results.comparison")}
                </p>
                
                <div className="overflow-x-auto border rounded-xl">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-medium">{t("projects.fieldName")}</TableHead>
                        <TableHead className="font-medium">{t("results.geminiResult")}</TableHead>
                        <TableHead className="font-medium">{t("results.openaiResult")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parseExtractedFields(processedResult).map((field, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-semibold">{field.name}</TableCell>
                          <TableCell>{field.geminiValue || '-'}</TableCell>
                          <TableCell>{field.openaiValue || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Model selection */}
                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                  <Button 
                    onClick={() => selectModelMutation.mutate({
                      resultId: Number(processedResult?.id),
                      model: "gemini"
                    })}
                    variant="outline"
                    className="flex-1 border-primary/40 bg-background hover:bg-primary/5 text-primary/90 rounded-sm h-12 paper-button"
                  >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    {t("results.useGemini")}
                  </Button>
                  <Button 
                    onClick={() => selectModelMutation.mutate({
                      resultId: Number(processedResult?.id),
                      model: "openai"
                    })}
                    variant="outline"
                    className="flex-1 border-secondary/40 bg-background hover:bg-secondary/5 text-secondary rounded-sm h-12 paper-button"
                  >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    {t("results.useOpenAI")}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Deployment section */}
            <div className="mt-8 paper-gradient paper-card border border-primary/20 p-8">
              <div className="flex gap-6 items-start">
                <div className="bg-background rounded-sm h-16 w-16 flex items-center justify-center shrink-0 shadow-sm border border-primary/20 paper-icon-container">
                  <CheckCircle className="h-9 w-9 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>{t("projects.readyForDeployment")}</h3>
                  <p className="text-muted-foreground mb-6 max-w-2xl">
                    {t("projects.readyForDeploymentDesc")}
                  </p>
                  
                  <div className="flex flex-wrap gap-4">
                    <Button
                      onClick={() => navigate(`/projects/${id}/deploy`)}
                      className="gap-1 px-6 rounded-sm h-12 shadow-sm hover:shadow transition-shadow paper-button"
                      size="lg"
                    >
                      <UploadCloud className="h-5 w-5 mr-1" />
                      {t("projects.startDeployment")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(4)}
                      className="gap-1 px-6 rounded-sm h-12 paper-button"
                      size="lg"
                    >
                      <FlaskConical className="h-5 w-5 mr-1" />
                      {t("projects.runMoreTests")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Form actions */}
            <div className="flex justify-between pt-4 border-t border-border/30">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(4)}
                className="rounded-sm px-6 paper-button"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                {t("projects.previous")}
              </Button>
              
              <Button
                variant="default"
                onClick={() => navigate("/dashboard")}
                className="rounded-sm px-6 paper-button"
              >
                {t("projects.backToDashboard")}
              </Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Progress indicators for the multi-step process
  const renderProgress = () => {
    const steps = [
      { id: 1, name: t("projects.basicInformation"), icon: FileText },
      { id: 2, name: t("projects.defineFields"), icon: ClipboardCheck },
      { id: 3, name: t("projects.editFields"), icon: Pencil },
      { id: 4, name: t("projects.testProject"), icon: FlaskConical },
      { id: 5, name: t("projects.deployProject"), icon: Upload },
    ];
    
    return (
      <nav aria-label="Progress">
        <ol className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {steps.map((step, index) => {
            // Determine step status
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            const isPending = step.id > currentStep;
            
            // Define connected line styles
            const showLine = index < steps.length - 1;
            
            return (
              <li key={step.id} className="relative">
                <div className="flex flex-col items-center group">
                  {/* Step connector line */}
                  {showLine && (
                    <div 
                      className={`absolute top-5 left-[calc(50%+12px)] h-0.5 w-[calc(100%-24px)] md:w-[calc(100%-30px)] border-t
                      ${isCompleted ? "border-primary/60" : "border-border/60"}`}
                      aria-hidden="true"
                      style={{ borderStyle: 'dashed' }}
                    />
                  )}
                  
                  {/* Step indicator */}
                  <button
                    className={`flex items-center justify-center h-10 w-10 rounded-sm shadow-sm border
                    ${isActive 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : isCompleted 
                      ? "bg-primary/20 text-primary border-primary/30" 
                      : "bg-background text-muted-foreground border-border/60"}
                    relative z-10 transition-all duration-200 paper-button`}
                    onClick={() => {
                      if (step.id <= currentStep) {
                        setCurrentStep(step.id);
                      }
                    }}
                    disabled={isPending}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </button>
                  
                  {/* Step label */}
                  <div className="mt-2 text-center">
                    <span 
                      className={`text-sm font-medium 
                      ${isActive 
                        ? "text-primary" 
                        : isCompleted 
                        ? "text-foreground" 
                        : "text-muted-foreground"}`}
                    >
                      {step.name}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero section with paper-like texture */}
        <div className="paper-hero bg-primary/5 pt-28 pb-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col">
              <Button 
                variant="ghost" 
                onClick={goBack} 
                className="gap-1 w-fit rounded-sm hover:bg-background/80 mb-6 -ml-2 paper-button"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("common.back")}
              </Button>
              
              <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                {isNewProject ? t("projects.createNew") : project?.name || ""}
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                {isNewProject ? t("projects.defineNewProject") : t("projects.updateProjectDetails")}
              </p>
            </div>
          </div>
        </div>
        
        {/* Sticky progress indicator */}
        <div className="sticky top-16 z-10 bg-background/95 backdrop-blur-sm border-b border-border/40 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            {renderProgress()}
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {renderStepContent()}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}