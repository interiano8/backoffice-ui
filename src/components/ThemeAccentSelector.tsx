import { useEffect, useState } from "react";
import { Check, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const accents = [
  { name: "Azul", h: "221.2", s: "83.2%", l: "53.3%", color: "bg-blue-600" },
  { name: "Violeta", h: "262.1", s: "83.3%", l: "57.8%", color: "bg-violet-600" },
  { name: "Naranja", h: "24.6", s: "95%", l: "53.1%", color: "bg-orange-600" },
  { name: "Esmeralda", h: "142.1", s: "70.6%", l: "45.3%", color: "bg-emerald-600" },
  { name: "Rosa", h: "346.8", s: "77.2%", l: "49.8%", color: "bg-pink-600" },
  { name: "Slate", h: "215", s: "20.2%", l: "46.9%", color: "bg-slate-600" },
];

export function ThemeAccentSelector() {
  const [currentAccent, setCurrentAccent] = useState(accents[0]);

  useEffect(() => {
    const applyAccent = (accent: any) => {
      setCurrentAccent(accent);
      const root = window.document.documentElement;
      root.style.setProperty("--accent-h", accent.h);
      root.style.setProperty("--accent-s", accent.s);
      root.style.setProperty("--accent-l", accent.l);
    };

    const loadSaved = () => {
      const savedAccent = localStorage.getItem("theme-accent");
      if (savedAccent) {
        try {
          const parsed = JSON.parse(savedAccent);
          const found = accents.find((a) => a.name === parsed.name);
          if (found) applyAccent(found);
        } catch (e) {}
      }
    };

    loadSaved();

    // Sincronizar entre pestañas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "theme-accent" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const found = accents.find((a) => a.name === parsed.name);
          if (found) applyAccent(found);
        } catch (e) {}
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const updateAccent = (accent: typeof accents[0]) => {
    setCurrentAccent(accent);
    const root = window.document.documentElement;
    root.style.setProperty("--accent-h", accent.h);
    root.style.setProperty("--accent-s", accent.s);
    root.style.setProperty("--accent-l", accent.l);
    localStorage.setItem("theme-accent", JSON.stringify(accent));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8 border-none bg-transparent hover:bg-primary/10 transition-colors">
          <Palette className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Cambiar acento</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-2" align="end">
        <div className="grid grid-cols-3 gap-2">
          {accents.map((accent) => (
            <button
              key={accent.name}
              onClick={() => updateAccent(accent)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-110",
                accent.color,
                currentAccent.name === accent.name && "ring-2 ring-ring ring-offset-2 ring-offset-background"
              )}
              title={accent.name}
            >
              {currentAccent.name === accent.name && (
                <Check className="h-4 w-4 text-white" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
