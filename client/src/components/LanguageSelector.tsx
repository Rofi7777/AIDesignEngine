import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/contexts/LanguageContext";
import type { Language } from "@/lib/translations";

const languageKeys: Record<Language, string> = {
  'en': 'languageEnglish',
  'zh-TW': 'languageTraditionalChinese',
  'vi': 'languageVietnamese',
};

export function LanguageSelector() {
  const { language, setLanguage, t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" data-testid="button-language-selector">
          <Languages className="h-5 w-5" />
          <span className="sr-only">{t('language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" data-testid="dropdown-language-menu">
        {Object.entries(languageKeys).map(([lang, key]) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang as Language)}
            data-testid={`dropdown-item-language-${lang}`}
            className={language === lang ? "bg-accent" : ""}
          >
            {t(key as any)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
