import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import "@/lib/firebase"; // Initialize Firebase
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Discover from "./pages/Discover";
import EnhancedDiscover from "./pages/EnhancedDiscover";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import EnhancedMessages from "./pages/EnhancedMessages";
import Map from "./pages/Map";
import Matches from "./pages/Matches";
import NotFound from "./pages/NotFound";
import { ProfileSetupFlow } from "./components/ProfileSetupFlow";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Profile setup route */}
            <Route path="/setup-profile" element={
              <ProtectedRoute requireProfile={false}>
                <ProfileSetupFlow />
              </ProtectedRoute>
            } />
            
            {/* Protected routes */}
            <Route path="/discover" element={
              <ProtectedRoute>
                <EnhancedDiscover />
              </ProtectedRoute>
            } />
            <Route path="/discover-old" element={
              <ProtectedRoute>
                <Discover />
              </ProtectedRoute>
            } />
            <Route path="/matches" element={
              <ProtectedRoute>
                <Matches />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute>
                <EnhancedMessages />
              </ProtectedRoute>
            } />
            <Route path="/messages-old" element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } />
            <Route path="/map" element={
              <ProtectedRoute>
                <Map />
              </ProtectedRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
