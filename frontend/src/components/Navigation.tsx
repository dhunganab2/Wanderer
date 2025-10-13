import React from 'react';
import { MapPin, MessageCircle, User, Compass, Heart, LogOut, LogIn, UserPlus, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthContext } from './AuthProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NavigationProps {
  className?: string;
}

const navItems = [
  { icon: Compass, label: 'Discover', path: '/discover' },
  { icon: Heart, label: 'Matches', path: '/matches' },
  { icon: MapPin, label: 'Map', path: '/map' },
  { icon: MessageCircle, label: 'Messages', path: '/messages' },
  { icon: Bot, label: 'AI Planner', path: '/ai-travel-planner' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export const Navigation: React.FC<NavigationProps> = ({ className }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { user, logout } = useAuthContext();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Show auth buttons if not authenticated, otherwise show nav items
  if (!user) {
    return (
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 backdrop-blur-xl",
        "bg-background/80 supports-[backdrop-filter]:bg-background/60",
        className
      )}>
        <div className="flex items-center justify-center gap-4 h-20 px-4 max-w-md mx-auto">
          <Button variant="ghost" className="flex items-center gap-2" asChild>
            <Link to="/login">
              <LogIn className="w-5 h-5" />
              <span>Sign In</span>
            </Link>
          </Button>
          <Button variant="default" className="flex items-center gap-2 px-6" asChild>
            <Link to="/signup">
              <UserPlus className="w-5 h-5" />
              <span>Sign Up</span>
            </Link>
          </Button>
        </div>
      </nav>
    );
  }

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 backdrop-blur-xl",
      "bg-background/80 supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="flex items-center justify-around h-20 px-4 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              size="icon-lg"
              asChild
              className={cn(
                "flex flex-col gap-1 h-16 w-16 rounded-2xl transition-all duration-300",
                isActive 
                  ? "text-primary bg-primary/10 shadow-medium" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Link to={item.path}>
                <Icon className={cn("w-6 h-6", isActive && "animate-scale-in")} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            </Button>
          );
        })}
      </div>
    </nav>
  );
};

// Desktop Navigation
export const DesktopNavigation: React.FC<NavigationProps> = ({ className }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { user, logout } = useAuthContext();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-xl",
      "bg-background/80 supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="flex items-center justify-between h-16 px-6 max-w-7xl mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity mr-8">
          <div className="w-10 h-10 rounded-lg bg-gradient-sunrise flex items-center justify-center">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold font-display text-foreground">Wander</span>
        </Link>

        {/* Center Navigation - Only show if user is authenticated */}
        {user && (
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "default" : "ghost"}
                  className="flex items-center gap-2 px-6 py-2 mx-1"
                  asChild
                >
                  <Link to={item.path}>
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-3 ml-8">
          <ThemeToggle />
          
          {user ? (
            // Authenticated User Menu
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                      <AvatarFallback>
                        {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">
                      {user.displayName || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/discover" className="flex items-center">
                      <Compass className="mr-2 h-4 w-4" />
                      Discover
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            // Unauthenticated User Buttons
            <>
              <Button variant="ghost" className="flex items-center gap-2" asChild>
                <Link to="/login">
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              </Button>
              <Button variant="default" className="flex items-center gap-2 px-4" asChild>
                <Link to="/signup">
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Up</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};