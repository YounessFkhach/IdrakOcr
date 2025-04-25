import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { AlarmClockCheck, Languages, ChevronDown, LogOut } from "lucide-react";

export function Navbar() {
  const { user, logoutMutation } = useAuth();
  const { language, setLanguage, availableLanguages } = useLanguage();
  const { t } = useTranslation();
  const [location] = useLocation();

  const isHomePage = location === "/";
  const isActive = (path: string) => location === path;
  
  return (
    <nav className="bg-card/80 backdrop-blur-sm shadow-md fixed w-full z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="flex items-center">
                <AlarmClockCheck className="h-6 w-6 text-primary mr-2" />
                <span className="font-bold text-xl">OmniScan AI</span>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {isHomePage ? (
                <>
                  <a href="#home" className="relative text-foreground px-3 py-2 text-sm font-medium after:absolute after:w-full after:h-0.5 after:bg-primary after:bottom-0 after:left-0">
                    {t("nav.home")}
                  </a>
                  <a href="#features" className="relative text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium after:absolute after:w-0 after:h-0.5 after:bg-primary after:bottom-0 after:left-0 hover:after:w-full after:transition-all">
                    {t("nav.features")}
                  </a>
                  <a href="#workflow" className="relative text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium after:absolute after:w-0 after:h-0.5 after:bg-primary after:bottom-0 after:left-0 hover:after:w-full after:transition-all">
                    {t("nav.howItWorks")}
                  </a>
                  <a href="#pricing" className="relative text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium after:absolute after:w-0 after:h-0.5 after:bg-primary after:bottom-0 after:left-0 hover:after:w-full after:transition-all">
                    {t("nav.pricing")}
                  </a>
                </>
              ) : (
                user && (
                  <>
                    <Link href="/dashboard" className={`relative px-3 py-2 text-sm font-medium after:absolute after:h-0.5 after:bg-primary after:bottom-0 after:left-0 after:transition-all ${isActive('/dashboard') ? 'text-foreground after:w-full' : 'text-muted-foreground hover:text-foreground after:w-0 hover:after:w-full'}`}>
                      {t("nav.dashboard")}
                    </Link>
                  </>
                )
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-1 text-muted-foreground">
                  <Languages className="h-4 w-4" />
                  <span className="uppercase">{language}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {availableLanguages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={language === lang.code ? "bg-primary/10 text-primary" : ""}
                  >
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm hidden md:inline">{user.name || user.username}</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  {t("auth.logout")}
                </Button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link href="/auth">
                  <Button variant="outline" size="sm">{t("auth.login")}</Button>
                </Link>
                <Link href="/auth">
                  <Button size="sm">{t("auth.signup")}</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
