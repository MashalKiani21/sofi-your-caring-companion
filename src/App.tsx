import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { AuthProvider } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import IntroPage from "./pages/IntroPage";
import AuthPage from "./pages/AuthPage";
import ProfileSetup from "./pages/ProfileSetup";
import HomePage from "./pages/HomePage";
import CompanionPage from "./pages/CompanionPage";
import HealthDashboard from "./pages/HealthDashboard";
import RemindersPage from "./pages/RemindersPage";
import NotesPage from "./pages/NotesPage";
import ContactsPage from "./pages/ContactsPage";
import MessagesPage from "./pages/MessagesPage";
import WhatsAppPage from "./pages/WhatsAppPage";
import SettingsPage from "./pages/SettingsPage";
import ResetPassword from "./pages/ResetPassword";
import EmergencyPage from "./pages/EmergencyPage";
import NavigationPage from "./pages/NavigationPage";
import CaregiverPage from "./pages/CaregiverPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AccessibilityProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<IntroPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/profile-setup" element={<ProfileSetup />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/companion" element={<CompanionPage />} />
              <Route path="/health-dashboard" element={<HealthDashboard />} />
              <Route path="/reminders" element={<RemindersPage />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/contacts" element={<ContactsPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/whatsapp" element={<WhatsAppPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/emergency" element={<EmergencyPage />} />
              <Route path="/navigation" element={<NavigationPage />} />
              <Route path="/caregiver" element={<CaregiverPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BottomNav />
          </BrowserRouter>
        </AuthProvider>
      </AccessibilityProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
