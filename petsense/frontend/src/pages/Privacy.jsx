export default function Privacy() {
  return (
    <div className="min-h-screen pt-24 pb-10 px-4 sm:px-6 max-w-3xl mx-auto page-enter text-white/80 space-y-6">
      <h1 className="text-3xl font-black gradient-text mb-8">Privacy Policy</h1>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">1. Information We Collect</h2>
        <p>
          We collect information you provide directly to us, such as when you create an account,
          add a pet profile, or upload media (photos, videos, audio) for analysis.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Provide, maintain, and improve our services (including AI models).</li>
          <li>Process and complete transactions, and send you related information.</li>
          <li>Send you technical notices, updates, security alerts, and support messages.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">3. Data Sharing</h2>
        <p>
          We do not share your personal information or uploaded media with third parties except
          with your explicit consent (e.g., opting in to data reuse for model improvement) or
          as required by law.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">4. Data Security</h2>
        <p>
          We take reasonable measures to help protect information about you from loss, theft,
          misuse and unauthorized access, disclosure, alteration and destruction.
        </p>
      </section>

      <p className="text-sm text-white/50 pt-8">Last updated: Sept 2026</p>
    </div>
  )
}
