import { LegalLayout } from "@/components/shared/legal-layout";

export const metadata = {
  title: "Terms of Service — Cani",
  description: "Terms and conditions governing the use of Cani's autonomous shopping agent platform.",
};

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="Please read these terms carefully before using Cani's autonomous shopping agent services."
      lastUpdated="January 15, 2026"
    >
      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-gray-900">1. Acceptance of Terms</h2>
        <p>
          By accessing, subscribing to, or using the Cani platform, browser extensions, APIs, or notification services (collectively, the &ldquo;Service&rdquo;), provided by Cani Inc. (&ldquo;Cani&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms, do not access or use the Service.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-gray-900">2. Description of the Service</h2>
        <p>
          Cani provides autonomous software agents that monitor publicly accessible third-party e-commerce product pages on your behalf, extract inventory and price status, and send automated notifications via email, SMS, push, or webhooks based on your user-configured criteria.
        </p>
        <p>
          Cani is an independent productivity and monitoring tool. Cani is not affiliated with, endorsed by, or sponsored by any third-party retailers, storefronts, brands, or marketplaces monitored through the Service (including but not limited to SSENSE, Amazon, Nike, Shopify, or others).
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-gray-900">3. User Accounts & Responsibilities</h2>
        <p>
          To use certain features of the Service, you must register for an account. You agree to provide accurate and complete information and to keep your credentials secure. You are solely responsible for all activities that occur under your account.
        </p>
        <p>
          You agree not to use the Service for any unlawful, abusive, or harmful purpose, including:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>Attempting to disrupt or overburden any third-party retailer&apos;s infrastructure.</li>
          <li>Circumventing fair purchase limits established by retailers for fraudulent resale or illegal ticket-scalping purposes.</li>
          <li>Reverse engineering, decompiling, or probing Cani&apos;s underlying proprietary reasoning engine or infrastructure.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-gray-900">4. Disclaimers & Limitation of Liability</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-xs text-gray-700 space-y-2">
          <p className="font-semibold text-gray-900 uppercase tracking-wider">
            Important Retailer Disclaimer:
          </p>
          <p>
            Cani acts as a notification and automation assistant. Cani does not guarantee retailer price accuracy, stock availability, successful item checkout, or that a third-party merchant will honor a listed price. Third-party storefronts may cancel orders, change prices, or alter inventory without notice.
          </p>
        </div>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, CANI INC. SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, MISSED PRODUCT DROPS, OR PURCHASE DISPUTES WITH THIRD-PARTY MERCHANTS.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-gray-900">5. Subscriptions, Billing & Cancellations</h2>
        <p>
          Certain tiers of the Service (such as Pro Shopper and Concierge) require a recurring paid subscription. Subscriptions automatically renew at the beginning of each billing cycle (monthly or annually) unless canceled prior to the renewal date.
        </p>
        <p>
          You may cancel your subscription at any time directly through your account dashboard. Upon cancellation, your subscription will remain active until the conclusion of your current paid billing period.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-gray-900">6. Modifications & Termination</h2>
        <p>
          We reserve the right to modify these Terms at any time. We will notify you of material changes by updating the &ldquo;Last Updated&rdquo; date or via email. Your continued use of the Service after any modification constitutes your acceptance of the updated Terms.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-gray-900">7. Governing Law & Dispute Resolution</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law principles. Any dispute arising under these Terms shall be resolved via binding individual arbitration.
        </p>
      </section>
    </LegalLayout>
  );
}
