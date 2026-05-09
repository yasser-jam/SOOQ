"use client"

import { useEffect, useRef } from "react"
import type {
  LatLngBoundsExpression,
  Map as LeafletMap,
  Marker as LeafletMarker,
  Polyline as LeafletPolyline,
} from "leaflet"

import {
  LEAFLET_MARKER_ICON_URLS,
  addOpenStreetMapTiles,
} from "@/lib/leaflet"
import { cn } from "@workspace/ui/lib/utils"

interface MapRouteProps {
  originLat: number
  originLng: number
  destinationLat: number
  destinationLng: number
  originLabel?: string
  destinationLabel?: string
  height?: number | string
  className?: string
}

const ROUTE_COLOR = "#2563eb"

export default function MapRoute({
  originLat,
  originLng,
  destinationLat,
  destinationLng,
  originLabel = "نقطة الانطلاق",
  destinationLabel = "وجهة التسليم",
  height = 320,
  className,
}: MapRouteProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const originMarkerRef = useRef<LeafletMarker | null>(null)
  const destinationMarkerRef = useRef<LeafletMarker | null>(null)
  const polylineRef = useRef<LeafletPolyline | null>(null)
  const initialPropsRef = useRef({
    originLat,
    originLng,
    destinationLat,
    destinationLng,
    originLabel,
    destinationLabel,
  })

  useEffect(() => {
    let cancelled = false
    let map: LeafletMap | null = null

    void (async () => {
      const L = await import("leaflet")
      if (cancelled || !containerRef.current) return

      L.Icon.Default.mergeOptions(LEAFLET_MARKER_ICON_URLS)

      const {
        originLat: oLat,
        originLng: oLng,
        destinationLat: dLat,
        destinationLng: dLng,
        originLabel: oLabel,
        destinationLabel: dLabel,
      } = initialPropsRef.current

      const bounds: LatLngBoundsExpression = [
        [oLat, oLng],
        [dLat, dLng],
      ]

      map = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })

      addOpenStreetMapTiles(L, map)

      originMarkerRef.current = L.marker([oLat, oLng])
        .addTo(map)
        .bindPopup(oLabel)

      destinationMarkerRef.current = L.marker([dLat, dLng])
        .addTo(map)
        .bindPopup(dLabel)

      polylineRef.current = L.polyline(
        [
          [oLat, oLng],
          [dLat, dLng],
        ],
        {
          color: ROUTE_COLOR,
          weight: 3,
          opacity: 0.85,
          dashArray: "6 8",
        }
      ).addTo(map)

      mapRef.current = map
    })()

    return () => {
      cancelled = true
      if (map) {
        map.remove()
      }
      mapRef.current = null
      originMarkerRef.current = null
      destinationMarkerRef.current = null
      polylineRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const origin = originMarkerRef.current
    const destination = destinationMarkerRef.current
    const polyline = polylineRef.current
    if (!map || !origin || !destination || !polyline) return

    origin.setLatLng([originLat, originLng])
    destination.setLatLng([destinationLat, destinationLng])
    polyline.setLatLngs([
      [originLat, originLng],
      [destinationLat, destinationLng],
    ])
    map.fitBounds(
      [
        [originLat, originLng],
        [destinationLat, destinationLng],
      ],
      { padding: [40, 40], maxZoom: 14 }
    )
  }, [originLat, originLng, destinationLat, destinationLng])

  return (
    <div
      ref={containerRef}
      className={cn("w-full overflow-hidden rounded-lg border", className)}
      style={{ height }}
    />
  )
}
