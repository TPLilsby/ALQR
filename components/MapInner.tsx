"use client";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, Marker } from "leaflet";
import { Branch } from "@/types/branch";

interface MapBaseProps {
  height?: string;
  className?: string;
}

interface MapClickableProps extends MapBaseProps {
  mode: "clickable";
  initialCenter?: [number, number];
  initialZoom?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLat?: number;
  selectedLng?: number;
  flyToCenter?: [number, number];
  flyToZoom?: number;
}

interface MapReadonlyProps extends MapBaseProps {
  mode: "readonly";
  branches: Branch[];
  userLat?: number;
  userLng?: number;
}

export type MapProps = MapClickableProps | MapReadonlyProps;

export default function MapInner(props: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const clickMarkerRef = useRef<Marker | null>(null);

  const selectedLat = props.mode === "clickable" ? props.selectedLat : undefined;
  const selectedLng = props.mode === "clickable" ? props.selectedLng : undefined;
  const flyToCenter = props.mode === "clickable" ? props.flyToCenter : undefined;
  const flyToZoom = props.mode === "clickable" ? props.flyToZoom : undefined;

  // Initialiser kortet én gang
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;

      // Fix webpack marker icon bug
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "/leaflet/marker-icon.png",
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      });

      const center: [number, number] =
        props.mode === "clickable"
          ? (props.initialCenter ?? [56.0, 10.5])
          : props.mode === "readonly" && props.branches.length > 0
          ? [props.branches[0].lat, props.branches[0].lng]
          : [56.0, 10.5];

      const map = L.map(containerRef.current, {
        center,
        zoom: props.mode === "clickable" ? (props.initialZoom ?? 6) : 7,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      if (props.mode === "clickable") {
        const onLocationSelect = props.onLocationSelect;
        map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
          onLocationSelect(e.latlng.lat, e.latlng.lng);
        });
      }

      if (props.mode === "readonly") {
        const validBranches = props.branches.filter(
          (b) => b.lat !== 0 && b.lng !== 0
        );

        validBranches.forEach((branch) => {
          L.marker([branch.lat, branch.lng])
            .addTo(map)
            .bindPopup(`<b>${branch.name}</b><br>${branch.address}`);
        });

        if (props.userLat && props.userLng) {
          const userIcon = L.divIcon({
            className: "",
            html: '<div style="width:14px;height:14px;background:#267D39;border:2px solid white;border-radius:50%;box-shadow:0 0 4px rgba(0,0,0,0.3)"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });
          L.marker([props.userLat, props.userLng], { icon: userIcon }).addTo(map);
        }

        const allPoints: [number, number][] = [
          ...validBranches.map((b): [number, number] => [b.lat, b.lng]),
          ...(props.userLat && props.userLng
            ? [[props.userLat, props.userLng] as [number, number]]
            : []),
        ];
        if (allPoints.length > 1) {
          map.fitBounds(L.latLngBounds(allPoints), { padding: [20, 20] });
        }
      }
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Opdater klikbar marker når position ændres — fjern markør ved undefined
  useEffect(() => {
    if (!mapRef.current) return;
    if (selectedLat === undefined || selectedLng === undefined) {
      if (clickMarkerRef.current) {
        clickMarkerRef.current.remove();
        clickMarkerRef.current = null;
      }
      return;
    }
    import("leaflet").then((L) => {
      if (!mapRef.current) return;
      if (clickMarkerRef.current) {
        clickMarkerRef.current.setLatLng([selectedLat, selectedLng]);
      } else {
        clickMarkerRef.current = L.marker([selectedLat, selectedLng]).addTo(
          mapRef.current
        );
      }
    });
  }, [selectedLat, selectedLng]);

  // Fly til ny position ved domæne-skift
  useEffect(() => {
    if (!mapRef.current || !flyToCenter) return;
    mapRef.current.flyTo(flyToCenter, flyToZoom ?? 6, { animate: true, duration: 0.8 });
  }, [flyToCenter, flyToZoom]);

  return (
    <div
      ref={containerRef}
      style={{ height: props.height ?? "200px" }}
      className={`w-full rounded-xl overflow-hidden ${props.className ?? ""}`}
    />
  );
}
