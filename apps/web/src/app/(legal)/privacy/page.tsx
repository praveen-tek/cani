import { LegalLayout } from "@/components/shared/legal-layout";

export const metadata = {
  title: "Privacy Policy — Cani",
  description: "Learn how Cani handles, protects, and respects your data and privacy.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="We believe in privacy-first autonomous shopping. We do not sell your personal data or scrape your browsing history."
      lastUpdated="January 15, 2026"
    >
      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-gray-900">1. Overview & Commitment</h2>
        <p>
          Cani Inc. (&ldquo;Cani&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is committed to protecting your privacy and being transparent about what data we process. This Privacy Policy explains what information we collect, how it is used, and how you can manage or delete your data under GDPR, CCPA/CPRA, and applicable privacy regulations.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-gray-900">2. Information We Collect</h2>
        <p>We only collect data necessary to provide our product monitoring service:</p>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>
            <strong className="text-gray-900">Account & Contact Info:</strong> Email address, name, encrypted password, and optional phone number (if you opt into SMS alerts).
          </li>
          <li>
            <strong className="text-gray-900">Watch List Data:</strong> The exact product URLs you submit, user-defined prompt triggers (e.g. &ldquo;size 10&rdquo;, &ldquo;price &lt; $200&rdquo;), and alert preferences.
          </li>
          <li>
            <strong className="text-gray-900">Billing Information:</strong> Payment card details are processed and stored securely directly by Stripe. Cani does not store your credit card numbers on our servers.
          </li>
          <li>
            <strong className="text-gray-900">Log & Telemetry Data:</strong> IP address, device type, browser user agent, and crash logs to ensure service reliability.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-xs text-emerald-900 space-y-2">
          <p className="font-semibold uppercase tracking-wider">
            What Cani NEVER Does:
          </p>
          <ul className="list-disc pl-4 space-y-1">
            <li>We do NOT sell, rent, or monetize your personal shopping data to third-party data brokers or advertisers.</li>
            <li>We do NOT track your ambient browsing history or inspect tabs outside the specific links you explicitly pin to Cani.</li>
            <li>We do NOT train public foundation models on your private personal conversations.</li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-gray-900">3. How We Use Information</h2>
        <p>We use your information exclusively to:</p>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>Execute automated product monitoring requests based on your criteria.</li>
          <li>Send timely notifications across your designated communication channels.</li>
          <li>Process billing and subscription renewals.</li>
          <li>Detect and prevent fraud, spam, or security breaches.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-gray-900">4. Your Data Rights & Choices</h2>
        <p>
          Regardless of your geography, Cani provides full data ownership rights:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li><strong className="text-gray-900">Access & Export:</strong> Request a full machine-readable JSON copy of your account data.</li>
          <li><strong className="text-gray-900">Correction:</strong> Update or modify your email, phone, or watch rules at any time.</li>
          <li><strong className="text-gray-900">Erasure (&ldquo;Right to be Forgotten&rdquo;):</strong> Delete your account and all associated watch history with a single button in settings or by emailing <a href="mailto:privacy@cani.shopping" className="text-gray-900 underline">privacy@cani.shopping</a>.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-gray-900">5. Data Retention & Security</h2>
        <p>
          We retain your watch history only for as long as your account remains active. All data in transit is encrypted using TLS 1.3, and all data at rest is encrypted using industry-standard AES-256 encryption.
        </p>
      </section>
    </LegalLayout>
  );
}
