"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export type DreamDestination = {
  id: string;
  name: string;
  imageUrl: string;
  detailsHref?: string;
};

type DreamDestinationsProps = {
  destinations: DreamDestination[];
  className?: string;
};

export function DreamDestinations({ destinations, className = "" }: DreamDestinationsProps) {
  if (destinations.length === 0) return null;

  return (
    <div className={className}>
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-[#737373]">
        Dream Destinations
      </h2>
      <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
        <ul className="flex gap-4 pb-2" style={{ scrollbarGutter: "stable" }}>
          {destinations.map((dest) => (
            <li key={dest.id} className="shrink-0">
              <DreamDestinationCard destination={dest} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DreamDestinationCard({ destination }: { destination: DreamDestination }) {
  const href = destination.detailsHref ?? "#";

  return (
    <motion.div
      className="flex w-[260px] flex-col overflow-hidden rounded-xl border border-[#0066FF]/15 bg-card shadow-sm"
      initial={false}
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Link href={href} className="block flex-1">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={destination.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            sizes="260px"
          />
        </div>
        <div className="flex flex-col gap-3 p-4">
          <h3 className="font-semibold text-foreground">{destination.name}</h3>
          <span className="inline-flex w-fit items-center justify-center rounded-lg bg-[#0066FF]/10 px-3 py-1.5 text-sm font-medium text-[#0066FF] transition-colors hover:bg-[#0066FF]/20">
            View Details
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

/** Default dream destinations with placeholder images (Unsplash). */
export const DEFAULT_DREAM_DESTINATIONS: DreamDestination[] = [
  {
    id: "kyoto",
    name: "Kyoto, Japan",
    imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=520&q=80",
    detailsHref: "/explore",
  },
  {
    id: "santorini",
    name: "Santorini, Greece",
    imageUrl: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=520&q=80",
    detailsHref: "/explore",
  },
  {
    id: "bali",
    name: "Bali, Indonesia",
    imageUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=520&q=80",
    detailsHref: "/explore",
  },
  {
    id: "paris",
    name: "Paris, France",
    imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=520&q=80",
    detailsHref: "/explore",
  },
  {
    id: "iceland",
    name: "Reykjavik, Iceland",
    imageUrl: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=520&q=80",
    detailsHref: "/explore",
  },
];
