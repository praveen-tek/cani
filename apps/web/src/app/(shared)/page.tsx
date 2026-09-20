import { siteName, siteUrl } from "@/lib/site";
import { TextLoopSection } from "@/components/shared/banner";
import { CTA } from "@/components/shared/cta";
import { FAQ } from "@/components/shared/faq";
import { Features } from "@/components/shared/features";
import { Footer } from "@/components/shared/footer";
import Hero from "@/components/shared/hero";
import { HowItWorks } from "@/components/shared/how-it-works";
import Navbar from "@/components/shared/navbar";

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: `${siteUrl}/icon.svg`,
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    inLanguage: "en",
  },
];

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <header>
        <Navbar />
      </header>
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <TextLoopSection />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
