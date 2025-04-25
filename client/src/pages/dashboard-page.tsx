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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 pt-24 pb-16">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t("dashboard.myProjects")}</h1>
            <p className="text-muted-foreground">{t("dashboard.manageProjects")}</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button asChild>
              <Link href="/projects/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t("dashboard.newProject")}
              </Link>
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, index) => (
              <Card key={index} className="material-card">
                <CardContent className="p-6">
                  <div className="h-6 w-3/4 bg-muted rounded animate-pulse mb-4"></div>
                  <div className="h-12 w-full bg-muted rounded animate-pulse mb-6"></div>
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-1/3 bg-muted rounded animate-pulse"></div>
                    <div className="h-4 w-1/4 bg-muted rounded animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
            <p>{t("dashboard.errorLoading")}: {error.message}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/projects"] })}
            >
              {t("common.retry")}
            </Button>
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="material-card">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-medium truncate">{project.name}</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">{t("common.actions")}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/projects/${project.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>{t("projects.edit")}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/projects/${project.id}/test`}>
                            <FileText className="mr-2 h-4 w-4" />
                            <span>{t("projects.test")}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
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
                    <div className="flex items-center text-muted-foreground">
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
                      <Button variant="ghost" size="sm" className="text-primary">
                        <span>{
                          project.status === "complete" 
                            ? t("projects.openDeploy") 
                            : t("projects.continue")
                        }</span>
                        <ArrowUpRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Create New Project Card */}
            <Card className="material-card border-2 border-dashed border-muted hover:border-muted-foreground/50 transition-colors">
              <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[200px]">
                <FilePlus className="h-8 w-8 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center mb-4">{t("dashboard.createNewProject")}</p>
                <Button variant="secondary" asChild>
                  <Link href="/projects/new">{t("dashboard.createProject")}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-muted mb-4">
              <LayoutGrid className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium mb-2">{t("dashboard.noProjects")}</h3>
            <p className="text-muted-foreground mb-6">{t("dashboard.noProjectsDescription")}</p>
            <Button asChild>
              <Link href="/projects/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t("dashboard.createFirstProject")}
              </Link>
            </Button>
          </div>
        )}
      </main>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteProjectId}
        onOpenChange={(open) => {
          if (!open) setDeleteProjectId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("projects.confirmDelete")}</DialogTitle>
            <DialogDescription>
              {t("projects.deleteWarning")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteProjectId(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
            >
              {t("projects.delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}
