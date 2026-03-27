import { ShieldCheck, MessageCircle, Globe } from "lucide-react";

const trustItems = [
  {
    icon: ShieldCheck,
    label: "Identity Verified",
    description: "Every traveler is verified for your safety",
  },
  {
    icon: MessageCircle,
    label: "Secure Chat",
    description: "Private, encrypted messaging with your buddy",
  },
  {
    icon: Globe,
    label: "Global Community",
    description: "Connect with trusted travelers worldwide",
  },
];

export function TrustBar() {
  return (
    <section className="border-t border-border bg-background py-8 sm:py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-8 px-4 sm:flex-row sm:gap-12 lg:gap-16">
        {trustItems.map(({ icon: Icon, label, description }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:gap-4 sm:text-left"
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="size-6" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{label}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
