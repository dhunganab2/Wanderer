import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-gradient-sunrise animate-float" />
        <div className="absolute bottom-32 right-16 w-24 h-24 rounded-full bg-sky-blue animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 right-1/4 w-16 h-16 rounded-full bg-warm-amber animate-float" style={{ animationDelay: '4s' }} />
      </div>
      
      <div className="text-center px-6 max-w-md mx-auto relative z-10">
        <div className="mb-8 animate-scale-in">
          <div className="w-24 h-24 rounded-full bg-gradient-sunrise/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl font-bold text-primary">404</span>
          </div>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-display animate-fade-up">
          Lost in the Journey?
        </h1>
        
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed animate-fade-up" style={{ animationDelay: '200ms' }}>
          Looks like this path doesn't exist. Let's get you back on track to find your next adventure.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{ animationDelay: '400ms' }}>
          <Button 
            variant="hero" 
            size="lg"
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
