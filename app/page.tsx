import Link from "next/link";
import { Check } from "lucide-react";

const features = [
  "Finder nærmeste afdeling automatisk",
  "Ingen registrering nødvendig",
  "Virker internationalt",
  "100% GDPR-compliant",
];

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen max-w-md mx-auto px-4">
      <div className="flex-1 flex flex-col justify-center py-16 gap-8">

        {/* Logo + tagline */}
        <div className="text-center">
          <p className="text-3xl font-bold" style={{ color: "#267D39" }}>ALQR</p>
          <p className="text-sm text-gray-500 mt-1">Active Location QR</p>
        </div>

        {/* Slogan + beskrivelse */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Scan og du vil finde
          </h1>
          <p className="text-base text-gray-500 mt-2">
            Én QR-kode der automatisk finder din nærmeste afdeling.
          </p>
        </div>

        {/* CTA-knapper */}
        <div className="flex flex-col gap-3">
          <Link
            href="/create"
            className="block font-semibold px-6 py-3 rounded-lg w-full text-center text-white transition-opacity hover:opacity-90 active:scale-95"
            style={{ backgroundColor: "#267D39" }}
          >
            Opret QR-kode
          </Link>
          <Link
            href="/demo"
            className="block font-semibold px-6 py-3 rounded-lg w-full text-center transition-all active:scale-95"
            style={{ border: "2px solid #267D39", color: "#267D39" }}
          >
            Prøv demo med simulator
          </Link>
          <Link
            href="/scan?domain=gsv.dk"
            className="block font-medium px-4 py-2 w-full text-center hover:underline"
            style={{ color: "#267D39" }}
          >
            Scan QR-kode
          </Link>
        </div>

        {/* Features */}
        <ul className="space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-3">
              <Check size={18} style={{ color: "#267D39" }} className="shrink-0" />
              <span className="text-base text-gray-900">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <footer className="py-6 text-center">
        <p className="text-sm text-gray-400">Fortroligt — ALQR © 2026</p>
      </footer>
    </main>
  );
}
