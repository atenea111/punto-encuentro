"use client"

import React, { useMemo, useState, useCallback } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { MapPin, X, Info, Navigation, LayoutGrid } from "lucide-react"
import { AppIcon } from "@/components/AppIcon"
import { Button } from "@/components/ui/button"
import { calcularDistanciaKm, formatearDistancia } from "@/lib/locationUtils"
import { getServiceCoordinates, serviceMatchesCategory } from "@/lib/searchUtils"
import { getCategoryIconSrc } from "@/lib/categoryIcons"
import { CategoryIcon } from "@/components/CategoryIcon"

/** A partir de este zoom se muestran nombres bajo el pin (estilo Google Maps). */
const LABEL_ZOOM = 14

const CATEGORY_COLORS = [
  "#7C3AED",
  "#F59E0B",
  "#10B981",
  "#EF4444",
  "#F97316",
  "#2563EB",
  "#0EA5E9",
  "#EC4899",
  "#64748B",
  "#14B8A6",
  "#8B5CF6",
  "#84CC16",
]

const clientIcon = L.divIcon({
  className: "nearby-user-marker",
  html: `
    <div style="position:relative;width:22px;height:22px;">
      <div style="
        position:absolute;inset:0;border-radius:9999px;
        background:#ef4444;border:3px solid #fff;
        box-shadow:0 0 0 6px rgba(239,68,68,.22), 0 8px 18px rgba(0,0,0,.25);
      "></div>
    </div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
})

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function serviceMapLabel(service: any) {
  const raw = String(service.businessName || service.name || service.providerName || "").trim()
  if (!raw) return ""
  return raw.length > 28 ? `${raw.slice(0, 27)}…` : raw
}

function MapZoomWatcher({ onZoom }: { onZoom: (zoom: number) => void }) {
  const map = useMap()
  React.useEffect(() => {
    const emit = () => onZoom(map.getZoom())
    emit()
    map.on("zoomend", emit)
    map.on("zoom", emit)
    return () => {
      map.off("zoomend", emit)
      map.off("zoom", emit)
    }
  }, [map, onZoom])
  return null
}

function FitMapToFocus({
  userCenter,
  points,
  focusKey,
  hasUserLocation,
}: {
  userCenter: [number, number]
  points: Array<[number, number]>
  focusKey: string | null
  hasUserLocation: boolean
}) {
  const map = useMap()
  const userMovedMap = React.useRef(false)
  const programmaticMove = React.useRef(false)
  const didInitialFit = React.useRef(false)
  const didFitRealGps = React.useRef(false)
  const prevFocusKey = React.useRef<string | null | undefined>(undefined)

  const runProgrammatic = React.useCallback((action: () => void) => {
    programmaticMove.current = true
    action()
    map.once("moveend", () => {
      programmaticMove.current = false
    })
  }, [map])

  React.useEffect(() => {
    const markUserMove = () => {
      if (!programmaticMove.current) userMovedMap.current = true
    }
    map.on("dragstart", markUserMove)
    map.on("zoomstart", markUserMove)
    return () => {
      map.off("dragstart", markUserMove)
      map.off("zoomstart", markUserMove)
    }
  }, [map])

  React.useEffect(() => {
    if (didInitialFit.current) return
    didInitialFit.current = true
    if (hasUserLocation) didFitRealGps.current = true
    runProgrammatic(() => {
      map.flyTo(userCenter, 13, { duration: 0.65 })
    })
  }, [map, userCenter, hasUserLocation, runProgrammatic])

  React.useEffect(() => {
    if (!hasUserLocation || didFitRealGps.current || userMovedMap.current) return
    didFitRealGps.current = true
    runProgrammatic(() => {
      map.flyTo(userCenter, 13, { duration: 0.65 })
    })
  }, [hasUserLocation, userCenter, map, runProgrammatic])

  React.useEffect(() => {
    const focusChanged = prevFocusKey.current !== undefined && prevFocusKey.current !== focusKey
    prevFocusKey.current = focusKey
    if (!focusChanged || !focusKey || points.length === 0) return

    runProgrammatic(() => {
      if (points.length === 1) {
        map.flyTo(points[0], 15, { duration: 0.7 })
        return
      }
      const bounds = L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng)))
      map.flyToBounds(bounds, {
        paddingTopLeft: [40, 80],
        paddingBottomRight: [40, 160],
        maxZoom: 15,
        duration: 0.75,
      })
    })
  }, [map, points, focusKey, runProgrammatic])

  return null
}

function RecenterButton({ center }: { center: [number, number] }) {
  const map = useMap()
  return (
    <button
      onClick={() => map.flyTo(center, 13, { duration: 0.55 })}
      className="absolute bottom-[9.5rem] right-4 z-[1000] h-12 w-12 rounded-full bg-white text-primary shadow-[0_10px_30px_rgba(15,23,42,0.18)] border border-white/80 transition-all active:scale-95 flex items-center justify-center"
      title="Centrar en mi ubicación"
      type="button"
    >
      <Navigation className="h-5 w-5 fill-current" />
    </button>
  )
}

type MapCategory = {
  name: string
  icon?: string
  active?: boolean
}

function colorForCategory(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i) * (i + 1)) % 997
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length]
}

function createCategoryIcon(
  name: string,
  storedIcon: string,
  color: string,
  active = false,
  label?: string,
) {
  const size = active ? 44 : 40
  const src = getCategoryIconSrc(name, storedIcon)
  const inner = src
    ? `<img src="${src}" alt="" style="width:72%;height:72%;object-fit:contain;border-radius:9999px;background:#fff" />`
    : `<span style="font-size:${active ? 18 : 16}px;line-height:1">${storedIcon && !storedIcon.startsWith("/") ? storedIcon : "📍"}</span>`

  const labelHtml = label
    ? `<div style="
        margin-top:3px;
        max-width:118px;
        padding:0 2px;
        font:700 11px/1.15 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
        color:#0f172a;
        text-align:center;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
        letter-spacing:-0.01em;
        text-shadow:
          -1.2px -1.2px 0 #fff,
           1.2px -1.2px 0 #fff,
          -1.2px  1.2px 0 #fff,
           1.2px  1.2px 0 #fff,
           0 0 3px #fff,
           0 1px 2px rgba(255,255,255,.95);
        pointer-events:none;
      ">${escapeHtml(label)}</div>`
    : ""

  const labelH = label ? 16 : 0
  const totalW = label ? Math.max(size, 120) : size
  const totalH = size + 10 + labelH

  return L.divIcon({
    className: "nearby-category-marker",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;width:${totalW}px;filter:drop-shadow(0 8px 16px rgba(15,23,42,.28));">
        <div style="
          width:${size}px;height:${size}px;border-radius:9999px;
          background:#fff;
          display:flex;align-items:center;justify-content:center;
          border:2.5px solid ${color};
        ">${inner}</div>
        <div style="
          width:0;height:0;margin-top:-3px;
          border-left:8px solid transparent;
          border-right:8px solid transparent;
          border-top:11px solid ${color};
        "></div>
        ${labelHtml}
      </div>
    `,
    iconSize: [totalW, totalH],
    iconAnchor: [totalW / 2, size + 8],
    popupAnchor: [0, -(size + 4)],
  })
}

interface NearByMapProps {
  onClose: () => void
  userLocation: { latitude: number; longitude: number } | null
  services: any[]
  categories?: MapCategory[]
  radiusKm?: number
  onServiceSelect: (service: any) => void
}

export default function NearByMap({
  onClose,
  userLocation,
  services,
  categories = [],
  radiusKm = 15,
  onServiceSelect,
}: NearByMapProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [zoom, setZoom] = useState(13)
  const onZoom = useCallback((z: number) => setZoom(z), [])
  const showLabels = zoom >= LABEL_ZOOM

  const defaultCenter: [number, number] = [-34.3756, -59.9886]
  const center: [number, number] = useMemo(
    () =>
      userLocation
        ? [userLocation.latitude, userLocation.longitude]
        : defaultCenter,
    [userLocation?.latitude, userLocation?.longitude]
  )

  const categoryMeta = useMemo(() => {
    const map = new Map<string, { icon: string; color: string }>()
    categories
      .filter((cat) => cat.active !== false)
      .forEach((cat) => {
        map.set(cat.name, {
          icon: cat.icon || "📍",
          color: colorForCategory(cat.name),
        })
      })
    return map
  }, [categories])

  const getMeta = (categoryName?: string) => {
    const name = categoryName || "Otros"
    if (categoryMeta.has(name)) return categoryMeta.get(name)!
    const official = [...categoryMeta.keys()].find((key) => serviceMatchesCategory({ category: name }, key))
    if (official) return categoryMeta.get(official)!
    return {
      icon: "📍",
      color: colorForCategory(name),
    }
  }

  const servicesInRadius = useMemo(() => {
    return services.filter((service) => {
      const coords = getServiceCoordinates(service)
      if (!coords) return false
      if (!userLocation) return true
      const distancia = calcularDistanciaKm(
        userLocation.latitude,
        userLocation.longitude,
        coords.lat,
        coords.lng
      )
      return distancia <= radiusKm
    })
  }, [services, userLocation, radiusKm])

  const categoriesInRange = useMemo(() => {
    const names = new Set<string>()
    servicesInRadius.forEach((service) => {
      if (service.category) names.add(String(service.category))
    })

    const fromApp = categories.filter((cat) => cat.active !== false && names.has(cat.name))
    const extras = [...names]
      .filter((name) => !fromApp.some((cat) => cat.name === name))
      .map((name) => ({ name, icon: getMeta(name).icon }))

    return [...fromApp, ...extras]
  }, [servicesInRadius, categories, categoryMeta])

  const filteredServices = useMemo(() => {
    if (!selectedCategory) return servicesInRadius
    return servicesInRadius.filter((service) => serviceMatchesCategory(service, selectedCategory))
  }, [servicesInRadius, selectedCategory])

  const focusPoints = useMemo(() => {
    if (!selectedCategory) return [] as Array<[number, number]>
    return filteredServices
      .map((service) => getServiceCoordinates(service))
      .filter((coords): coords is { lat: number; lng: number } => Boolean(coords))
      .map((coords) => [coords.lat, coords.lng] as [number, number])
  }, [filteredServices, selectedCategory])

  const selectedMeta = selectedCategory ? getMeta(selectedCategory) : null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F3F6F8] nearby-map-container">
      <style>{`
        .nearby-category-marker,
        .nearby-user-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>

      <div className="relative z-[1100] bg-white/90 backdrop-blur-xl border-b border-white/60 px-4 py-3.5 flex items-center justify-between shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
            <AppIcon name="ubicacion" className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[17px] font-black text-slate-900 leading-tight truncate">Servicios Cerca de Mí</h2>
            <p className="text-[11px] text-slate-500 font-medium">
              {filteredServices.length} servicio{filteredServices.length === 1 ? "" : "s"} · {radiusKm} km
              {showLabels ? " · nombres visibles" : " · acercá el zoom para ver nombres"}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex items-center justify-center"
          type="button"
          aria-label="Cerrar mapa"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative z-[1100] bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100/80 px-4 py-2.5 flex items-start gap-2.5 text-[11px] text-amber-900 font-medium">
        <div className="mt-0.5 h-5 w-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
          <Info className="h-3.5 w-3.5" />
        </div>
        <p className="leading-relaxed">
          Cada color e ícono representa una categoría. Acercá el zoom para ver nombres de comercios. Filtrá abajo por rubro.
        </p>
      </div>

      <div className="flex-1 relative w-full h-full overflow-hidden">
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom
          zoomControl={false}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapZoomWatcher onZoom={onZoom} />

          <FitMapToFocus
            userCenter={center}
            points={focusPoints}
            focusKey={selectedCategory}
            hasUserLocation={Boolean(userLocation)}
          />

          {userLocation && (
            <Circle
              center={[userLocation.latitude, userLocation.longitude]}
              radius={radiusKm * 1000}
              pathOptions={{
                color: "#0F766E",
                fillColor: "#14B8A6",
                fillOpacity: 0.07,
                weight: 1.5,
                dashArray: "4 8",
              }}
            />
          )}

          {userLocation && (
            <Marker position={[userLocation.latitude, userLocation.longitude]} icon={clientIcon}>
              <Popup>
                <div className="text-center font-bold text-xs p-1 text-slate-800">Estás acá</div>
              </Popup>
            </Marker>
          )}

          {filteredServices.map((service) => {
            const coords = getServiceCoordinates(service)
            if (!coords) return null
            const meta = getMeta(service.category)
            const dist = userLocation
              ? calcularDistanciaKm(userLocation.latitude, userLocation.longitude, coords.lat, coords.lng)
              : null
            const distText = dist !== null ? formatearDistancia(dist) : null
            const isHighlighted = !selectedCategory || serviceMatchesCategory(service, selectedCategory)
            const label = showLabels ? serviceMapLabel(service) : undefined

            return (
              <Marker
                key={`${service.id}-${showLabels ? "l" : "p"}`}
                position={[coords.lat, coords.lng]}
                icon={createCategoryIcon(
                  String(service.category || ""),
                  meta.icon,
                  meta.color,
                  isHighlighted && !!selectedCategory,
                  label || undefined,
                )}
                opacity={isHighlighted ? 1 : 0.35}
                zIndexOffset={showLabels ? 200 : 0}
              >
                <Popup className="nearby-popup">
                  <div className="p-1.5 max-w-[230px]">
                    <div className="w-full h-[88px] rounded-xl overflow-hidden mb-2 bg-slate-100 relative">
                      <img
                        src={service.image || "/placeholder.svg"}
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                      <div
                        className="absolute top-2 left-2 text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full text-white shadow"
                        style={{ backgroundColor: meta.color }}
                      >
                        <span className="inline-flex items-center gap-1">
                          <CategoryIcon name={String(service.category || "")} icon={meta.icon} className="h-3 w-3 rounded-full bg-white p-px" />
                          {service.category || "Otros"}
                        </span>
                      </div>
                    </div>
                    <h4 className="font-black text-slate-900 text-sm leading-snug line-clamp-2 mb-0.5">
                      {service.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mb-1.5">{service.providerName || "Particular"}</p>

                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      {distText ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <MapPin className="h-3 w-3" />
                          {distText}
                        </span>
                      ) : (
                        <span />
                      )}
                      <span className="font-black text-sm text-primary">${service.price}</span>
                    </div>

                    <Button
                      size="sm"
                      className="w-full h-9 text-xs rounded-xl font-bold shadow-sm"
                      onClick={() => {
                        onServiceSelect(service)
                        onClose()
                      }}
                    >
                      Ver perfil
                    </Button>
                  </div>
                </Popup>
              </Marker>
            )
          })}

          <RecenterButton center={center} />
        </MapContainer>

        <div className="absolute bottom-0 left-0 right-0 z-[1000] pointer-events-none">
          <div className="px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2 pointer-events-auto">
            {selectedCategory && selectedMeta ? (
              <div className="rounded-[22px] bg-white shadow-[0_-8px_40px_rgba(15,23,42,0.14)] border border-slate-100 px-3 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center gap-2.5 rounded-full pl-2.5 pr-2 py-2 text-white shadow-md min-w-0 flex-1 max-w-[70%]"
                  style={{ backgroundColor: selectedMeta.color }}
                >
                  <span className="h-6 w-6 rounded-full bg-white/90 overflow-hidden flex items-center justify-center flex-shrink-0 p-0.5">
                    <CategoryIcon name={selectedCategory} icon={selectedMeta.icon} className="w-full h-full" />
                  </span>
                  <span className="text-[14px] font-bold truncate">{selectedCategory}</span>
                  <span className="ml-auto h-6 w-6 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0">
                    <X className="h-3.5 w-3.5 text-white" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-sky-600 flex-shrink-0 px-1"
                >
                  <X className="h-3.5 w-3.5" />
                  Borrar filtro
                </button>
              </div>
            ) : (
              <div className="rounded-[28px] bg-white/95 backdrop-blur-xl shadow-[0_-8px_40px_rgba(15,23,42,0.14)] border border-white px-3 pt-3 pb-3">
                <div className="flex items-center justify-between px-1 mb-2.5">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Opciones rápidas</p>
                    <p className="text-[12px] font-semibold text-slate-700">Filtrá por categoría</p>
                  </div>
                  <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    {filteredServices.length}
                  </span>
                </div>

                <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className="flex flex-col items-center gap-1.5 min-w-[70px] snap-start"
                  >
                    <div className="h-[58px] w-[58px] rounded-full flex items-center justify-center border-[3px] border-primary bg-primary text-white scale-105 shadow-[0_10px_24px_rgba(15,118,110,0.35)]">
                      <LayoutGrid className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-bold text-primary">Todos</span>
                  </button>

                  {categoriesInRange.map((cat) => {
                    const meta = getMeta(cat.name)
                    const count = servicesInRadius.filter((s) => serviceMatchesCategory(s, cat.name)).length
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => setSelectedCategory(cat.name)}
                        className="flex flex-col items-center gap-1.5 min-w-[70px] snap-start"
                      >
                        <div className="relative">
                          <div
                            className="h-[58px] w-[58px] rounded-full flex items-center justify-center border-[3px] border-white bg-white overflow-hidden p-1.5"
                            style={{
                              boxShadow: "0 6px 16px rgba(15,23,42,0.12)",
                            }}
                          >
                            <CategoryIcon name={cat.name} icon={meta.icon} className="w-full h-full" />
                          </div>
                          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center border-2 border-white">
                            {count}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold max-w-[70px] truncate text-slate-500">
                          {cat.name}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {categoriesInRange.length === 0 && (
                  <p className="text-[12px] text-center text-slate-500 mt-3 py-2">
                    No hay servicios con ubicación en este radio.
                  </p>
                )}
              </div>
            )}

            {selectedCategory && filteredServices.length === 0 && (
              <p className="text-[12px] text-center text-slate-600 mt-2 bg-white/90 rounded-full py-1.5 px-3 shadow-sm">
                No hay servicios de {selectedCategory} cerca tuyo.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
