import BlogSection from "./sections/BlogSection";
import CTASection from "./sections/CTASection";
import FAQSection from "./sections/FAQSection";
import FeaturesSection from "./sections/FeaturesSection";
import Footer from "./sections/Footer";
import HeroSection from "./sections/HeroSection";
import HowItWorksSection from "./sections/HowItWorksSection";
import Navbar from "./sections/Navbar";
import PricingSection from "./sections/PricingSection";
import SocialProofSection from "./sections/SocialProofSection";
import TestimonialsSection from "./sections/TestimonialsSection";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <SocialProofSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <TestimonialsSection />
        <FAQSection />
        <BlogSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
