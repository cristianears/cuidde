import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/onboarding/Onboarding";
import CaregiverDashboard from "./pages/caregiver/CaregiverDashboard";
import CaregiverProfile from "./pages/caregiver/CaregiverProfile";
import CaregiverDocuments from "./pages/caregiver/CaregiverDocuments";
import CaregiverReviews from "./pages/caregiver/CaregiverReviews";
import CaregiverAvailability from "./pages/caregiver/CaregiverAvailability";
import CaregiverPricing from "./pages/caregiver/CaregiverPricing";
import CaregiverVisibility from "./pages/caregiver/CaregiverVisibility";
import CaregiverSupport from "./pages/caregiver/CaregiverSupport";
import CaregiverAppointments from "./pages/caregiver/CaregiverAppointments";
import AppointmentDetails from "./pages/caregiver/AppointmentDetails";
import CareRoutine from "./pages/caregiver/CareRoutine";
import FamilyDashboard from "./pages/family/FamilyDashboard";
import FamilyProfile from "./pages/family/FamilyProfile";
import FamilyBilling from "./pages/family/FamilyBilling";
import SearchCaregivers from "./pages/family/SearchCaregivers";
import Favorites from "./pages/family/Favorites";
import FamilyMatches from "./pages/family/FamilyMatches";
import FamilyAppointments from "./pages/family/FamilyAppointments";
import FamilyAppointmentDetails from "./pages/family/FamilyAppointmentDetails";
import FamilyInvoices from "./pages/family/FamilyInvoices";
import FamilyInvoiceDetails from "./pages/family/FamilyInvoiceDetails";
import FamilySupport from "./pages/family/FamilySupport";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ApprovalQueue from "./pages/admin/ApprovalQueue";
import Finance from "./pages/admin/Finance";
import Security from "./pages/admin/Security";
import AppointmentChat from "./pages/chat/AppointmentChat";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/caregiver" element={<CaregiverDashboard />} />
          <Route path="/caregiver/profile" element={<CaregiverProfile />} />
          <Route path="/caregiver/documents" element={<CaregiverDocuments />} />
          <Route path="/caregiver/reviews" element={<CaregiverReviews />} />
          <Route path="/caregiver/availability" element={<CaregiverAvailability />} />
          <Route path="/caregiver/pricing" element={<CaregiverPricing />} />
          <Route path="/caregiver/visibility" element={<CaregiverVisibility />} />
          <Route path="/caregiver/support" element={<CaregiverSupport />} />
          <Route path="/caregiver/appointments" element={<CaregiverAppointments />} />
          <Route path="/caregiver/appointments/:id" element={<AppointmentDetails />} />
          <Route path="/caregiver/appointments/:id/care-routine" element={<CareRoutine />} />
          <Route path="/family" element={<FamilyDashboard />} />
          <Route path="/family/profile" element={<FamilyProfile />} />
          <Route path="/family/billing" element={<FamilyBilling />} />
          <Route path="/family/search" element={<SearchCaregivers />} />
          <Route path="/family/matches" element={<FamilyMatches />} />
          <Route path="/family/favorites" element={<Favorites />} />
          <Route path="/family/appointments" element={<FamilyAppointments />} />
          <Route path="/family/appointments/:id" element={<FamilyAppointmentDetails />} />
          <Route path="/family/invoices" element={<FamilyInvoices />} />
          <Route path="/family/invoices/:id" element={<FamilyInvoiceDetails />} />
          <Route path="/family/support" element={<FamilySupport />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/approvals" element={<ApprovalQueue />} />
          <Route path="/admin/finance" element={<Finance />} />
          <Route path="/admin/security" element={<Security />} />
          <Route path="/chat/:id" element={<AppointmentChat />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
