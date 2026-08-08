/**
 * GOOGLE MAPS FRONTEND INTEGRATION - ESSENTIAL GUIDE
 *
 * USAGE FROM PARENT COMPONENT:
 * ======
 *
 * const mapRef = useRef<google.maps.Map | null>(null);
 *
 * <MapView
 *   initialCenter={{ lat: 40.7128, lng: -74.0060 }}
 *   initialZoom={15}
 *   onMapReady={(map) => {
 *     mapRef.current = map; // Store to control map from parent anytime, google map itself is in charge of the re-rendering, not react state.
 * </MapView>
 *
 * ======
 * Available Libraries and Core Features:
 * -------------------------------
 * 📍 MARKER (from `marker` library)
 * - Attaches to map using { map, position }
 * new google.maps.marker.AdvancedMarkerElement({
 *   map,
 *   position: { lat: 37.7749, lng: -122.4194 },
 *   title: "San Francisco",
 * });
 *
 * -------------------------------
 * 🏢 PLACES (from `places` library)
 * - Does not attach directly to map; use data with your map manually.
 * const place = new google.maps.places.Place({ id: PLACE_ID });
 * await place.fetchFields({ fields: ["displayName", "location"] });
 * map.setCenter(place.location);
 * new google.maps.marker.AdvancedMarkerElement({ map, position: place.location });
 *
 * -------------------------------
 * 🧭 GEOCODER (from `geocoding` library)
 * - Standalone service; manually apply results to map.
 * const geocoder = new google.maps.Geocoder();
 * geocoder.geocode({ address: "New York" }, (results, status) => {
 *   if (status === "OK" && results[0]) {
 *     map.setCenter(results[0].geometry.location);
 *     new google.maps.marker.AdvancedMarkerElement({
 *       map,
 *       position: results[0].geometry.location,
 *     });
 *   }
 * });
 *
 * -------------------------------
 * 📐 GEOMETRY (from `geometry` library)
 * - Pure utility functions; not attached to map.
 * const dist = google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
 *
 * -------------------------------
 * 🛣️ ROUTES (from `routes` library)
 * - Combines DirectionsService (standalone) + DirectionsRenderer (map-attached)
 * const directionsService = new google.maps.DirectionsService();
 * const directionsRenderer = new google.maps.DirectionsRenderer({ map });
 * directionsService.route(
 *   { origin, destination, travelMode: "DRIVING" },
 *   (res, status) => status === "OK" && directionsRenderer.setDirections(res)
 * );
 *
 * -------------------------------
 * 🌦️ MAP LAYERS (attach directly to map)
 * - new google.maps.TrafficLayer().setMap(map);
 * - new google.maps.TransitLayer().setMap(map);
 * - new google.maps.BicyclingLayer().setMap(map);
 *
 * -------------------------------
 * ✅ SUMMARY
 * - “map-attached” → AdvancedMarkerElement, DirectionsRenderer, Layers.
 * - “standalone” → Geocoder, DirectionsService, DistanceMatrixService, ElevationService.
 * - “data-only” → Place, Geometry utilities.
 */

/// <reference types="@types/google.maps" />

import { useEffect, useRef } from "react";
import { usePersistFn } from "@/hooks/usePersistFn";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google?: typeof google;
  }
}

const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY || "default-key";
const FORGE_BASE_URL =
  import.meta.env.VITE_FRONTEND_FORGE_API_URL ||
  "https://forge.manus.im";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

console.log("[MapView] Configuration:", {
  API_KEY: API_KEY ? "present" : "missing",
  FORGE_BASE_URL,
  MAPS_PROXY_URL,
});

function loadMapScript() {
  return new Promise((resolve, reject) => {
    console.log("[MapView] Starting to load Google Maps script");
    console.log("[MapView] MAPS_PROXY_URL:", MAPS_PROXY_URL);
    console.log("[MapView] API_KEY:", API_KEY ? "present" : "missing");
    
    // Check if Google Maps is already loaded
    if (window.google?.maps) {
      console.log("[MapView] Google Maps already loaded");
      resolve(null);
      return;
    }

    const script = document.createElement("script");
    script.src = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&v=weekly&libraries=marker,places,geocoding,geometry`;
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    
    script.onload = () => {
      console.log("[MapView] Script loaded, waiting for google.maps...");
      // Wait for Google Maps to be fully initialized
      let attempts = 0;
      const checkGoogle = () => {
        attempts++;
        if (window.google?.maps) {
          console.log("[MapView] Google Maps initialized successfully");
          resolve(null);
        } else if (attempts < 50) {
          setTimeout(checkGoogle, 100);
        } else {
          console.error("[MapView] Timeout waiting for Google Maps");
          reject(new Error("Timeout waiting for Google Maps"));
        }
      };
      checkGoogle();
    };
    
    script.onerror = () => {
      console.error("[MapView] Failed to load Google Maps script", script.src);
      reject(new Error("Failed to load Google Maps"));
    };
    
    document.head.appendChild(script);
  });
}

interface MapViewProps {
  className?: string;
  initialCenter?: google.maps.LatLngLiteral;
  initialZoom?: number;
  onMapReady?: (map: google.maps.Map) => void;
}

export function MapView({
  className,
  initialCenter = { lat: 37.7749, lng: -122.4194 },
  initialZoom = 12,
  onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);

  const init = usePersistFn(async () => {
    try {
      console.log("[MapView] Initializing map...");
      await loadMapScript();
      if (!mapContainer.current) {
        console.error("[MapView] Map container not found");
        return;
      }
      if (!window.google?.maps) {
        console.error("[MapView] Google Maps not available after loading script");
        return;
      }
      console.log("[MapView] Creating map instance...");
      map.current = new window.google.maps.Map(mapContainer.current, {
        zoom: initialZoom,
        center: initialCenter,
        mapTypeControl: true,
        fullscreenControl: true,
        zoomControl: true,
        streetViewControl: true,
        mapId: "DEMO_MAP_ID",
      });
      console.log("[MapView] Map created successfully");
      if (onMapReady) {
        onMapReady(map.current);
      }
    } catch (error) {
      console.error("[MapView] Error initializing map:", error);
    }
  });

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    console.log("[MapView] Component mounted, container ref:", mapContainer.current ? "set" : "not set");
  }, []);

  return (
    <div 
      ref={mapContainer} 
      className={cn("w-full h-[500px] bg-gray-200", className)}
      style={{ minHeight: "300px", position: "relative" }}
    />
  );
}
