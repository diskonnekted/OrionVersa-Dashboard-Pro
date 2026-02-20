"use client";

import dynamic from "next/dynamic";
import { Navigation } from "lucide-react";

// Pindahkan dynamic import ke Client Component
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full bg-gray-200 animate-pulse rounded-xl flex items-center justify-center border-2 border-gray-300">
      <div className="flex flex-col items-center gap-2">
        <Navigation className="h-10 w-10 text-blue-500 animate-bounce" />
        <p className="text-gray-600 font-semibold text-lg">Memuat Peta...</p>
      </div>
    </div>
  ),
});

export default function MapWrapper() {
  return <MapComponent />;
}
