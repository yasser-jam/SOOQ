"use client"

import { useEffect, useRef } from "react"
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet"

import {
  LEAFLET_MARKER_ICON_URLS,
  addOpenStreetMapTiles,
} from "@/lib/leaflet"
import { cn } from "@workspace/ui/lib/utils"

interface MapPinProps {
  latitude: number
  longitude: number
  zoom?: number
  height?: number | string
  className?: string
}

export default function MapPin({
  latitude,
  longitude,
  zoom = 14,
  height = 240,
  className,
}: MapPinProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<LeafletMarker | null>(null)
  const initialPropsRef = useRef({ latitude, longitude, zoom })

  useEffect(() => {
    let cancelled = false
    let map: LeafletMap | null = null

    void (async () => {
      const L = await import("leaflet")
      if (cancelled || !containerRef.current) return

      L.Icon.Default.mergeOptions(LEAFLET_MARKER_ICON_URLS)

      const { latitude: lat, longitude: lng, zoom: z } = initialPropsRef.current

      map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: z,
        zoomControl: true,
        scrollWheelZoom: false,
      })

      addOpenStreetMapTiles(L, map)

      markerRef.current = L.marker([lat, lng]).addTo(map)
      mapRef.current = map
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

  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker) return
    map.setView([latitude, longitude], zoom)
    marker.setLatLng([latitude, longitude])
  }, [latitude, longitude, zoom])

  return (
    <div
      ref={containerRef}
      className={cn("w-full overflow-hidden rounded-lg border", className)}
      style={{ height }}
    />
  )
}
