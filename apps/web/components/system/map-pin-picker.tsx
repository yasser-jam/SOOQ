"use client"

import { useEffect, useRef } from "react"
import type {
  LeafletMouseEvent,
  Map as LeafletMap,
  Marker as LeafletMarker,
} from "leaflet"

import {
  DAMASCUS_CENTER,
  LEAFLET_MARKER_ICON_URLS,
  addOpenStreetMapTiles,
} from "@/lib/leaflet"
import { cn } from "@workspace/ui/lib/utils"

interface MapPinPickerProps {
  latitude?: number | null
  longitude?: number | null
  defaultLatitude?: number
  defaultLongitude?: number
  zoom?: number
  height?: number | string
  className?: string
  onChange: (coords: { latitude: number; longitude: number }) => void
}

export default function MapPinPicker({
  latitude,
  longitude,
  defaultLatitude = DAMASCUS_CENTER.lat,
  defaultLongitude = DAMASCUS_CENTER.lng,
  zoom = 14,
  height = 320,
  className,
  onChange,
}: MapPinPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<LeafletMarker | null>(null)
  const onChangeRef = useRef(onChange)
  const initialRef = useRef({
    latitude: latitude ?? defaultLatitude,
    longitude: longitude ?? defaultLongitude,
    hasValue: latitude != null && longitude != null,
    zoom,
  })

  // Keep the latest onChange in a ref so the effect doesn't need it as a dep.
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    let cancelled = false
    let map: LeafletMap | null = null

    void (async () => {
      const L = await import("leaflet")
      if (cancelled || !containerRef.current) return

      L.Icon.Default.mergeOptions(LEAFLET_MARKER_ICON_URLS)

      const { latitude: lat, longitude: lng, zoom: z, hasValue } =
        initialRef.current

      map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: z,
        zoomControl: true,
        scrollWheelZoom: true,
      })

      addOpenStreetMapTiles(L, map)

      const marker = L.marker([lat, lng], { draggable: true })
      if (hasValue) marker.addTo(map)
      markerRef.current = marker
      mapRef.current = map

      const emit = (next: { lat: number; lng: number }) => {
        onChangeRef.current({ latitude: next.lat, longitude: next.lng })
      }

      map.on("click", (event: LeafletMouseEvent) => {
        const { lat, lng } = event.latlng
        marker.setLatLng([lat, lng])
        if (!marker.getElement()) marker.addTo(map!)
        emit({ lat, lng })
      })

      marker.on("dragend", () => {
        const pos = marker.getLatLng()
        emit({ lat: pos.lat, lng: pos.lng })
      })
    })()

    return () => {
      cancelled = true
      if (map) {
        map.remove()
      }
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  // Sync external value changes to the marker without rebuilding the map.
  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker) return
    if (latitude == null || longitude == null) return
    marker.setLatLng([latitude, longitude])
    if (!marker.getElement()) marker.addTo(map)
    map.panTo([latitude, longitude])
  }, [latitude, longitude])

  return (
    <div
      ref={containerRef}
      className={cn("w-full overflow-hidden rounded-lg border", className)}
      style={{ height }}
    />
  )
}
