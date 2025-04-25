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
  const parseExtractedFields = (result: any) => {
    if (!result) return [];
    
    // Parse Gemini and OpenAI results
    const geminiData = parseJsonResult(result.geminiResult);
    const openaiData = parseJsonResult(result.openaiResult);
    
    // Get all unique field names
    const fieldNames = new Set([
      ...Object.keys(geminiData || {}),
      ...Object.keys(openaiData || {})
    ]);
    
    // Create comparison rows
    return Array.from(fieldNames).map(name => ({
      name,
      geminiValue: (geminiData && geminiData[name] !== undefined) ? 
                   String(geminiData[name]) : null,
      openaiValue: (openaiData && openaiData[name] !== undefined) ? 
                   String(openaiData[name]) : null
    }));
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
    mutationFn: async ({ id, model }: { id: number, model: string }) => {
      const res = await apiRequest(
        "POST", 
        `/api/projects/${project?.id}/results/${id}/select`, 
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
          <Card>
            <CardHeader>
              <CardTitle>{t("projects.basicInformation")}</CardTitle>
              <CardDescription>{t("projects.basicInfoDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...basicInfoForm}>
                <form id="basic-info-form" onSubmit={basicInfoForm.handleSubmit(onBasicInfoSubmit)} className="space-y-6">
                  <FormField
                    control={basicInfoForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("projects.name")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("projects.namePlaceholder")} {...field} />
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
                        <FormLabel>{t("projects.description")}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t("projects.descriptionPlaceholder")} 
                            rows={3}
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
                        <FormLabel>{t("projects.customPrompt")}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t("projects.customPromptPlaceholder")}
                            rows={5}
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
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={goBack}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                form="basic-info-form"
                disabled={createProjectMutation.isPending}
                className="gap-1"
              >
                {createProjectMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <ArrowRight className="h-4 w-4 ml-1" />
                {t("projects.continue")}
              </Button>
            </CardFooter>
          </Card>
        );
      
      case 2: // Upload example and detect fields
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t("projects.defineFields")}</CardTitle>
              <CardDescription>{t("projects.defineFieldsDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">{t("projects.uploadExample")}</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {t("projects.uploadExampleDesc")}
                  </p>
                  
                  <ImageUpload
                    onImageUpload={handleExampleUpload}
                    title={t("projects.dropExample")}
                    description={t("projects.dragAndDropExample")}
                    isProcessing={detectFieldsMutation.isPending}
                  />
                  
                  {selectedExample && (
                    <div className="mt-4 flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">{selectedExample.name}</span>
                      <span className="text-muted-foreground">
                        ({Math.round(selectedExample.size / 1024)} KB)
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Display detected fields preview after detection */}
                {project && project.status === "field_detection" && formFields.length > 0 && (
                  <div className="mt-6 border rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">{t("projects.detectedFields")}</h3>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {formFields.length} {t("projects.fieldsDetected")}
                      </Badge>
                    </div>
                    
                    <div className="overflow-x-auto border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("projects.fieldName")}</TableHead>
                            <TableHead>{t("projects.label")}</TableHead>
                            <TableHead>{t("projects.type")}</TableHead>
                            <TableHead>{t("projects.required")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formFields.slice(0, 3).map((field, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{field.name}</TableCell>
                              <TableCell>{field.label}</TableCell>
                              <TableCell>{field.fieldType}</TableCell>
                              <TableCell>
                                {field.required ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Minus className="h-4 w-4 text-gray-300" />
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {formFields.length > 3 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {t("projects.andMoreFields", { count: formFields.length - 3 })}
                      </p>
                    )}
                    
                    <div className="mt-4">
                      <Button
                        onClick={() => setCurrentStep(3)}
                        className="gap-1"
                      >
                        <ArrowRight className="h-4 w-4 mr-1" />
                        {t("projects.continueToEditFields")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(1)}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t("projects.previous")}
              </Button>
              <Button
                onClick={onFieldDetectionSubmit}
                disabled={!selectedExample || detectFieldsMutation.isPending}
                className="gap-1"
              >
                {detectFieldsMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <ListChecks className="h-4 w-4 mr-1" />
                {t("projects.detectFields")}
              </Button>
            </CardFooter>
          </Card>
        );
      
      case 3: // Edit detected fields
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t("projects.editFields")}</CardTitle>
              <CardDescription>{t("projects.editFieldsDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">{t("projects.formFields")}</h3>
                  <Button onClick={openAddFieldDialog} size="sm" className="gap-1">
                    <Plus className="h-4 w-4" />
                    {t("projects.addField")}
                  </Button>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  {formFields.length === 0 ? (
                    <div className="p-8 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-1">{t("projects.noFields")}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {t("projects.noFieldsDesc")}
                      </p>
                      <Button onClick={openAddFieldDialog} variant="outline" size="sm" className="gap-1">
                        <Plus className="h-4 w-4" />
                        {t("projects.addFirstField")}
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("projects.fieldName")}</TableHead>
                            <TableHead>{t("projects.label")}</TableHead>
                            <TableHead>{t("projects.type")}</TableHead>
                            <TableHead>{t("projects.required")}</TableHead>
                            <TableHead className="text-right">{t("common.actions")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formFields && Array.isArray(formFields) ? formFields.map((field, index) => (
                            <TableRow key={field.id || index}>
                              <TableCell className="font-medium">{field.name}</TableCell>
                              <TableCell>{field.label}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {field.fieldType}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {field.required ? 
                                  <Check className="h-4 w-4 text-green-500" /> : 
                                  <X className="h-4 w-4 text-muted-foreground" />
                                }
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => moveFieldUp(index)}
                                    disabled={index === 0}
                                  >
                                    <MoveUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => moveFieldDown(index)}
                                    disabled={index === formFields.length - 1}
                                  >
                                    <MoveDown className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEditFieldDialog(index)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
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
                                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteField(index)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
                              <TableCell colSpan={5} className="text-center py-4">
                                {t("projects.noFieldsData")}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Field edit dialog */}
              <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
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
                                <Input placeholder="firstName" {...field} />
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
                                <Input placeholder="First Name" {...field} />
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
                                  <SelectTrigger>
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
                                <Input {...field} />
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
                                <Input {...field} />
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
                        <Button type="button" variant="outline" onClick={() => setIsFieldDialogOpen(false)}>
                          {t("common.cancel")}
                        </Button>
                        <Button type="submit">
                          {editingFieldIndex !== null ? t("common.update") : t("common.add")}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(2)}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t("projects.previous")}
              </Button>
              <Button
                onClick={onFieldsSubmit}
                disabled={formFields.length === 0 || updateFieldsMutation.isPending}
                className="gap-1"
              >
                {updateFieldsMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <ArrowRight className="h-4 w-4 ml-1" />
                {t("projects.continue")}
              </Button>
            </CardFooter>
          </Card>
        );
      
      case 4: // Test the form with a document
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t("projects.testProject")}</CardTitle>
              <CardDescription>{t("projects.testProjectDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">{t("projects.uploadTest")}</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {t("projects.uploadTestDesc")}
                  </p>
                  
                  <ImageUpload
                    onImageUpload={handleTestUpload}
                    title={t("projects.dropTest")}
                    description={t("projects.dragAndDropTest")}
                    isProcessing={processTestMutation.isPending}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(3)}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t("projects.previous")}
              </Button>
              <Button
                onClick={() => setCurrentStep(5)}
                className="gap-1"
              >
                <ArrowRight className="h-4 w-4 ml-1" />
                {t("projects.skipTest")}
              </Button>
            </CardFooter>
          </Card>
        );
      
      case 5: // Deploy project
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t("projects.deployProject")}</CardTitle>
              <CardDescription>{t("projects.deployProjectDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Show the processed result if available */}
                {processedResult && (
                  <div className="border rounded-lg p-6 mb-4">
                    <h3 className="text-lg font-medium mb-4">{t("projects.testResults")}</h3>
                    
                    <div className="mb-4">
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        {t("results.comparison")}
                      </h4>
                      <div className="overflow-x-auto border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t("projects.fieldName")}</TableHead>
                              <TableHead>{t("results.geminiResult")}</TableHead>
                              <TableHead>{t("results.openaiResult")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {parseExtractedFields(processedResult).map((field, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{field.name}</TableCell>
                                <TableCell>{field.geminiValue || '-'}</TableCell>
                                <TableCell>{field.openaiValue || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    
                    {/* Model selection buttons */}
                    <div className="flex gap-4 mt-6">
                      <Button 
                        onClick={() => selectModelMutation.mutate({
                          id: processedResult.id,
                          model: "gemini"
                        })}
                        variant="outline"
                        className="flex-1 border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {t("results.useGemini")}
                      </Button>
                      <Button 
                        onClick={() => selectModelMutation.mutate({
                          id: processedResult.id, 
                          model: "openai"
                        })}
                        variant="outline"
                        className="flex-1 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {t("results.useOpenAI")}
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="bg-primary/10 rounded-lg p-6 flex gap-4">
                  <div className="bg-primary rounded-full h-12 w-12 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1">{t("projects.readyForDeployment")}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t("projects.readyForDeploymentDesc")}
                    </p>
                    
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={() => navigate(`/projects/${id}/deploy`)}
                        className="gap-1"
                      >
                        <UploadCloud className="h-4 w-4 mr-1" />
                        {t("projects.startDeployment")}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(4)}
                      >
                        <FlaskConical className="h-4 w-4 mr-1" />
                        {t("projects.runMoreTests")}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(4)}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t("projects.previous")}
              </Button>
              <Button
                variant="default"
                onClick={() => navigate("/dashboard")}
              >
                {t("projects.backToDashboard")}
              </Button>
            </CardFooter>
          </Card>
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
      <nav aria-label="Progress" className="mb-8">
        <ol className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {steps.map((step) => (
            <li key={step.id} className="relative">
              <button
                className={`group flex w-full items-center ${
                  step.id === currentStep
                    ? "bg-primary text-primary-foreground"
                    : step.id < currentStep
                    ? "bg-primary/20 text-foreground"
                    : "bg-muted text-muted-foreground"
                } rounded-lg px-3 py-2 text-sm font-medium`}
                onClick={() => {
                  if (step.id < currentStep) {
                    setCurrentStep(step.id);
                  }
                }}
                disabled={step.id > currentStep}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border mr-3">
                  <step.icon className="h-4 w-4" />
                </span>
                <span className="text-sm">{step.name}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 pt-24 pb-16">
        <div className="mb-6">
          <Button variant="ghost" onClick={goBack} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </Button>
        </div>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {isNewProject ? t("projects.createNew") : project?.name || ""}
          </h1>
          <p className="text-muted-foreground">
            {isNewProject ? t("projects.defineNewProject") : t("projects.updateProjectDetails")}
          </p>
        </div>
        
        {renderProgress()}
        
        <div className="max-w-3xl mx-auto">
          {renderStepContent()}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}