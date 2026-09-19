"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import AnimatedContent from "@/components/animation/animate";

interface Scenario {
  id: string;
  name: string;
  store: string;
  storeDomain: string;
  productName: string;
  originalPrice: string;
  targetPrice: string;
  sizeOption?: string;
  prompt: string;
  parsedConditions: string[];
  scanLog: string[];
  alertHeadline: string;
  alertDetails: string;
  badgeText: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "salomon",
    name: "Salomon XT-6",
    store: "SSENSE",
    storeDomain: "ssense.com/en-us/men/product/salomon/xt-6-black",
    productName: "Salomon XT-6 'Black / Phantom'",
    originalPrice: "$200",
    targetPrice: "$200 (Restock)",
    sizeOption: "US 10 / UK 9.5",
    prompt: "Notify me immediately when size US 10 comes back in stock. Don't trigger on other sizes.",
    parsedConditions: ["Size: US 10", "Trigger: Restock only", "Ignore: Other sizes"],
    scanLog: [
      "Target page reached: SSENSE listing active",
      "Size 10 selector state changed: [In Stock]",
      "Cart availability verified: 3 units remaining",
      "Matches criteria with 100% confidence",
    ],
    alertHeadline: "Size US 10 is back in stock at SSENSE",
    alertDetails: "Only 3 pairs remaining. Ready for 1-click checkout.",
    badgeText: "Back in Stock",
  },
  {
    id: "sony",
    name: "Sony WH-1000XM5",
    store: "Amazon",
    storeDomain: "amazon.com/dp/B09XS7JWHH/sony-wh1000xm5-silver",
    productName: "Sony WH-1000XM5 Wireless Headphones",
    originalPrice: "$399",
    targetPrice: "$279 (-30%)",
    prompt: "Track price on Silver edition and ping me if it drops below $300 from verified sellers.",
    parsedConditions: ["Price: < $300", "Color: Silver", "Seller: Sold by Amazon"],
    scanLog: [
      "Monitoring verified merchant listings",
      "Price update detected: $399.99 ➔ $279.99 (-30%)",
      "Seller confirmed: Shipped & sold by Amazon",
      "Target threshold satisfied (< $300)",
    ],
    alertHeadline: "Sony WH-1000XM5 dropped to $279",
    alertDetails: "Price dropped by $120. Sold directly by Amazon.",
    badgeText: "30% Price Drop",
  },
  {
    id: "arket",
    name: "Arket Knitwear",
    store: "ARKET",
    storeDomain: "arket.com/en_usd/women/knitwear/cashmere-crew-camel",
    productName: "Oversized Cashmere Crew-Neck (Camel)",
    originalPrice: "$260",
    targetPrice: "$182 (Sale)",
    sizeOption: "Size Medium",
    prompt: "Ping me if the Camel colorway goes on sale or restocks in Medium.",
    parsedConditions: ["Color: Camel Heather", "Size: Medium", "Trigger: Sale / Restock"],
    scanLog: [
      "Variant inventory monitored",
      "Markdown applied: $260 ➔ $182",
      "Size Medium confirmed active in inventory",
      "Matches watch rule: Camel in Medium",
    ],
    alertHeadline: "Arket Cashmere Knit marked down to $182",
    alertDetails: "Camel size M is available with complimentary shipping.",
    badgeText: "Sale & Restock",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Pin a page",
    description: "Drop in any product URL you want Cani to keep an eye on.",
  },
  {
    step: "02",
    title: "State your intent",
    description: "Say it in plain language — restock, price drop, or specific size.",
  },
  {
    step: "03",
    title: "Agent verifies",
    description: "Cani monitors changes and checks whether it matches your criteria.",
  },
  {
    step: "04",
    title: "Get notified",
    description: "The moment it's real, you're alerted with direct 1-click checkout.",
  },
];

export function HowItWorks() {
  const [activeScenario, setActiveScenario] = useState<Scenario>(SCENARIOS[0]);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev % 4) + 1);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <section className="bg-white px-6 sm:px-8 py-24 md:py-32">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <AnimatedContent distance={40} direction="vertical" delay={0.1}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <h2 className="font-serif text-4xl sm:text-5xl leading-tight text-gray-900">
                How Cani
                <br />
                actually works.
              </h2>
              <p className="text-gray-600 text-base sm:text-lg mt-3 max-w-xl">
                Four simple steps between you and never manually checking a page again.
              </p>
            </div>

            {/* Minimal Scenario Switcher */}
            <div className="flex items-center gap-2 border-b border-gray-100 pb-1">
              <span className="text-xs text-gray-400 font-serif mr-1">Scenario:</span>
              {SCENARIOS.map((sc) => {
                const isSelected = activeScenario.id === sc.id;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => {
                      setActiveScenario(sc);
                      setIsPlaying(false);
                    }}
                    className={`text-xs py-1 px-2.5 rounded-full transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-gray-900 text-white font-medium"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {sc.name}
                  </button>
                );
              })}
            </div>
          </div>
        </AnimatedContent>

        {/* Minimal Steps Nav */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {STEPS.map((s, index) => {
            const stepNum = index + 1;
            const isActive = activeStep === stepNum;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => {
                  setActiveStep(stepNum);
                  setIsPlaying(false);
                }}
                className="text-left cursor-pointer transition-opacity duration-200 group relative pb-4"
              >
                <div className="flex items-baseline gap-3 mb-2">
                  <span
                    className={`font-mono text-xs tracking-wider transition-colors ${
                      isActive ? "text-gray-900 font-semibold" : "text-gray-400 group-hover:text-gray-700"
                    }`}
                  >
                    {s.step}
                  </span>
                  <h3
                    className={`font-serif text-lg transition-colors ${
                      isActive ? "text-gray-900 font-semibold" : "text-gray-600 group-hover:text-gray-900"
                    }`}
                  >
                    {s.title}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {s.description}
                </p>

                {/* Subtle progress indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100 rounded-full overflow-hidden">
                  {isActive && (
                    <motion.div
                      layoutId="minimalStepLine"
                      className="h-full bg-gray-900 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: isPlaying ? 4.5 : 0.3, ease: "linear" }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Clean Interactive Preview Stage */}
        <div className="border border-gray-100 rounded-2xl p-6 sm:p-10 mb-20">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-8">
            <span className="font-mono text-xs text-gray-400">
              Live Preview // Step 0{activeStep}
            </span>
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-xs text-gray-400 hover:text-gray-800 transition cursor-pointer"
            >
              {isPlaying ? "Pause" : "Play auto-preview"}
            </button>
          </div>

          <div className="min-h-[220px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {activeStep === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="w-full max-w-2xl"
                >
                  <div className="border border-gray-100 rounded-xl p-6">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
                      Pinned Product Link
                    </p>
                    <div className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 mb-4">
                      <span className="font-mono text-xs text-gray-600 truncate">
                        https://{activeScenario.storeDomain}
                      </span>
                      <span className="text-xs text-gray-900 font-medium shrink-0">
                        {activeScenario.store}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-serif text-lg text-gray-900">
                          {activeScenario.productName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Current listing: {activeScenario.originalPrice} {activeScenario.sizeOption ? `• ${activeScenario.sizeOption}` : ""}
                        </p>
                      </div>
                      <span className="text-xs text-gray-600 border border-gray-200 rounded-full px-3 py-1">
                        Watching
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeStep === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="w-full max-w-2xl"
                >
                  <div className="border border-gray-100 rounded-xl p-6">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
                      Natural Language Instruction
                    </p>
                    <p className="font-serif text-xl text-gray-900 italic mb-6">
                      "{activeScenario.prompt}"
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {activeScenario.parsedConditions.map((cond, i) => (
                        <span
                          key={i}
                          className="text-xs text-gray-700 bg-gray-50 border border-gray-200/60 px-3 py-1 rounded-full"
                        >
                          {cond}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeStep === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="w-full max-w-2xl"
                >
                  <div className="border border-gray-100 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs text-gray-400 uppercase tracking-wider">
                        Autonomous Verification
                      </p>
                      <span className="text-xs text-green-600 font-mono">● Verified Match</span>
                    </div>
                    <div className="space-y-2 text-xs font-mono text-gray-600">
                      {activeScenario.scanLog.map((log, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-gray-400">—</span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeStep === 4 && (
                <motion.div
                  key="step-4"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="w-full max-w-2xl"
                >
                  <div className="border border-gray-100 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-gray-400 uppercase tracking-wider">
                        Alert Notification
                      </p>
                      <span className="text-xs text-gray-900 border border-gray-200 rounded-full px-2.5 py-0.5">
                        {activeScenario.badgeText}
                      </span>
                    </div>
                    <h4 className="font-serif text-2xl text-gray-900 mb-1">
                      {activeScenario.alertHeadline}
                    </h4>
                    <p className="text-xs text-gray-500 mb-5">
                      {activeScenario.alertDetails}
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="bg-black text-white text-xs font-medium px-4 py-2 rounded-full hover:bg-gray-800 transition cursor-pointer"
                      >
                        Buy Now
                      </button>
                      <span className="text-xs text-gray-400">
                        or reply to adjust this watch
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Video Showcase Section */}
        <AnimatedContent
          distance={50}
          direction="vertical"
          threshold={0.05}
          delay={0.15}
        >
          <div className="w-full h-[65vh] sm:h-[80vh] rounded-2xl overflow-hidden bg-black">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/YfDAQyNNxmA?autoplay=1&mute=1&controls=0&cc_load_policy=0&cc_lang_pref=off&fs=1&playsinline=1&rel=0"
              title="Cani Agent Product Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        </AnimatedContent>
      </div>
    </section>
  );
}
