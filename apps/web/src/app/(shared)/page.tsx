import { TextLoopSection } from "@/components/shared/banner";
import { CTA } from "@/components/shared/cta";
import { FAQ } from "@/components/shared/faq";
import { Features } from "@/components/shared/features";
import { Footer } from "@/components/shared/footer";
import Hero from "@/components/shared/hero";
import { HowItWorks } from "@/components/shared/how-it-works";
import Navbar from "@/components/shared/navbar";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <TextLoopSection />
      <FAQ />

      <CTA />
      <Footer />
    </>
  );
}
