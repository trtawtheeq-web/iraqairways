/**
 * INTERACTIVE MAP COMPONENT - Saudi Arabia Only using Leaflet
 * 
 * Features:
 * - Click on map to place marker
 * - Drag marker to move location
 * - Search for address
 * - Works on mobile and desktop
 * - No API key required (OpenStreetMap)
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Search } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface InteractiveMapProps {
  className?: string;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  searchAddress?: string;
  title?: string;
}

export function InteractiveMap({
  className,
  initialCenter = { lat: 24.7136, lng: 46.6753 }, // Riyadh, Saudi Arabia
  initialZoom = 12,
  onLocationSelect,
  searchAddress = "",
  title = "عنوان داخل المملكة",
}: InteractiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const [currentLocation, setCurrentLocation] = useState(initialCenter);
  const [searchInput, setSearchInput] = useState(searchAddress);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [address, setAddress] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);

  // Saudi Arabia bounds: lat 16.0 to 32.2, lng 34.5 to 55.7
  const SAUDI_BOUNDS = {
    north: 32.2,
    south: 16.0,
    east: 55.7,
    west: 34.5,
  };

  // Check if location is within Saudi Arabia bounds
  const isSaudiLocation = (lat: number, lng: number): boolean => {
    return (
      lat >= SAUDI_BOUNDS.south &&
      lat <= SAUDI_BOUNDS.north &&
      lng >= SAUDI_BOUNDS.west &&
      lng <= SAUDI_BOUNDS.east
    );
  };

  // Get address from coordinates using reverse geocoding
  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            "Accept": "application/json",
          },
        }
      );
      const data = await response.json();
      const resultAddress = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setAddress(resultAddress);
      if (onLocationSelect) {
        onLocationSelect({ lat, lng, address: resultAddress });
      }
    } catch (err) {
      console.error("[InteractiveMap] Reverse geocoding error:", err);
      setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) {
      return;
    }

    try {
      console.log("[InteractiveMap] Initializing Leaflet map");

      // Create map
      map.current = L.map(mapContainer.current).setView(
        [initialCenter.lat, initialCenter.lng],
        initialZoom
      );

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map.current);

      // Create custom icon (Google Maps style marker)
      const googleMapsMarkerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <path d="M20 0C11.7 0 5 6.7 5 15c0 8 15 25 15 25s15-17 15-25c0-8.3-6.7-15-15-15z" fill="#EF4444"/>
        <circle cx="20" cy="15" r="6" fill="white"/>
      </svg>`;
      const googleMapsMarkerBase64 = btoa(googleMapsMarkerSvg);
      const customIcon = L.icon({
        iconUrl: `data:image/svg+xml;base64,${googleMapsMarkerBase64}`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
      });

      // Create marker
      marker.current = L.marker([initialCenter.lat, initialCenter.lng], {
        icon: customIcon,
        draggable: true,
        title: "اختر الموقع",
      }).addTo(map.current);

      // Handle marker drag end
      marker.current.on("dragend", () => {
        if (marker.current) {
          const pos = marker.current.getLatLng();
          const lat = pos.lat;
          const lng = pos.lng;

          if (!isSaudiLocation(lat, lng)) {
            setError("الموقع خارج المملكة العربية السعودية");
            // Return marker to previous position
            marker.current.setLatLng([currentLocation.lat, currentLocation.lng]);
            return;
          }

          setCurrentLocation({ lat, lng });
          setError("");
          map.current?.setView([lat, lng], initialZoom);
          getAddressFromCoordinates(lat, lng);
        }
      });

      // Handle map click
      map.current.on("click", (e: L.LeafletMouseEvent) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        if (!isSaudiLocation(lat, lng)) {
          setError("الموقع خارج المملكة العربية السعودية");
          return;
        }

        setCurrentLocation({ lat, lng });
        setError("");

        if (marker.current) {
          marker.current.setLatLng([lat, lng]);
        }

        getAddressFromCoordinates(lat, lng);
      });

      // Get initial address
      getAddressFromCoordinates(initialCenter.lat, initialCenter.lng);
      setMapLoaded(true);
      console.log("[InteractiveMap] Map initialized successfully");
    } catch (error) {
      console.error("[InteractiveMap] Error initializing map:", error);
      setError("فشل تحميل الخريطة");
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Handle search
  const handleSearch = async () => {
    if (!searchInput.trim()) {
      setError("الرجاء إدخال عنوان");
      return;
    }

    setIsSearching(true);
    setError("");

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchInput + " Saudi Arabia")}&limit=10&countrycodes=sa`,
        {
          headers: {
            "Accept": "application/json",
          },
        }
      );

      const results = await response.json();

      if (results && results.length > 0) {
        // Find first result within Saudi Arabia bounds
        let foundLocation = null;
        for (const result of results) {
          const lat = parseFloat(result.lat);
          const lng = parseFloat(result.lon);
          if (isSaudiLocation(lat, lng)) {
            foundLocation = { lat, lng, address: result.display_name };
            break;
          }
        }

        if (foundLocation) {
          setCurrentLocation({ lat: foundLocation.lat, lng: foundLocation.lng });
          setAddress(foundLocation.address);

          if (map.current) {
            map.current.setView([foundLocation.lat, foundLocation.lng], 15);
          }

          if (marker.current) {
            marker.current.setLatLng([foundLocation.lat, foundLocation.lng]);
          }

          if (onLocationSelect) {
            onLocationSelect({
              lat: foundLocation.lat,
              lng: foundLocation.lng,
              address: foundLocation.address,
            });
          }

          console.log("[InteractiveMap] Search result:", foundLocation.address);
        } else {
          setError(
            "العنوان خارج المملكة العربية السعودية. الرجاء البحث عن عنوان داخل السعودية."
          );
        }
      } else {
        setError("لم يتم العثور على العنوان داخل السعودية");
      }
    } catch (err) {
      console.error("[InteractiveMap] Search error:", err);
      setError("خطأ في البحث عن العنوان");
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Title */}
      {title && (
        <h3 className="text-gray-700 font-medium">{title}</h3>
      )}

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            placeholder="ابحث عن عنوان في السعودية..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pr-10"
            disabled={isSearching || !mapLoaded}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        <Button
          onClick={handleSearch}
          disabled={isSearching || !mapLoaded}
          className="bg-blue-600 hover:bg-blue-700 h-12 px-4"
        >
          {isSearching ? "جاري..." : "بحث"}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {/* Current Location Display */}
      <div className="text-sm text-gray-600 flex items-center gap-2 break-words">
        <MapPin className="w-4 h-4 flex-shrink-0" />
        <span>
          {address || `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`}
        </span>
      </div>

      {/* Map Container */}
      <div
        ref={mapContainer}
        className={cn(
          "w-full h-[300px] md:h-[400px] bg-gray-200 rounded-lg overflow-hidden border border-gray-300",
          "touch-none"
        )}
        style={{ minHeight: "300px" }}
      />

      {/* Instructions */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>💡 يمكنك:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>البحث عن عنوان في السعودية</li>
          <li>النقر على الخريطة لتحديد موقع</li>
          <li>سحب الدبوس لتحريك الموقع</li>
        </ul>
      </div>
    </div>
  );
}
