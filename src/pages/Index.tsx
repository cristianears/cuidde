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
import CaregiverCTA from "@/components/CaregiverCTA";

import FinalCTA from "@/components/FinalCTA";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

const Index = () => {
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
      <Footer />
    </div>
  );
};

export default Index;
