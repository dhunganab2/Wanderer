import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from './button';
import { useAppStore } from '@/store/useAppStore';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useAppStore();

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Update document class for Tailwind dark mode
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  React.useEffect(() => {
    // Initialize theme on mount
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <Button
      variant="floating"
      size="icon"
      onClick={toggleTheme}
      className="relative h-12 w-12 rounded-2xl transition-all duration-500 hover:scale-110 hover:shadow-glow group"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <Sun 
        className={`h-5 w-5 transition-all duration-500 ${
          theme === 'dark' 
            ? 'rotate-180 scale-0 opacity-0' 
            : 'rotate-0 scale-100 opacity-100'
        }`} 
      />
      <Moon 
        className={`absolute h-5 w-5 transition-all duration-500 ${
          theme === 'dark' 
            ? 'rotate-0 scale-100 opacity-100' 
            : '-rotate-180 scale-0 opacity-0'
        }`} 
      />
      
      {/* Glow effect for dark mode */}
      {theme === 'dark' && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-sunrise/20 animate-pulse-soft" />
      )}
    </Button>
  );
};
