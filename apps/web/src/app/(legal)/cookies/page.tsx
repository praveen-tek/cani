import { LegalLayout } from "@/components/shared/legal-layout";

export const metadata = {
  title: "Cookie Policy — Cani",
  description: "Understand how Cani uses cookies and local storage for authentication and performance.",
};

export default function CookiesPage() {
  return (
    <LegalLayout
      title="Cookie Policy"
      subtitle="Transparent explanation of how and why we use cookies and local storage."
      lastUpdated="January 15, 2026"
    >
      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-gray-900">1. What Are Cookies?</h2>
        <p>
          Cookies and local storage tokens are small data files placed on your device to keep you signed in, remember your preferences, and maintain session security.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-gray-900">2. Categories of Cookies We Use</h2>
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl border border-gray-200">
            <h4 className="font-serif text-sm font-semibold text-gray-900 mb-1">
              Strictly Essential Cookies
            </h4>
            <p className="text-gray-600">
              Required for basic account authentication, session CSRF protection, and billing portal handoffs. These cannot be disabled.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-gray-200">
            <h4 className="font-serif text-sm font-semibold text-gray-900 mb-1">
              Performance & Preferences
            </h4>
            <p className="text-gray-600">
              Remembers your selected alert view styles, filter settings, and dark/light system preferences.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-gray-200">
            <h4 className="font-serif text-sm font-semibold text-gray-900 mb-1">
              Third-Party Advertising Cookies
            </h4>
            <p className="text-gray-600 font-medium text-emerald-700">
              None. Cani does not place cross-site retargeting or 3rd-party ad trackers.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-gray-900">3. Managing Your Cookie Settings</h2>
        <p>
          You can adjust or disable cookies in your browser settings at any time. Note that blocking essential session cookies may prevent you from logging into your Cani dashboard.
        </p>
      </section>
    </LegalLayout>
  );
}
