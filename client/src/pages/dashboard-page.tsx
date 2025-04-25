import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  LayoutGrid,
  FilePlus,
  PlusCircle,
  MoreVertical,
  FileText,
  Edit,
  Trash2,
  ArrowUpRight,
} from "lucide-react";

export default function DashboardPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [deleteProjectId, setDeleteProjectId] = useState<number | null>(null);

  // Fetch projects
  const { data: projects, isLoading, error } = useQuery<Project[], Error>({
    queryKey: ["/api/projects"],
  });

  const handleDeleteProject = async () => {
    if (!deleteProjectId) return;
    
    try {
      await apiRequest("DELETE", `/api/projects/${deleteProjectId}`);
      
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      
      toast({
        title: t("projects.deleteSuccess"),
        description: t("projects.projectDeleted"),
      });
      
      setDeleteProjectId(null);
    } catch (error) {
      toast({
        title: t("projects.deleteFailed"),
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero section with gradient background */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background pt-28 pb-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-3">{t("dashboard.myProjects")}</h1>
                <p className="text-muted-foreground max-w-2xl">{t("dashboard.manageProjects")}</p>
              </div>
              <div className="mt-6 md:mt-0">
                <Button asChild size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-shadow">
                  <Link href="/projects/new">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    {t("dashboard.newProject")}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content area with elevated cards */}
        <div className="container mx-auto px-4 py-8 -mt-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, index) => (
                <Card key={index} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow rounded-xl">
                  <CardContent className="p-0">
                    <div className="h-3 bg-primary/20 w-full"></div>
                    <div className="p-6">
                      <div className="h-7 w-3/4 bg-muted rounded-full animate-pulse mb-4"></div>
                      <div className="h-16 w-full bg-muted rounded-lg animate-pulse mb-6"></div>
                      <div className="flex items-center justify-between">
                        <div className="h-5 w-1/3 bg-muted rounded-full animate-pulse"></div>
                        <div className="h-9 w-1/4 bg-muted rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="bg-destructive/10 text-destructive p-6 rounded-xl shadow-md max-w-2xl mx-auto">
              <p className="font-medium mb-3">{t("dashboard.errorLoading")}: {error.message}</p>
              <Button 
                variant="outline" 
                className="mt-2 rounded-full"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/projects"] })}
              >
                {t("common.retry")}
              </Button>
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="overflow-hidden shadow-md hover:shadow-lg transition-all rounded-xl hover:translate-y-[-2px]">
                  <CardContent className="p-0">
                    {/* Status indicator strip on top */}
                    <div className={`h-2 w-full ${
                      project.status === "complete" 
                        ? "bg-green-500/80" 
                        : project.status === "field_editing" || project.status === "field_detection"
                        ? "bg-yellow-500/80"
                        : "bg-primary/80"
                    }`}></div>
                    
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-medium truncate">{project.name}</h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">{t("common.actions")}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem asChild className="rounded-lg">
                              <Link href={`/projects/${project.id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>{t("projects.edit")}</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="rounded-lg">
                              <Link href={`/projects/${project.id}/test`}>
                                <FileText className="mr-2 h-4 w-4" />
                                <span>{t("projects.test")}</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive rounded-lg"
                              onClick={() => setDeleteProjectId(project.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>{t("projects.delete")}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-muted-foreground mb-6 line-clamp-2">
                        {project.description || t("projects.noDescription")}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-muted-foreground bg-muted/50 py-1 px-3 rounded-full">
                          {project.status && (
                            <div className="flex items-center">
                              <span className={`h-2 w-2 rounded-full mr-2 ${
                                project.status === "complete" 
                                  ? "bg-green-500" 
                                  : project.status === "field_editing" || project.status === "field_detection"
                                  ? "bg-yellow-500"
                                  : "bg-primary"
                              }`}></span>
                              <span>{project.status === "draft" 
                                ? t("projects.statusDraft") 
                                : project.status === "field_detection"
                                ? t("projects.statusDetection")
                                : project.status === "field_editing"
                                ? t("projects.statusEditing")
                                : t("projects.statusComplete")
                              }</span>
                            </div>
                          )}
                        </div>
                        
                        <Link href={
                          project.status === "complete" 
                            ? `/projects/${project.id}/deploy` 
                            : `/projects/${project.id}`
                        }>
                          <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 rounded-full">
                            <span>{
                              project.status === "complete" 
                                ? t("projects.openDeploy") 
                                : t("projects.continue")
                            }</span>
                            <ArrowUpRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Create New Project Card */}
              <Card className="overflow-hidden shadow-md hover:shadow-lg transition-all rounded-xl hover:translate-y-[-2px] border-2 border-dashed border-primary/20 hover:border-primary/40">
                <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[240px]">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <FilePlus className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground text-center mb-5 font-medium">{t("dashboard.createNewProject")}</p>
                  <Button variant="secondary" asChild className="rounded-full px-6">
                    <Link href="/projects/new">{t("dashboard.createProject")}</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-16 max-w-md mx-auto">
              <div className="inline-flex items-center justify-center p-6 rounded-full bg-primary/10 mb-6">
                <LayoutGrid className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-2xl font-medium mb-3">{t("dashboard.noProjects")}</h3>
              <p className="text-muted-foreground mb-8">{t("dashboard.noProjectsDescription")}</p>
              <Button asChild size="lg" className="rounded-full px-8 shadow-lg hover:shadow-xl transition-shadow">
                <Link href="/projects/new">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  {t("dashboard.createFirstProject")}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </main>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteProjectId}
        onOpenChange={(open) => {
          if (!open) setDeleteProjectId(null);
        }}
      >
        <DialogContent className="rounded-xl sm:max-w-md">
          <DialogHeader className="gap-1">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-2">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center text-xl">{t("projects.confirmDelete")}</DialogTitle>
            <DialogDescription className="text-center">
              {t("projects.deleteWarning")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row-reverse gap-2 sm:gap-3 mt-6">
            <Button
              variant="destructive"
              className="rounded-full"
              onClick={handleDeleteProject}
            >
              {t("projects.delete")}
            </Button>
            <Button 
              variant="outline" 
              className="rounded-full" 
              onClick={() => setDeleteProjectId(null)}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}
