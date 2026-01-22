import { Palette, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

export default function ThemeSelector({ variant = "ghost", size = "icon" }) {
  const { currentTheme, colors, changeTheme, THEMES, THEME_COLORS } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant}
          size={size}
          className={cn(
            "gap-2 relative",
            currentTheme === THEMES.PREMIUM && "bg-gradient-to-r from-amber-500 to-yellow-600 text-white hover:from-amber-600 hover:to-yellow-700",
            currentTheme === THEMES.CYBERPUNK && "bg-gradient-to-r from-purple-900 to-pink-900 text-cyan-400 hover:from-purple-800 hover:to-pink-800 neon-glow"
          )}
          title="Changer le thème / Thema wijzigen"
        >
          {currentTheme === THEMES.PREMIUM ? (
            <Sparkles className="w-4 h-4 text-yellow-200" />
          ) : (
            <Palette className="w-4 h-4" />
          )}
          {size !== "icon" && <span className="hidden md:inline">Thème</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[320px] p-2">
        <DropdownMenuLabel className="text-base font-bold flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Thèmes / Thema's
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {Object.entries(THEMES).map(([key, themeId]) => {
          const theme = THEME_COLORS[themeId];
          const isActive = currentTheme === themeId;
          
          return (
            <DropdownMenuItem
              key={themeId}
              onClick={() => changeTheme(themeId)}
              className="flex items-center gap-3 py-3 cursor-pointer"
            >
              <div 
                className="flex items-center justify-center w-10 h-10 rounded-lg border-2"
                style={{ 
                  background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
                  borderColor: isActive ? theme.primary : 'transparent'
                }}
              >
                {isActive && <Check className="w-5 h-5 text-white drop-shadow" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{theme.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{theme.nameNL}</p>
              </div>
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator />
        <div className="px-2 py-2 text-xs text-muted-foreground">
          Les couleurs sont sauvegardees
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
