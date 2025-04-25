import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import {
  AlarmClockCheck,
  Bolt,
  Diff,
  Code,
  Layers,
  Languages as LanguageIcon,
  ArrowRight,
  CheckCircle,
  PlayCircle,
  BadgeCheck,
  Sparkles
} from "lucide-react";

export default function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <div id="home" className="relative pt-32 pb-16 overflow-hidden">
        <div className="hero-blob"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 mb-12 lg:mb-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                {t("home.hero.title.part1")} <span className="gradient-text">{t("home.hero.title.part2")}</span>
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl mb-8">
                {t("home.hero.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <Link href={user ? "/dashboard" : "/auth"}>
                  <Button size="lg" className="w-full sm:w-auto">{t("home.hero.getStarted")}</Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
                  <a href="#demo">{t("home.hero.seeDemo")}</a>
                </Button>
              </div>
            </div>
            <div className="lg:w-1/2 flex justify-center">
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1581092921461-7d6ed977abc9?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" 
                  alt="AI data processing visualization" 
                  className="rounded-2xl shadow-lg w-full max-w-lg" 
                />
                <div className="absolute -bottom-6 -right-6 bg-card p-3 rounded-xl shadow-md flex items-center">
                  <BadgeCheck className="text-primary mr-2 h-5 w-5" />
                  <span className="text-sm font-medium">99.8% {t("home.hero.accuracy")}</span>
                </div>
                <div className="absolute -top-6 -left-6 bg-card p-3 rounded-xl shadow-md flex items-center">
                  <Bolt className="text-secondary mr-2 h-5 w-5" />
                  <span className="text-sm font-medium">{t("home.hero.dualAI")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div id="features" className="py-16 bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("home.features.title")}</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              {t("home.features.subtitle")}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="material-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-primary bg-opacity-20 rounded-full mb-4">
                  <AlarmClockCheck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-medium mb-2">{t("home.features.dualAI.title")}</h3>
                <p className="text-muted-foreground">
                  {t("home.features.dualAI.description")}
                </p>
              </CardContent>
            </Card>
            
            {/* Feature 2 */}
            <Card className="material-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-secondary bg-opacity-20 rounded-full mb-4">
                  <Diff className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-xl font-medium mb-2">{t("home.features.comparison.title")}</h3>
                <p className="text-muted-foreground">
                  {t("home.features.comparison.description")}
                </p>
              </CardContent>
            </Card>
            
            {/* Feature 3 */}
            <Card className="material-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-primary bg-opacity-20 rounded-full mb-4">
                  <Code className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-medium mb-2">{t("home.features.customPrompts.title")}</h3>
                <p className="text-muted-foreground">
                  {t("home.features.customPrompts.description")}
                </p>
              </CardContent>
            </Card>
            
            {/* Feature 4 */}
            <Card className="material-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-secondary bg-opacity-20 rounded-full mb-4">
                  <Bolt className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-xl font-medium mb-2">{t("home.features.batch.title")}</h3>
                <p className="text-muted-foreground">
                  {t("home.features.batch.description")}
                </p>
              </CardContent>
            </Card>
            
            {/* Feature 5 */}
            <Card className="material-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-primary bg-opacity-20 rounded-full mb-4">
                  <Layers className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-medium mb-2">{t("home.features.structured.title")}</h3>
                <p className="text-muted-foreground">
                  {t("home.features.structured.description")}
                </p>
              </CardContent>
            </Card>
            
            {/* Feature 6 */}
            <Card className="material-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-secondary bg-opacity-20 rounded-full mb-4">
                  <LanguageIcon className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-xl font-medium mb-2">{t("home.features.multilingual.title")}</h3>
                <p className="text-muted-foreground">
                  {t("home.features.multilingual.description")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Workflow Section */}
      <div id="workflow" className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("home.workflow.title")}</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              {t("home.workflow.subtitle")}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1 */}
            <Card className="material-card relative">
              <CardContent className="p-6 pt-10">
                <div className="absolute -top-4 -left-4 flex items-center justify-center w-10 h-10 bg-primary rounded-full text-primary-foreground font-bold z-10">1</div>
                <div className="pt-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4 mx-auto">
                    <Layers className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium text-center mb-2">{t("home.workflow.step1.title")}</h3>
                  <p className="text-muted-foreground text-center text-sm">
                    {t("home.workflow.step1.description")}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Step 2 */}
            <Card className="material-card relative">
              <CardContent className="p-6 pt-10">
                <div className="absolute -top-4 -left-4 flex items-center justify-center w-10 h-10 bg-primary rounded-full text-primary-foreground font-bold z-10">2</div>
                <div className="pt-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4 mx-auto">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium text-center mb-2">{t("home.workflow.step2.title")}</h3>
                  <p className="text-muted-foreground text-center text-sm">
                    {t("home.workflow.step2.description")}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Step 3 */}
            <Card className="material-card relative">
              <CardContent className="p-6 pt-10">
                <div className="absolute -top-4 -left-4 flex items-center justify-center w-10 h-10 bg-primary rounded-full text-primary-foreground font-bold z-10">3</div>
                <div className="pt-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4 mx-auto">
                    <Diff className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium text-center mb-2">{t("home.workflow.step3.title")}</h3>
                  <p className="text-muted-foreground text-center text-sm">
                    {t("home.workflow.step3.description")}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Step 4 */}
            <Card className="material-card relative">
              <CardContent className="p-6 pt-10">
                <div className="absolute -top-4 -left-4 flex items-center justify-center w-10 h-10 bg-primary rounded-full text-primary-foreground font-bold z-10">4</div>
                <div className="pt-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4 mx-auto">
                    <Bolt className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium text-center mb-2">{t("home.workflow.step4.title")}</h3>
                  <p className="text-muted-foreground text-center text-sm">
                    {t("home.workflow.step4.description")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Illustration */}
          <div className="mt-16 flex justify-center">
            <img 
              src="https://images.unsplash.com/photo-1542879379-a94580fc495c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" 
              alt="AI workflow process illustration" 
              className="rounded-2xl shadow-lg max-w-full md:max-w-3xl" 
            />
          </div>
        </div>
      </div>
      
      {/* Pricing Section */}
      <div id="pricing" className="py-16 bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("home.pricing.title")}</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              {t("home.pricing.subtitle")}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <Card className="material-card flex flex-col">
              <CardContent className="p-6 flex-grow">
                <div className="flex-grow">
                  <h3 className="text-2xl font-medium mb-2">{t("home.pricing.starter.title")}</h3>
                  <div className="flex items-baseline mb-6">
                    <span className="text-3xl font-bold">{t("home.pricing.starter.price")}</span>
                    <span className="text-muted-foreground ml-1">{t("home.pricing.monthly")}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-primary mt-1 mr-2" />
                      <span>{t("home.pricing.starter.feature1")}</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-primary mt-1 mr-2" />
                      <span>{t("home.pricing.starter.feature2")}</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-primary mt-1 mr-2" />
                      <span>{t("home.pricing.starter.feature3")}</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-muted mt-1 mr-2" />
                      <span className="text-muted-foreground">{t("home.pricing.starter.feature4")}</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-muted mt-1 mr-2" />
                      <span className="text-muted-foreground">{t("home.pricing.starter.feature5")}</span>
                    </li>
                  </ul>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/auth">{t("home.pricing.choosePlan")}</Link>
                </Button>
              </CardContent>
            </Card>
            
            {/* Pro Plan */}
            <Card className="material-card flex flex-col relative transform scale-105 z-10 border-2 border-primary shadow-lg">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground py-1 px-4 rounded-full text-sm font-medium">
                {t("home.pricing.mostPopular")}
              </div>
              <CardContent className="p-6 flex-grow">
                <div className="flex-grow">
                  <h3 className="text-2xl font-medium mb-2">{t("home.pricing.pro.title")}</h3>
                  <div className="flex items-baseline mb-6">
                    <span className="text-3xl font-bold">{t("home.pricing.pro.price")}</span>
                    <span className="text-muted-foreground ml-1">{t("home.pricing.monthly")}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-primary mt-1 mr-2" />
                      <span>{t("home.pricing.pro.feature1")}</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-primary mt-1 mr-2" />
                      <span>{t("home.pricing.pro.feature2")}</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-primary mt-1 mr-2" />
                      <span>{t("home.pricing.pro.feature3")}</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-primary mt-1 mr-2" />
                      <span>{t("home.pricing.pro.feature4")}</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-muted mt-1 mr-2" />
                      <span className="text-muted-foreground">{t("home.pricing.pro.feature5")}</span>
                    </li>
                  </ul>
                </div>
                <Button className="w-full" asChild>
                  <Link href="/auth">{t("home.pricing.choosePlan")}</Link>
                </Button>
              </CardContent>
            </Card>
            
            {/* Enterprise Plan */}
            <Card className="material-card flex flex-col">
              <CardContent className="p-6 flex-grow">
                <div className="flex-grow">
                  <h3 className="text-2xl font-medium mb-2">{t("home.pricing.enterprise.title")}</h3>
                  <div className="flex items-baseline mb-6">
                    <span className="text-3xl font-bold">{t("home.pricing.enterprise.price")}</span>
                    <span className="text-muted-foreground ml-1">{t("home.pricing.monthly")}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-primary mt-1 mr-2" />
                      <span>{t("home.pricing.enterprise.feature1")}</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-primary mt-1 mr-2" />
                      <span>{t("home.pricing.enterprise.feature2")}</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-primary mt-1 mr-2" />
                      <span>{t("home.pricing.enterprise.feature3")}</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-primary mt-1 mr-2" />
                      <span>{t("home.pricing.enterprise.feature4")}</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-primary mt-1 mr-2" />
                      <span>{t("home.pricing.enterprise.feature5")}</span>
                    </li>
                  </ul>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/auth">{t("home.pricing.choosePlan")}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Demo Section */}
      <div id="demo" className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("home.demo.title")}</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              {t("home.demo.subtitle")}
            </p>
          </div>
          
          <div className="bg-card rounded-2xl shadow-lg overflow-hidden max-w-5xl mx-auto">
            <div className="aspect-w-16 aspect-h-9 relative bg-muted flex items-center justify-center">
              <img 
                src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" 
                alt="Demo video thumbnail" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <Button size="lg" variant="outline" className="rounded-full w-20 h-20 bg-primary hover:bg-primary/90 border-0">
                  <PlayCircle className="h-10 w-10 text-background" />
                </Button>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-medium mb-2">{t("home.demo.videoTitle")}</h3>
              <p className="text-muted-foreground">
                {t("home.demo.videoDescription")}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="py-16 bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-background rounded-2xl shadow-lg p-8 sm:p-12 max-w-5xl mx-auto relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-10 rounded-full transform translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary opacity-10 rounded-full transform -translate-x-1/3 translate-y-1/3"></div>
            
            <div className="relative z-10">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("home.cta.title")}</h2>
                <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
                  {t("home.cta.subtitle")}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Button size="lg" className="px-8 py-6 text-lg" asChild>
                  <Link href="/auth">{t("home.cta.startTrial")}</Link>
                </Button>
                <Button variant="outline" size="lg" className="px-8 py-6 text-lg" asChild>
                  <a href="#contact">{t("home.cta.contactSales")}</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
