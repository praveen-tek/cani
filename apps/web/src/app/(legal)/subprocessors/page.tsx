import { LegalLayout } from "@/components/shared/legal-layout";

export const metadata = {
  title: "Subprocessors — Cani",
  description: "Official list of third-party subprocessors utilized by Cani Inc.",
};

const SUBPROCESSORS = [
  {
    name: "Amazon Web Services (AWS)",
    role: "Cloud Infrastructure & Database Hosting",
    location: "United States (us-east-1)",
    dpa: "Executed",
  },
  {
    name: "Vercel Inc.",
    role: "Frontend Edge Hosting & Serverless Compute",
    location: "United States / Global Edge",
    dpa: "Executed",
  },
  {
    name: "Stripe, Inc.",
    role: "Payment Processing & Merchant Billing",
    location: "United States",
    dpa: "Executed",
  },
  {
    name: "Resend / Postmark",
    role: "Transactional Email & Alert Delivery",
    location: "United States",
    dpa: "Executed",
  },
  {
    name: "Twilio Inc.",
    role: "SMS & Urgent Text Alerts",
    location: "United States",
    dpa: "Executed",
  },
  {
    name: "Cloudflare, Inc.",
    role: "DDoS Mitigation, DNS & Global WAF Security",
    location: "Global",
    dpa: "Executed",
  },
  {
    name: "OpenAI, LLC / Anthropic PBC",
    role: "Natural Language Reasoning & Query Parsing (Zero Data Retention API Tier)",
    location: "United States",
    dpa: "Executed",
  },
];

export default function SubprocessorsPage() {
  return (
    <LegalLayout
      title="Authorized Subprocessors"
      subtitle="To deliver reliable shopping alerts and notifications, Cani engages trusted third-party infrastructure partners."
      lastUpdated="January 15, 2026"
    >
      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-gray-900">1. Subprocessor Due Diligence</h2>
        <p>
          Cani Inc. evaluates the security, compliance, and privacy practices of all vendors prior to engagement. Each subprocessor is required to execute a Data Processing Agreement (&ldquo;DPA&rdquo;) ensuring compliance with GDPR, CCPA, and industry-standard security certifications (SOC 2, ISO 27001).
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-gray-900">2. Current Subprocessor Directory</h2>
        <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 font-serif text-sm text-gray-900">
              <tr>
                <th className="p-4">Entity Name</th>
                <th className="p-4">Service Role</th>
                <th className="p-4">Location</th>
                <th className="p-4">DPA Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-600">
              {SUBPROCESSORS.map((sub, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-semibold text-gray-900">{sub.name}</td>
                  <td className="p-4">{sub.role}</td>
                  <td className="p-4 font-mono text-gray-500">{sub.location}</td>
                  <td className="p-4">
                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5 font-medium">
                      {sub.dpa}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-gray-900">3. Notifications of Changes</h2>
        <p>
          We update this list when adding or replacing any subprocessor. You can subscribe to subprocessor update alerts by contacting <a href="mailto:security@cani.shopping" className="text-gray-900 underline">security@cani.shopping</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
