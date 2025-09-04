import React from 'react';
import { ArrowRight, MapPin, Users, Shield, Sparkles, Globe, Heart, Camera, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { FeatureCard } from '@/components/FeatureCard';
import { TravelCard } from '@/components/TravelCard';
import { DesktopNavigation, Navigation } from '@/components/Navigation';
import { useAuthContext } from '@/components/AuthProvider';
import { sampleUsers } from '@/data/sampleUsers';
import heroImage from '@/assets/hero-travel-connections.jpg';
import gradientBg from '@/assets/gradient-background.jpg';



const features = [
  {
    icon: Users,
    title: 'Find Your Travel Crew',
    description: 'Connect with like-minded travelers heading to your destination. Share experiences, split costs, and create unforgettable memories together.',
  },
  {
    icon: MapPin,
    title: 'Destination Matching',
    description: 'Get matched with travelers going to the same places at the same time. Plan group activities and discover hidden gems with locals.',
  },
  {
    icon: Shield,
    title: 'Safe & Verified',
    description: 'Every profile is verified. Share your journey with confidence knowing we prioritize your safety and privacy above all.',
  },
  {
    icon: Sparkles,
    title: 'Curated Experiences',
    description: 'Access exclusive group activities, local experiences, and travel deals available only to our community members.',
  },
];

const stats = [
  { number: '50K+', label: 'Active Travelers' },
  { number: '180+', label: 'Countries' },
  { number: '2M+', label: 'Connections Made' },
  { number: '4.9★', label: 'Average Rating' },
];

export default function Landing() {
  const { user } = useAuthContext();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Navigation */}
      <DesktopNavigation className="hidden md:flex" />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Travelers connecting around the world"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-midnight-blue/30 to-transparent" />
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-gradient-sunrise/20 backdrop-blur-sm animate-float" />
        <div className="absolute bottom-32 right-16 w-16 h-16 rounded-full bg-sky-blue/20 backdrop-blur-sm animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 right-1/4 w-12 h-12 rounded-full bg-warm-amber/20 backdrop-blur-sm animate-float" style={{ animationDelay: '4s' }} />
        
        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-up font-display">
            Your Next Story
            <br />
            <span className="bg-gradient-sunrise bg-clip-text text-transparent">
              is Waiting
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed animate-fade-up max-w-2xl mx-auto" style={{ animationDelay: '300ms' }}>
            Connect with fellow travelers, discover new destinations, and create unforgettable adventures together.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{ animationDelay: '600ms' }}>
            {user ? (
              <>
                <Button variant="hero" size="xl" className="text-lg px-8 py-4" asChild>
                  <Link to="/discover">
                    Find Your Crew
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button variant="glass" size="xl" className="text-lg px-8 py-4 text-white">
                  <Camera className="w-5 h-5 mr-2" />
                  Watch Stories
                </Button>
              </>
            ) : (
              <>
                <Button variant="hero" size="xl" className="text-lg px-8 py-4" asChild>
                  <Link to="/signup">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Get Started Free
                  </Link>
                </Button>
                <Button variant="glass" size="xl" className="text-lg px-8 py-4 text-white" asChild>
                  <Link to="/login">
                    <LogIn className="w-5 h-5 mr-2" />
                    Sign In
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="text-center animate-fade-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2 font-display">
                  {stat.number}
                </div>
                <div className="text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 animate-fade-up">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 font-display">
              Travel Better, Together
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Join a community of adventurous souls who believe the best travel stories are written together.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={index * 150}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Profile Preview Section */}
      <section className="py-24 bg-gradient-to-br from-muted/30 to-background relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <img src={gradientBg} alt="" className="w-full h-full object-cover" />
        </div>
        
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="text-center mb-16 animate-fade-up">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 font-display">
              Meet Your Travel Match
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Discover travelers who share your passion for adventure and are heading to your next destination.
            </p>
          </div>
          
          <div className="flex justify-center gap-8 flex-wrap">
            {sampleUsers.slice(0, 2).map((user, index) => (
              <div 
                key={user.id}
                className="animate-fade-up hover-lift"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <TravelCard 
                  user={user} 
                  variant="grid"
                  onLike={(id) => console.log('Liked user:', id)}
                  onPass={(id) => console.log('Passed user:', id)}
                />
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12 animate-fade-up" style={{ animationDelay: '600ms' }}>
            {user ? (
              <Button variant="hero" size="lg" className="px-8" asChild>
                <Link to="/discover">
                  <Heart className="w-5 h-5 mr-2" />
                  Start Matching
                </Link>
              </Button>
            ) : (
              <Button variant="hero" size="lg" className="px-8" asChild>
                <Link to="/signup">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Join Now
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-ocean relative overflow-hidden">
        <div className="absolute inset-0 bg-midnight-blue/90" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="animate-fade-up">
            <Globe className="w-16 h-16 text-white/80 mx-auto mb-8 animate-float" />
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-display">
              Ready for Your Next Adventure?
            </h2>
            <p className="text-xl text-white/90 mb-12 leading-relaxed max-w-2xl mx-auto">
              Join thousands of travelers who've found their perfect travel companions and created memories that last a lifetime.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Button variant="hero" size="xl" className="text-lg px-8 py-4" asChild>
                    <Link to="/discover">
                      Find Your Crew
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="glass" size="xl" className="text-lg px-8 py-4 text-white">
                    Learn More
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="hero" size="xl" className="text-lg px-8 py-4" asChild>
                    <Link to="/signup">
                      <UserPlus className="w-5 h-5 mr-2" />
                      Get Started Free
                    </Link>
                  </Button>
                  <Button variant="glass" size="xl" className="text-lg px-8 py-4 text-white" asChild>
                    <Link to="/login">
                      <LogIn className="w-5 h-5 mr-2" />
                      Sign In
                    </Link>
                  </Button>
                </>
              )}
            </div>
            
            <p className="text-white/70 text-sm mt-6">
              Free forever • No credit card required • Join in 30 seconds
            </p>
          </div>
        </div>
      </section>

      {/* Mobile Navigation */}
      <Navigation className="md:hidden" />
    </div>
  );
}