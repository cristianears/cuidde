import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Login from './pages/auth/Login'
import VerifyEmail from './pages/auth/VerifyEmail'
import Onboarding from './pages/onboarding/Onboarding'
import CaregiverDashboard from './pages/caregiver/CaregiverDashboard'
import CaregiverProfile from './pages/caregiver/CaregiverProfile'
import CaregiverDocuments from './pages/caregiver/CaregiverDocuments'
import CaregiverReviews from './pages/caregiver/CaregiverReviews'
import CaregiverAvailability from './pages/caregiver/CaregiverAvailability'
import CaregiverPricing from './pages/caregiver/CaregiverPricing'
import CaregiverVisibility from './pages/caregiver/CaregiverVisibility'
import CaregiverSupport from './pages/caregiver/CaregiverSupport'
import CaregiverAppointments from './pages/caregiver/CaregiverAppointments'
import AppointmentDetails from './pages/caregiver/AppointmentDetails'
import CareRoutine from './pages/caregiver/CareRoutine'
import FamilyDashboard from './pages/family/FamilyDashboard'
import FamilyProfile from './pages/family/FamilyProfile'
import FamilyBilling from './pages/family/FamilyBilling'
import SearchCaregivers from './pages/family/SearchCaregivers'
import Favorites from './pages/family/Favorites'
import FamilyMatches from './pages/family/FamilyMatches'
import FamilyAppointments from './pages/family/FamilyAppointments'
import FamilyAppointmentDetails from './pages/family/FamilyAppointmentDetails'
import FamilyInvoices from './pages/family/FamilyInvoices'
import FamilyInvoiceDetails from './pages/family/FamilyInvoiceDetails'
import FamilySupport from './pages/family/FamilySupport'
import AdminDashboard from './pages/admin/AdminDashboard'
import ApprovalQueue from './pages/admin/ApprovalQueue'
import Finance from './pages/admin/Finance'
import Security from './pages/admin/Security'
import AppointmentChat from './pages/chat/AppointmentChat'

const queryClient = new QueryClient()

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/onboarding" element={<Onboarding />} />

            {/* Rotas de cuidador */}
            <Route path="/caregiver" element={<ProtectedRoute role="caregiver"><CaregiverDashboard /></ProtectedRoute>} />
            <Route path="/caregiver/profile" element={<ProtectedRoute role="caregiver"><CaregiverProfile /></ProtectedRoute>} />
            <Route path="/caregiver/documents" element={<ProtectedRoute role="caregiver"><CaregiverDocuments /></ProtectedRoute>} />
            <Route path="/caregiver/reviews" element={<ProtectedRoute role="caregiver"><CaregiverReviews /></ProtectedRoute>} />
            <Route path="/caregiver/availability" element={<ProtectedRoute role="caregiver"><CaregiverAvailability /></ProtectedRoute>} />
            <Route path="/caregiver/pricing" element={<ProtectedRoute role="caregiver"><CaregiverPricing /></ProtectedRoute>} />
            <Route path="/caregiver/visibility" element={<ProtectedRoute role="caregiver"><CaregiverVisibility /></ProtectedRoute>} />
            <Route path="/caregiver/support" element={<ProtectedRoute role="caregiver"><CaregiverSupport /></ProtectedRoute>} />
            <Route path="/caregiver/appointments" element={<ProtectedRoute role="caregiver"><CaregiverAppointments /></ProtectedRoute>} />
            <Route path="/caregiver/appointments/:id" element={<ProtectedRoute role="caregiver"><AppointmentDetails /></ProtectedRoute>} />
            <Route path="/caregiver/appointments/:id/care-routine" element={<ProtectedRoute role="caregiver"><CareRoutine /></ProtectedRoute>} />

            {/* Rotas de família */}
            <Route path="/family" element={<ProtectedRoute role="family"><FamilyDashboard /></ProtectedRoute>} />
            <Route path="/family/profile" element={<ProtectedRoute role="family"><FamilyProfile /></ProtectedRoute>} />
            <Route path="/family/billing" element={<ProtectedRoute role="family"><FamilyBilling /></ProtectedRoute>} />
            <Route path="/family/search" element={<ProtectedRoute role="family"><SearchCaregivers /></ProtectedRoute>} />
            <Route path="/family/matches" element={<ProtectedRoute role="family"><FamilyMatches /></ProtectedRoute>} />
            <Route path="/family/favorites" element={<ProtectedRoute role="family"><Favorites /></ProtectedRoute>} />
            <Route path="/family/appointments" element={<ProtectedRoute role="family"><FamilyAppointments /></ProtectedRoute>} />
            <Route path="/family/appointments/:id" element={<ProtectedRoute role="family"><FamilyAppointmentDetails /></ProtectedRoute>} />
            <Route path="/family/invoices" element={<ProtectedRoute role="family"><FamilyInvoices /></ProtectedRoute>} />
            <Route path="/family/invoices/:id" element={<ProtectedRoute role="family"><FamilyInvoiceDetails /></ProtectedRoute>} />
            <Route path="/family/support" element={<ProtectedRoute role="family"><FamilySupport /></ProtectedRoute>} />

            {/* Rotas de admin */}
            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/approvals" element={<ProtectedRoute role="admin"><ApprovalQueue /></ProtectedRoute>} />
            <Route path="/admin/finance" element={<ProtectedRoute role="admin"><Finance /></ProtectedRoute>} />
            <Route path="/admin/security" element={<ProtectedRoute role="admin"><Security /></ProtectedRoute>} />

            {/* Chat — autenticado, qualquer role */}
            <Route path="/chat/:id" element={<ProtectedRoute><AppointmentChat /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
)

export default App
