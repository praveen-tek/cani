import { LegalLayout } from "@/components/shared/legal-layout";

export const metadata = {
  title: "Security & Trust — Cani",
  description: "Learn about Cani's encryption standards, infrastructure security, and vulnerability reporting.",
};

export default function SecurityPage() {
  return (
    <LegalLayout
      title="Security & Trust"
      subtitle="How we protect your account, authentication tokens, and monitoring sessions."
      lastUpdated="January 15, 2026"
    >
      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-gray-900">1. Infrastructure & Architecture</h2>
        <p>
          Cani is built on modern, secure cloud infrastructure hosted in SOC 2 Type II certified data centers. Our headless browser agents run in isolated sandbox containers with strictly scoped network policies.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-gray-900">2. Encryption Standards</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>
            <strong className="text-gray-900">In Transit:</strong> All web traffic and agent API payloads are encrypted with TLS 1.3 with strict HSTS enforcement.
          </li>
          <li>
            <strong className="text-gray-900">At Rest:</strong> Databases, configuration stores, and credentials are encrypted using AES-256 with KMS key rotation.
          </li>
          <li>
            <strong className="text-gray-900">Payment Security:</strong> Payment information is processed via PCI-DSS Level 1 certified infrastructure (Stripe).
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-gray-900">3. Responsible Disclosure</h2>
        <p>
          We welcome contributions from independent security researchers. If you identify a potential security vulnerability in any Cani product or API, please report it directly to <a href="mailto:security@cani.shopping" className="text-gray-900 underline">security@cani.shopping</a> with detailed reproduction steps. We commit to reviewing reports within 24 hours.
        </p>
      </section>
    </LegalLayout>
  );
}
