import { cn } from "@/lib/utils";

interface SimpleMapProps {
  className?: string;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onAddressSelect?: (address: string) => void;
}

export function SimpleMap({
  className,
  initialCenter = { lat: 24.7136, lng: 46.6753 }, // Riyadh, Saudi Arabia
  initialZoom = 12,
  onAddressSelect,
}: SimpleMapProps) {
  // Create embed URL for Google Maps - simplified version that works on mobile
  const lat = initialCenter.lat;
  const lng = initialCenter.lng;
  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyDummyKey&q=${lat},${lng}`;
  
  // Fallback: Use a simpler embed URL that doesn't require API key
  const simpleEmbedUrl = `https://maps.google.com/maps?q=${lat},${lng}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className={cn("w-full h-[300px] md:h-[400px] bg-gray-200 rounded-lg overflow-hidden", className)}>
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen={true}
        referrerPolicy="no-referrer-when-downgrade"
        src={simpleEmbedUrl}
      ></iframe>
    </div>
  );
}
