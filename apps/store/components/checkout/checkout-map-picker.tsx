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

type CheckoutMapPickerProps = {
	latitude: number | null
	longitude: number | null
	zoom?: number
	onChange: (coords: { latitude: number; longitude: number }) => void
}

/**
 * Storefront twin of the admin `MapPinPicker` (apps/web/components/system).
 * Same Leaflet/OSM setup, but styled with the plain `CheckoutDrawer-*` CSS
 * instead of Tailwind since apps/store doesn't depend on @workspace/ui.
 */
export function CheckoutMapPicker({
	latitude,
	longitude,
	zoom = 14,
	onChange,
}: CheckoutMapPickerProps) {
	const containerRef = useRef<HTMLDivElement | null>(null)
	const mapRef = useRef<LeafletMap | null>(null)
	const markerRef = useRef<LeafletMarker | null>(null)
	const onChangeRef = useRef(onChange)
	const initialRef = useRef({
		latitude: latitude ?? DAMASCUS_CENTER.lat,
		longitude: longitude ?? DAMASCUS_CENTER.lng,
		hasValue: latitude != null && longitude != null,
		zoom,
	})

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

			// The drawer mounts through a portal, so the container can still be
			// laying out when Leaflet measures it.
			requestAnimationFrame(() => map?.invalidateSize())

			const emit = (next: { lat: number; lng: number }) => {
				onChangeRef.current({ latitude: next.lat, longitude: next.lng })
			}

			map.on("click", (event: LeafletMouseEvent) => {
				const { lat: nextLat, lng: nextLng } = event.latlng
				marker.setLatLng([nextLat, nextLng])
				if (!marker.getElement()) marker.addTo(map!)
				emit({ lat: nextLat, lng: nextLng })
			})

			marker.on("dragend", () => {
				const pos = marker.getLatLng()
				emit({ lat: pos.lat, lng: pos.lng })
			})
		})()

		return () => {
			cancelled = true
			if (map) map.remove()
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

	return <div ref={containerRef} className="CheckoutDrawer-map" />
}
