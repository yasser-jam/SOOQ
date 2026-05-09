import type { Map as LeafletMap, TileLayer } from "leaflet"

// Pinned to the leaflet version in apps/web/package.json so marker images stay
// in sync with the JS API across the unpkg CDN.
export const LEAFLET_MARKER_ICON_URLS = {
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
}

// Damascus city center — used as the map default until store-settings exposes
// a per-tenant origin coordinate.
export const DAMASCUS_CENTER = {
  lat: 33.5138,
  lng: 36.2765,
}

const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

export const addOpenStreetMapTiles = (
  L: typeof import("leaflet"),
  map: LeafletMap
): TileLayer =>
  L.tileLayer(OSM_TILE_URL, {
    attribution: OSM_ATTRIBUTION,
    maxZoom: 19,
  }).addTo(map)
