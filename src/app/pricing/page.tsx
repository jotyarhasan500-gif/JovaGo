import { PricingSection } from "@/components/pricing-section";

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="border-b border-border bg-muted/30 px-4 py-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Pricing
          </h1>
          <p className="mt-2 text-muted-foreground">
            Choose a plan and complete checkout securely with Stripe.
          </p>
        </section>

        <PricingSection />
      </main>
    </div>
  );
}
