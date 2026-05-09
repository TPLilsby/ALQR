"use client";
import dynamic from "next/dynamic";
import type { MapProps } from "./MapInner";

const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => (
    <div
      style={{ height: "200px" }}
      className="w-full rounded-xl bg-gray-100 flex items-center justify-center"
    >
      <span className="text-sm text-gray-400">Indlæser kort...</span>
    </div>
  ),
});

export default function Map(props: MapProps) {
  return <MapInner {...props} />;
}
