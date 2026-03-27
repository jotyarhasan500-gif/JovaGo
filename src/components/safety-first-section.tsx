import { buttonVariants } from "@/components/ui/button";
import { IdCard, Sparkles, MapPin } from "lucide-react";

const steps = [
  {
    icon: IdCard,
    step: 1,
    title: "ID Verification",
    description:
      "We verify passports to ensure real identities.",
  },
  {
    icon: Sparkles,
    step: 2,
    title: "AI Matching",
    description:
      "Our AI connects you with buddies who share your vibe.",
  },
  {
    icon: MapPin,
    step: 3,
    title: "Secure Meetups",
    description:
      "Guidelines for safe first-time meetings in public.",
  },
];

export function SafetyFirstSection() {
  return (
    <section className="border-t border-border bg-background py-14 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-semibold text-foreground sm:text-3xl">
          Safety First
        </h2>
        <p className="mt-2 text-center text-muted-foreground">
          Our 3-step verification process keeps travel buddy connections trusted and secure.
        </p>

        <div className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6 lg:gap-10">
          {steps.map(({ icon: Icon, step, title, description }) => (
            <div
              key={step}
              className="flex flex-col items-center text-center"
            >
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                <Icon className="size-7" strokeWidth={2} />
              </div>
              <span className="mt-4 text-xs font-semibold uppercase tracking-wider text-primary">
                Step {step}
              </span>
              <h3 className="mt-1 text-lg font-semibold text-foreground">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <a
            href="#"
            className={buttonVariants({
              variant: "default",
              size: "lg",
              className:
                "h-11 bg-primary px-8 text-base font-medium text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90",
            })}
          >
            Get Verified Today
          </a>
        </div>
      </div>
    </section>
  );
}
