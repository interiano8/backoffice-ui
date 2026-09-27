import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"

export function ModeToggle() {
    const { setTheme, theme } = useTheme()

    return (
        <Button variant="outline" size="icon" className="h-8 w-8 border-none bg-transparent hover:bg-primary/10 transition-colors" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-muted-foreground" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-muted-foreground" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}
