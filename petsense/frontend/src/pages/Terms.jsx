export default function Terms() {
  return (
    <div className="min-h-screen pt-24 pb-10 px-4 sm:px-6 max-w-3xl mx-auto page-enter text-white/80 space-y-6">
      <h1 className="text-3xl font-black gradient-text mb-8">Terms of Use</h1>

      <section className="space-y-4 rounded-xl p-4 bg-amber/10 border border-amber/30 text-amber">
        <h2 className="text-lg font-bold">Important Medical Disclaimer</h2>
        <p className="text-sm">
          PetSense is an educational and wellness awareness tool. It is <strong>NOT</strong> a veterinary diagnostic device,
          and it does not provide medical advice. Any analysis or risk assessment provided by the service
          should not replace professional veterinary care. If you believe your pet is experiencing pain,
          distress, or a medical emergency, you must contact a licensed veterinarian immediately.
        </p>
      </section>

      <section className="space-y-4 mt-8">
        <h2 className="text-xl font-bold text-white">1. Acceptance of Terms</h2>
        <p>
          By accessing or using the PetSense service, you agree to be bound by these Terms.
          If you disagree with any part of the terms, then you may not access the service.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">2. User Accounts</h2>
        <p>
          You are responsible for safeguarding the password that you use to access the service and
          for any activities or actions under your password.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">3. User Content</h2>
        <p>
          You retain all your ownership rights in the media you upload. By default, your media is kept
          private and only used to generate your analysis results.
        </p>
      </section>

      <p className="text-sm text-white/50 pt-8">Last updated: Sept 2026</p>
    </div>
  )
}
