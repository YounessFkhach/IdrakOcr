import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { AlarmClockCheck } from "lucide-react";
import { 
  Facebook,
  Twitter,
  Linkedin
} from "lucide-react";

export function Footer() {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-card py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <AlarmClockCheck className="h-5 w-5 text-primary mr-2" />
              <span className="font-bold text-lg">OmniScan AI</span>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              {t("footer.description")}
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-4">{t("footer.product")}</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#features" className="hover:text-primary transition-colors">{t("footer.features")}</a></li>
              <li><a href="#pricing" className="hover:text-primary transition-colors">{t("footer.pricing")}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t("footer.api")}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t("footer.integrations")}</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-4">{t("footer.resources")}</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">{t("footer.documentation")}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t("footer.guides")}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t("footer.blog")}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t("footer.support")}</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-4">{t("footer.company")}</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">{t("footer.about")}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t("footer.careers")}</a></li>
              <li><a href="#contact" className="hover:text-primary transition-colors">{t("footer.contact")}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t("footer.privacy")}</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-muted mt-12 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} OmniScan AI. {t("footer.allRightsReserved")}
          </p>
          <div className="flex space-x-4 text-muted-foreground text-sm">
            <a href="#" className="hover:text-primary transition-colors">{t("footer.terms")}</a>
            <a href="#" className="hover:text-primary transition-colors">{t("footer.privacy")}</a>
            <a href="#" className="hover:text-primary transition-colors">{t("footer.cookies")}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
