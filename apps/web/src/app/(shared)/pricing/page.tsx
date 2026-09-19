"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Navbar from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import AnimatedContent from "@/components/animation/animate";
import {
  Check,
  Sparkle,
  Lightning,
  ShieldCheck,
  Clock,
  ArrowRight,
  Plus,
} from "@phosphor-icons/react";

interface PlanTier {
  id: string;
  name: string;
  badge?: string;
  isPopular?: boolean;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  buttonText: string;
  buttonVariant: "outline" | "solid" | "ghost";
  features: string[];
  specs: {
    scans: string;
    watches: string;
    channels: string;
    autoBuy: string;
  };
}

const PLANS: PlanTier[] = [
  {
    id: "free",
    name: "Explorer",
    description: "For casual shoppers tracking an occasional drop or seasonal wishlist item.",
    monthlyPrice: 0,
    annualPrice: 0,
    buttonText: "Start for Free",
    buttonVariant: "outline",
    features: [
      "Up to 3 active product watches",
      "Hourly inventory & price checks",
      "Email restock notifications",
      "Universal storefront link parsing",
      "Standard community support",
    ],
    specs: {
      scans: "1 hour",
      watches: "3 items",
      channels: "Email",
      autoBuy: "Manual link",
    },
  },
  {
    id: "pro",
    name: "Pro Shopper",
    badge: "Most Popular",
    isPopular: true,
    description: "For serious buyers who need sub-minute restock detection and zero missed drops.",
    monthlyPrice: 12,
    annualPrice: 10,
    buttonText: "Start 7-Day Free Trial",
    buttonVariant: "solid",
    features: [
      "Unlimited active product watches",
      "Real-time 60-second background scans",
      "Instant SMS, Email & Push alerts",
      "Natural language custom filter prompts",
      "Multi-store variant & size matching",
      "Pre-filled 1-Click checkout links",
      "Priority proxy pool & anti-bot bypass",
    ],
    specs: {
      scans: "60 seconds",
      watches: "Unlimited",
      channels: "SMS, Email, Push",
      autoBuy: "1-Click Cart Pre-fill",
    },
  },
  {
    id: "concierge",
    name: "Concierge",
    description: "For power collectors, rare grails, and automated high-heat releases.",
    monthlyPrice: 29,
    annualPrice: 24,
    buttonText: "Get Concierge Access",
    buttonVariant: "outline",
    features: [
      "Everything in Pro Shopper",
      "Autonomous Auto-Buy execution agent",
      "Multi-region tracking (US, EU, UK, JP)",
      "High-speed residential proxy network",
      "Custom webhook integrations (Discord / Slack)",
      "Dedicated account concierge manager",
      "VIP early feature access",
    ],
    specs: {
      scans: "Continuous / Instant",
      watches: "Unlimited + Multi-region",
      channels: "SMS, Webhooks, Slack",
      autoBuy: "Autonomous Auto-Checkout",
    },
  },
];

const PRICING_FAQS = [
  {
    q: "Can I cancel or change my plan anytime?",
    a: "Yes. There are no contracts or commitments. You can upgrade, downgrade, or cancel your subscription with a single click inside your dashboard settings.",
  },
  {
    q: "How does the 7-day Pro trial work?",
    a: "You get full, unrestricted access to all Pro Shopper features for 7 days. You can experience real-time 60-second alerts with zero risk.",
  },
  {
    q: "How fast is Cani compared to standard stock alert tools?",
    a: "Most price trackers refresh every 6–24 hours. Cani runs autonomous headless browser agents continuously, checking dynamic DOM elements and size buttons every 60 seconds on Pro.",
  },
  {
    q: "What e-commerce platforms and storefronts are supported?",
    a: "Cani uses autonomous visual and DOM comprehension, meaning it works on virtually any public website with a URL: Shopify, Amazon, SSENSE, Farfetch, Nike, Grailed, and independent boutiques.",
  },
  {
    q: "How does the Autonomous Auto-Buy agent work?",
    a: "Concierge users can configure spend limits and pre-authorize payment credentials. When the exact item restocks at your target price, Cani can autonomously reserve and checkout the item for you.",
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <>
      <Navbar />

      <main className="bg-white min-h-screen">
        {/* Header Section */}
        <section className="px-6 sm:px-8 pt-16 pb-12 max-w-5xl mx-auto text-center">
          <AnimatedContent distance={40} direction="vertical" delay={0.1}>
            <h1 className="font-serif text-5xl sm:text-6xl text-gray-900 leading-tight">
              Invest in your time back.
            </h1>
            <p className="text-gray-600 text-base sm:text-lg mt-4 max-w-2xl mx-auto">
              Never refresh a product page again. Pick a plan tailored to how you shop.
            </p>

            {/* Billing Cycle Toggle */}
            <div className="mt-10 inline-flex items-center p-1.5 rounded-full border border-gray-200 bg-gray-50/80 shadow-2xs">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-5 py-2 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                  billingCycle === "monthly"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Monthly billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`px-5 py-2 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                  billingCycle === "annual"
                    ? "bg-black text-white shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <span>Annual billing</span>
                <span className="px-2 py-0.5 rounded-full text-2xs bg-emerald-500/20 text-emerald-300 font-semibold">
                  Save 20%
                </span>
              </button>
            </div>
          </AnimatedContent>
        </section>

        {/* Pricing Cards Grid */}
        <section className="px-6 sm:px-8 py-8 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {PLANS.map((plan, index) => {
              const price =
                billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;

              return (
                <AnimatedContent
                  key={plan.id}
                  distance={40}
                  direction="vertical"
                  delay={0.15 + index * 0.1}
                >
                  <div
                    className={`h-full rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative ${
                      plan.isPopular
                        ? "bg-neutral-950 text-white shadow-2xl border border-neutral-800 ring-1 ring-neutral-800"
                        : "bg-white text-gray-900 border border-gray-200/90 shadow-xs hover:border-gray-300"
                    }`}
                  >
                    {/* Top Tier Info */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-serif text-2xl font-medium">
                          {plan.name}
                        </h3>
                        {plan.badge && (
                          <span className="text-xs bg-white text-black font-semibold px-3 py-1 rounded-full shadow-xs">
                            {plan.badge}
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-xs leading-relaxed mb-6 ${
                          plan.isPopular ? "text-neutral-400" : "text-gray-500"
                        }`}
                      >
                        {plan.description}
                      </p>

                      {/* Price Display */}
                      <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-gray-100/10">
                        <span className="font-serif text-5xl font-normal">
                          ${price}
                        </span>
                        <span
                          className={`text-xs ${
                            plan.isPopular ? "text-neutral-400" : "text-gray-500"
                          }`}
                        >
                          / month
                        </span>
                        {billingCycle === "annual" && plan.monthlyPrice > 0 && (
                          <span
                            className={`text-2xs ml-2 ${
                              plan.isPopular
                                ? "text-emerald-400"
                                : "text-emerald-600 font-medium"
                            }`}
                          >
                            billed annually
                          </span>
                        )}
                      </div>

                      {/* Key Features List */}
                      <div className="space-y-3.5 mb-8">
                        <p
                          className={`text-xs font-mono uppercase tracking-wider ${
                            plan.isPopular ? "text-neutral-400" : "text-gray-400"
                          }`}
                        >
                          What's included:
                        </p>
                        {plan.features.map((feat, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <span
                              className={`mt-0.5 shrink-0 ${
                                plan.isPopular
                                  ? "text-emerald-400"
                                  : "text-gray-900"
                              }`}
                            >
                              <Check size={14} weight="bold" />
                            </span>
                            <span
                              className={`text-xs leading-normal ${
                                plan.isPopular
                                  ? "text-neutral-300"
                                  : "text-gray-600"
                              }`}
                            >
                              {feat}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div>
                      <button
                        type="button"
                        className={`w-full py-3 px-5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                          plan.isPopular
                            ? "bg-white text-black hover:bg-neutral-100 shadow-md font-semibold"
                            : "bg-black text-white hover:bg-neutral-800"
                        }`}
                      >
                        <span>{plan.buttonText}</span>
                        <ArrowRight size={13} weight="bold" />
                      </button>
                    </div>
                  </div>
                </AnimatedContent>
              );
            })}
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="px-6 sm:px-8 py-20 max-w-5xl mx-auto">
          <AnimatedContent distance={40} direction="vertical" delay={0.1}>
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl sm:text-4xl text-gray-900">
                Detailed Plan Comparison
              </h2>
              <p className="text-xs text-gray-500 mt-2">
                All plans include universal storefront support and zero-spam verification.
              </p>
            </div>

            <div className="border border-gray-200 rounded-3xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 border-b border-gray-200 font-serif text-sm text-gray-900">
                  <tr>
                    <th className="p-4 sm:p-6">Feature</th>
                    <th className="p-4 sm:p-6">Explorer</th>
                    <th className="p-4 sm:p-6 bg-neutral-100/70 font-semibold">Pro Shopper</th>
                    <th className="p-4 sm:p-6">Concierge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-600">
                  <tr>
                    <td className="p-4 sm:p-6 font-medium text-gray-900">Scan Frequency</td>
                    <td className="p-4 sm:p-6">1 hour</td>
                    <td className="p-4 sm:p-6 bg-neutral-50/50 font-semibold text-gray-900">60 seconds</td>
                    <td className="p-4 sm:p-6">Continuous / Instant</td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-6 font-medium text-gray-900">Active Watches</td>
                    <td className="p-4 sm:p-6">3 items</td>
                    <td className="p-4 sm:p-6 bg-neutral-50/50 font-semibold text-gray-900">Unlimited</td>
                    <td className="p-4 sm:p-6">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-6 font-medium text-gray-900">Notification Channels</td>
                    <td className="p-4 sm:p-6">Email</td>
                    <td className="p-4 sm:p-6 bg-neutral-50/50 font-semibold text-gray-900">SMS, Push, Email</td>
                    <td className="p-4 sm:p-6">SMS, Webhooks, Slack</td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-6 font-medium text-gray-900">Checkout Handoff</td>
                    <td className="p-4 sm:p-6">Manual Link</td>
                    <td className="p-4 sm:p-6 bg-neutral-50/50 font-semibold text-gray-900">1-Click Cart Pre-fill</td>
                    <td className="p-4 sm:p-6">Autonomous Auto-Buy</td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-6 font-medium text-gray-900">Anti-Bot & Proxy Pool</td>
                    <td className="p-4 sm:p-6">Standard</td>
                    <td className="p-4 sm:p-6 bg-neutral-50/50 font-semibold text-gray-900">Priority Pool</td>
                    <td className="p-4 sm:p-6">Dedicated Residential</td>
                  </tr>
                  <tr>
                    <td className="p-4 sm:p-6 font-medium text-gray-900">Multi-Region Storefronts</td>
                    <td className="p-4 sm:p-6">—</td>
                    <td className="p-4 sm:p-6 bg-neutral-50/50">US / EU</td>
                    <td className="p-4 sm:p-6">US, EU, UK, JP, Global</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </AnimatedContent>
        </section>

        {/* Pricing FAQ Section */}
        <section className="px-6 sm:px-8 py-16 max-w-4xl mx-auto border-t border-gray-100">
          <AnimatedContent distance={40} direction="vertical" delay={0.1}>
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl sm:text-4xl text-gray-900">
                Frequently Asked Questions
              </h2>
              <p className="text-xs text-gray-500 mt-2">
                Have questions before choosing a plan? We've got answers.
              </p>
            </div>

            <div className="space-y-4">
              {PRICING_FAQS.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-2xl p-6 transition-colors duration-200"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(index)}
                      className="w-full flex items-center justify-between text-left cursor-pointer gap-4"
                    >
                      <span className="font-serif text-lg text-gray-900 font-medium">
                        {faq.q}
                      </span>
                      <Plus
                        size={16}
                        className={`text-gray-600 shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-45" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className="text-xs text-gray-600 leading-relaxed mt-4 pt-3 border-t border-gray-100">
                            {faq.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </AnimatedContent>
        </section>

        {/* Bottom CTA Banner */}
        <section className="px-6 sm:px-8 py-20 max-w-5xl mx-auto text-center">
          <div className="bg-neutral-900 text-white rounded-3xl p-10 sm:p-14 relative overflow-hidden">
            <div className="relative z-10 max-w-xl mx-auto">
              <h2 className="font-serif text-3xl sm:text-4xl leading-tight">
                Ready to stop manually checking product tabs?
              </h2>
              <p className="text-neutral-400 text-xs sm:text-sm mt-3 mb-8 leading-relaxed">
                Join thousands of shoppers using Cani to catch restocks, price drops, and rare pieces the second they go live.
              </p>
              <button
                type="button"
                className="bg-white text-black px-6 py-3 rounded-full text-xs font-semibold hover:bg-neutral-100 transition cursor-pointer shadow-lg inline-flex items-center gap-2"
              >
                <span>Get Started with Cani</span>
                <ArrowRight size={14} weight="bold" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
