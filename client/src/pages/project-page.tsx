import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Project, projectFormSchema } from "@shared/schema";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft,
  Loader2,
  Save,
  AlertTriangle,
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

type FormData = z.infer<typeof projectFormSchema>;

export default function ProjectPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isNewProject, setIsNewProject] = useState(!id || id === "new");

  // Fetch project if editing
  const { 
    data: project, 
    isLoading: isLoadingProject, 
    error: projectError 
  } = useQuery<Project>({
    queryKey: [`/api/projects/${id}`],
    enabled: !isNewProject,
  });

  // Form setup
  const form = useForm<FormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      customPrompt: "",
    },
  });

  // Update form with project data when loaded
  useEffect(() => {
    if (project && !isNewProject) {
      form.reset({
        name: project.name,
        description: project.description || "",
        customPrompt: project.customPrompt || "",
      });
    }
  }, [project, form, isNewProject]);

  // Handle create/update project
  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isNewProject) {
        const res = await apiRequest("POST", "/api/projects", data);
        return await res.json();
      } else {
        const res = await apiRequest("PUT", `/api/projects/${id}`, data);
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
      
      // For new projects, navigate to the test page
      if (isNewProject) {
        navigate(`/projects/${data.id}/test`);
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

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  // Return to dashboard
  const goBack = () => {
    navigate("/dashboard");
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
            {isNewProject ? t("projects.createNew") : t("projects.editProject")}
          </h1>
          <p className="text-muted-foreground">
            {isNewProject ? t("projects.defineNewProject") : t("projects.updateProjectDetails")}
          </p>
        </div>
        
        {isLoadingProject && !isNewProject ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : projectError && !isNewProject ? (
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
        ) : (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
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
                      control={form.control}
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
                      control={form.control}
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
                    
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 justify-end pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={goBack}
                      >
                        {t("common.cancel")}
                      </Button>
                      <Button
                        type="submit"
                        disabled={mutation.isPending}
                        className="gap-1"
                      >
                        {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        <Save className="h-4 w-4 mr-1" />
                        {isNewProject ? t("projects.create") : t("projects.save")}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
