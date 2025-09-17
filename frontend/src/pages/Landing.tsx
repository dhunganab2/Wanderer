import React from 'react';
// Fixed Star import issue
import { ArrowRight, MapPin, Users, Shield, Sparkles, Globe, Heart, Camera, LogIn, UserPlus, Star } from 'lucide-react';
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

  console.log('Landing page rendering, user:', user);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Navigation */}
      <DesktopNavigation className="hidden md:flex" />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Enhanced Background with Parallax Effect */}
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Travelers connecting around the world"
            className="w-full h-full object-cover scale-105 animate-float"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-midnight-blue/40 via-transparent to-sunrise-coral/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
        
        {/* Enhanced Floating Elements with Morphing */}
        <div className="absolute top-20 left-10 w-24 h-24 rounded-full bg-gradient-sunrise/30 backdrop-blur-md animate-float animate-morphing" />
        <div className="absolute bottom-32 right-16 w-20 h-20 rounded-full bg-gradient-ocean/30 backdrop-blur-md animate-float animate-morphing" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 right-1/4 w-16 h-16 rounded-full bg-gradient-sunset/30 backdrop-blur-md animate-float animate-morphing" style={{ animationDelay: '4s' }} />
        <div className="absolute top-1/2 left-1/4 w-12 h-12 rounded-full bg-gradient-teal/40 backdrop-blur-sm animate-float animate-rotate-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-8 h-8 rounded-full bg-warm-amber/50 backdrop-blur-sm animate-float animate-rotate-reverse" style={{ animationDelay: '3s' }} />
        
        {/* Enhanced Content with Better Typography */}
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <div className="mb-8 animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card-elevated backdrop-blur-xl border border-white/20 mb-6">
              <Sparkles className="w-4 h-4 text-sunrise-coral animate-pulse" />
              <span className="text-sm font-medium text-white/90">Join 50,000+ Travelers</span>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-white mb-8 animate-fade-up font-display leading-[0.85] tracking-tight">
            Your Next
            <br />
            <span className="bg-gradient-sunrise bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_200%]">
              Adventure
            </span>
            <br />
            <span className="text-4xl md:text-6xl lg:text-7xl font-medium text-white/80">
              Awaits
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-16 leading-relaxed animate-fade-up max-w-3xl mx-auto font-medium" style={{ animationDelay: '300ms' }}>
            Connect with fellow travelers, discover new destinations, and create 
            <span className="text-gradient-sunrise font-semibold"> unforgettable memories</span> together.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-up mb-16" style={{ animationDelay: '600ms' }}>
            {user ? (
              <>
                <Button 
                  variant="hero" 
                  size="xl" 
                  className="text-lg px-10 py-6 h-16 shadow-elevation hover:shadow-glow group" 
                  asChild
                >
                  <Link to="/discover">
                    <Heart className="w-6 h-6 mr-3 group-hover:animate-wiggle" />
                    Find Your Crew
                    <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button 
                  variant="glass" 
                  size="xl" 
                  className="text-lg px-10 py-6 h-16 backdrop-blur-xl border-white/30 hover:border-white/50 group"
                >
                  <Camera className="w-6 h-6 mr-3 group-hover:animate-pulse-soft" />
                  Watch Stories
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="hero" 
                  size="xl" 
                  className="text-lg px-10 py-6 h-16 shadow-elevation hover:shadow-glow group" 
                  asChild
                >
                  <Link to="/signup">
                    <UserPlus className="w-6 h-6 mr-3 group-hover:animate-scale-pulse" />
                    Get Started Free
                    <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button 
                  variant="glass" 
                  size="xl" 
                  className="text-lg px-10 py-6 h-16 backdrop-blur-xl border-white/30 hover:border-white/50 group" 
                  asChild
                >
                  <Link to="/login">
                    <LogIn className="w-6 h-6 mr-3 group-hover:animate-pulse-soft" />
                    Sign In
                  </Link>
                </Button>
              </>
            )}
          </div>
          
          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-white/70 animate-fade-up" style={{ animationDelay: '900ms' }}>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">Verified Profiles</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              <span className="text-sm font-medium">180+ Countries</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-warm-amber" />
              <span className="text-sm font-medium">4.9★ Rating</span>
            </div>
          </div>
        </div>
        
        {/* Enhanced Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce-gentle">
          <div className="w-8 h-12 border-2 border-white/60 rounded-full flex justify-center backdrop-blur-sm">
            <div className="w-1 h-4 bg-gradient-sunrise rounded-full mt-2 animate-pulse-soft" />
          </div>
          <p className="text-white/60 text-xs mt-2 font-medium">Scroll to explore</p>
        </div>
      </section>

      {/* Enhanced Stats Section */}
      <section className="relative py-24 bg-gradient-to-b from-background via-muted/20 to-background overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-sunrise-coral/10 via-transparent to-sky-blue/10" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center mb-16 animate-fade-up">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-display">
              Trusted by Travelers Worldwide
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join a growing community of adventurers who've found their perfect travel companions
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="text-center animate-fade-up group"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="relative mb-6">
                  <div className="w-24 h-24 mx-auto rounded-2xl glass-card-elevated backdrop-blur-xl border border-sunrise-coral/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <div className="text-3xl md:text-4xl font-bold text-gradient-primary font-display">
                      {stat.number}
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-sunrise rounded-full animate-pulse-soft" />
                </div>
                <div className="text-muted-foreground font-semibold text-lg">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-32 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-0 w-96 h-96 bg-gradient-sunrise/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-gradient-ocean/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center mb-20 animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card-elevated backdrop-blur-xl border border-sunrise-coral/20 mb-6">
              <Sparkles className="w-4 h-4 text-sunrise-coral" />
              <span className="text-sm font-semibold text-foreground">Why Choose Wander</span>
            </div>
            
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-8 font-display leading-tight">
              Travel Better,
              <br />
              <span className="text-gradient-primary">Together</span>
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
              Join a community of adventurous souls who believe the best travel stories are written together.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group animate-fade-up hover-lift"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="relative p-8 rounded-3xl glass-card-elevated backdrop-blur-xl border border-white/10 hover:border-sunrise-coral/30 transition-all duration-500 h-full">
                  {/* Icon Container */}
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-sunrise/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      <feature.icon className="w-8 h-8 text-sunrise-coral" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-sunrise rounded-full animate-pulse-soft" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-bold text-foreground mb-4 font-display group-hover:text-gradient-primary transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
                    {feature.description}
                  </p>
                  
                  {/* Hover Effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-sunrise/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </div>
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
                  <Button variant="glass" size="xl" className="text-lg px-8 py-4 text-white" asChild>
                    <Link to="/about">
                      Learn More
                    </Link>
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