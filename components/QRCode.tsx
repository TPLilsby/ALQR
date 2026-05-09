"use client";
import { useEffect, useState } from "react";
import QRCodeLib from "qrcode";
import { Download } from "lucide-react";

interface QRCodeProps {
  url: string;
  companyName?: string;
  displaySize?: number;
  downloadSize?: number;
}

export default function QRCode({
  url,
  companyName,
  displaySize = 200,
  downloadSize = 400,
}: QRCodeProps) {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const options = {
      margin: 2,
      errorCorrectionLevel: "M" as const,
      color: { dark: "#000000", light: "#FFFFFF" },
    };

    Promise.all([
      QRCodeLib.toDataURL(url, { ...options, width: displaySize }),
      QRCodeLib.toDataURL(url, { ...options, width: downloadSize }),
    ]).then(([display, download]) => {
      if (!cancelled) {
        setDisplayUrl(display);
        setDownloadUrl(download);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [url, displaySize, downloadSize]);

  const downloadFilename = `alqr-${(companyName ?? "qrcode")
    .replace(/\s+/g, "-")
    .toLowerCase()}.png`;

  return (
    <div className="flex flex-col items-center gap-4">
      {displayUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={displayUrl}
          alt={`QR-kode til ${url}`}
          width={displaySize}
          height={displaySize}
          className="rounded-lg"
        />
      ) : (
        <div
          style={{ width: displaySize, height: displaySize }}
          className="bg-gray-100 rounded-lg flex items-center justify-center"
        >
          <div className="w-8 h-8 border-2 border-green-brand border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {companyName && (
        <p className="text-sm text-gray-500">{companyName}</p>
      )}

      <a
        href={downloadUrl ?? "#"}
        download={downloadFilename}
        className={`inline-flex items-center gap-2 w-full justify-center bg-green-brand text-white font-semibold px-6 py-3 rounded-lg transition-all ${
          !downloadUrl
            ? "opacity-50 pointer-events-none"
            : "hover:opacity-90 active:scale-95"
        }`}
      >
        <Download size={16} />
        Download QR-kode
      </a>
    </div>
  );
}
