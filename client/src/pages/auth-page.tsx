import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { registerSchema, loginSchema } from "@shared/schema";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { ChevronRight, AlarmClockCheck, Binary, Eye, EyeOff } from "lucide-react";

export default function AuthPage() {
  const { t } = useTranslation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  
  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      name: "",
    },
  });
  
  // Redirect if already logged in - IMPORTANT: all hooks must be called before this return
  if (user) {
    return <Redirect to="/dashboard" />;
  }
  
  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(values);
  };
  
  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(values);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Auth Forms */}
          <div className="flex flex-col justify-center">
            <Tabs defaultValue="login" value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">{t("auth.login")}</TabsTrigger>
                <TabsTrigger value="register">{t("auth.signup")}</TabsTrigger>
              </TabsList>
              
              {/* Login Form */}
              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("auth.welcomeBack")}</CardTitle>
                    <CardDescription>{t("auth.loginDescription")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("auth.username")}</FormLabel>
                              <FormControl>
                                <Input placeholder={t("auth.usernamePlaceholder")} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("auth.password")}</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder={t("auth.passwordPlaceholder")} 
                                    {...field} 
                                  />
                                  <button 
                                    type="button"
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end">
                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={loginMutation.isPending}
                          >
                            {loginMutation.isPending ? t("auth.loggingIn") : t("auth.login")}
                          </Button>
                        </div>
                      </form>
                    </Form>
                    
                    <div className="mt-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        {t("auth.noAccount")}{" "}
                        <Button 
                          variant="link" 
                          className="p-0" 
                          onClick={() => setActiveTab("register")}
                        >
                          {t("auth.createAccount")}
                        </Button>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Register Form */}
              <TabsContent value="register">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("auth.createYourAccount")}</CardTitle>
                    <CardDescription>{t("auth.registerDescription")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("auth.username")}</FormLabel>
                              <FormControl>
                                <Input placeholder={t("auth.usernamePlaceholder")} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("auth.email")}</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  placeholder={t("auth.emailPlaceholder")} 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("auth.name")}</FormLabel>
                              <FormControl>
                                <Input placeholder={t("auth.namePlaceholder")} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("auth.password")}</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder={t("auth.passwordPlaceholder")} 
                                    {...field} 
                                  />
                                  <button 
                                    type="button"
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end">
                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={registerMutation.isPending}
                          >
                            {registerMutation.isPending ? t("auth.creating") : t("auth.createAccount")}
                          </Button>
                        </div>
                      </form>
                    </Form>
                    
                    <div className="mt-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        {t("auth.alreadyHaveAccount")}{" "}
                        <Button 
                          variant="link" 
                          className="p-0" 
                          onClick={() => setActiveTab("login")}
                        >
                          {t("auth.login")}
                        </Button>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Hero Section */}
          <div className="relative hidden md:block">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/20 rounded-full filter blur-3xl"></div>
            <Card className="relative bg-background/60 backdrop-blur-sm h-full flex flex-col justify-center p-8">
              <CardContent className="space-y-6">
                <div className="flex gap-4 items-center">
                  <div className="p-3 rounded-full bg-primary/10">
                    <AlarmClockCheck className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{t("auth.hero.dualAI")}</h3>
                    <p className="text-muted-foreground">{t("auth.hero.dualAIDesc")}</p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-center">
                  <div className="p-3 rounded-full bg-secondary/10">
                    <Binary className="h-8 w-8 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{t("auth.hero.accuracy")}</h3>
                    <p className="text-muted-foreground">{t("auth.hero.accuracyDesc")}</p>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-muted mt-6">
                  <blockquote className="italic text-muted-foreground">
                    "{t("auth.hero.testimonial")}"
                  </blockquote>
                  <div className="flex items-center mt-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="font-medium">JD</span>
                    </div>
                    <div className="ml-4">
                      <p className="font-medium">Jane Doe</p>
                      <p className="text-muted-foreground text-sm">CTO, TechCorp</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <div className="mt-auto flex justify-end">
                <Button variant="ghost" className="gap-1" asChild>
                  <a href="/">
                    {t("auth.hero.learnMore")} <ChevronRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
