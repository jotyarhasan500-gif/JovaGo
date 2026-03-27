"use client";

const TRUST_ITEMS = [
  { icon: "✅", text: "1,200+ Identity Verified" },
  { icon: "⭐", text: "4.9/5 User Rating" },
  { icon: "🌍", text: "50+ Countries Active" },
];

export function HeroTrustBar() {
  return (
    <div className="relative mt-8 w-full overflow-hidden rounded-full border border-white/20 bg-white/10 py-2.5 backdrop-blur-sm">
      <div className="flex animate-hero-trust-marquee gap-12 whitespace-nowrap">
        {[...TRUST_ITEMS, ...TRUST_ITEMS].map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-2 text-sm font-medium text-white/95"
          >
            <span aria-hidden>{item.icon}</span>
            <span>{item.text}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
