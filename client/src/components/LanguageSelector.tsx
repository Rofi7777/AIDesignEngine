import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/contexts/LanguageContext";
import type { Language } from "@/lib/translations";

const languageOptions: Record<Language, { label: string; code: string }> = {
  'en': { label: 'English', code: 'EN' },
  'zh-TW': { label: '繁體中文', code: '中' },
  'vi': { label: 'Tiếng Việt', code: 'VI' },
};

export function LanguageSelector() {
  const { language, setLanguage } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" data-testid="button-language-selector">
          <Globe className="h-5 w-5" />
          <span className="sr-only">Select Language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" data-testid="dropdown-language-menu">
        {Object.entries(languageOptions).map(([lang, { label, code }]) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang as Language)}
            data-testid={`dropdown-item-language-${lang}`}
            className={language === lang ? "bg-accent" : ""}
          >
            <span className="mr-2 flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-semibold text-primary">
              {code}
            </span>
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
