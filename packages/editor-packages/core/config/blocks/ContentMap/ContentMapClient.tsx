"use client";

import { useEffect, useRef } from "react";
import type {
  LeafletMouseEvent,
  Map as LeafletMap,
  Marker as LeafletMarker,
} from "leaflet";

import {
  DAMASCUS_CENTER,
  LEAFLET_MARKER_ICON_URLS,
  addOpenStreetMapTiles,
} from "./leaflet-config";

type ContentMapClientProps = {
  heightPx: number;
  zoom: number;
  defaultLat: number;
  defaultLng: number;
  interactive: boolean;
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (latitude: number, longitude: number) => void;
};

export function ContentMapClient({
  heightPx,
  zoom,
  defaultLat,
  defaultLng,
  interactive,
  latitude,
  longitude,
  onLocationChange,
}: ContentMapClientProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const onChangeRef = useRef(onLocationChange);
  const initialRef = useRef({
    latitude: latitude ?? defaultLat ?? DAMASCUS_CENTER.lat,
    longitude: longitude ?? defaultLng ?? DAMASCUS_CENTER.lng,
    hasValue: latitude != null && longitude != null,
    zoom,
    interactive,
  });

  useEffect(() => {
    onChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    let cancelled = false;
    let map: LeafletMap | null = null;

    void (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current) return;

      L.Icon.Default.mergeOptions(LEAFLET_MARKER_ICON_URLS);

      const { latitude: lat, longitude: lng, zoom: z, hasValue, interactive: canInteract } =
        initialRef.current;

      map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: z,
        zoomControl: canInteract,
        scrollWheelZoom: canInteract,
        dragging: canInteract,
      });

      addOpenStreetMapTiles(L, map);

      const marker = L.marker([lat, lng], { draggable: canInteract });
      if (hasValue) marker.addTo(map);
      markerRef.current = marker;
      mapRef.current = map;

      requestAnimationFrame(() => map?.invalidateSize());

      if (!canInteract) return;

      const emit = (next: { lat: number; lng: number }) => {
        onChangeRef.current(next.lat, next.lng);
      };

      map.on("click", (event: LeafletMouseEvent) => {
        const { lat: nextLat, lng: nextLng } = event.latlng;
        marker.setLatLng([nextLat, nextLng]);
        if (!marker.getElement()) marker.addTo(map!);
        emit({ lat: nextLat, lng: nextLng });
      });

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        emit({ lat: pos.lat, lng: pos.lng });
      });
    })();

    return () => {
      cancelled = true;
      if (map) map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    if (latitude == null || longitude == null) return;
    marker.setLatLng([latitude, longitude]);
    if (!marker.getElement()) marker.addTo(map);
    map.panTo([latitude, longitude]);
  }, [latitude, longitude]);

  return (
    <div
      ref={containerRef}
      className="ContentMap-map"
      style={{ height: heightPx }}
    />
  );
}
