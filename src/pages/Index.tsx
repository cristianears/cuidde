import { Navigate } from "react-router-dom";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TwoPaths from "@/components/TwoPaths";
import Benefits from "@/components/Benefits";
import Trust from "@/components/Trust";
import HiringFlexibility from "@/components/HiringFlexibility";
import HowItWorks from "@/components/HowItWorks";
import CareRoutinePreview from "@/components/CareRoutinePreview";
import Pricing from "@/components/Pricing";
import WhyItMatters from "@/components/WhyItMatters";
import LatestBlogPosts from "@/components/LatestBlogPosts";
import CaregiverCTA from "@/components/CaregiverCTA";

import FinalCTA from "@/components/FinalCTA";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types/database";

const roleHomeMap: Record<UserRole, string> = {
  caregiver: "/caregiver",
  family: "/family",
  admin: "/admin",
};

const Index = () => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user && role) {
    return <Navigate to={roleHomeMap[role]} replace />;
  }

  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <TwoPaths />
      <Benefits />
      <Trust />
      <HiringFlexibility />
      <HowItWorks />
      <CareRoutinePreview />
      <Pricing />
      <WhyItMatters />
      <CaregiverCTA />
      <FinalCTA />
      <FAQ />
      <LatestBlogPosts />
      <Footer />
    </div>
  );
};

export default Index;
