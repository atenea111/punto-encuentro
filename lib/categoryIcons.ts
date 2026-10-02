import { normalizeSearchText } from "@/lib/searchUtils"

export const CATEGORY_ICON_FILES: Record<string, string> = {
  automotor: "/categorias/01_Automotor.jpg",
  belleza: "/categorias/02_Belleza.jpg",
  construccion: "/categorias/03_Construccion.jpg",
  deporte: "/categorias/04_Deportes.jpg",
  deportes: "/categorias/04_Deportes.jpg",
  educacion: "/categorias/05_Educacion.jpg",
  entretenimiento: "/categorias/06_Entretenimiento.jpg",
  gastronomia: "/categorias/07_Gastronomia.jpg",
  hogar: "/categorias/08_Hogar.jpg",
  inmobiliaria: "/categorias/09_Inmobiliaria.jpg",
  mascotas: "/categorias/10_Mascotas.jpg",
  oficios: "/categorias/11_Oficios.jpg",
  profesionales: "/categorias/12_Profesionales.jpg",
  salud: "/categorias/13_Salud.jpg",
  tecnologia: "/categorias/14_Tecnologia.jpg",
  "tiendas y compras": "/categorias/15_Tiendas_y_compras.jpg",
  tiendas: "/categorias/15_Tiendas_y_compras.jpg",
  transporte: "/categorias/16_Transporte.jpg",
  "turismo y alojamiento": "/categorias/17_Turismo_y_alojamiento.jpg",
  turismo: "/categorias/17_Turismo_y_alojamiento.jpg",
}

export function isCategoryImagePath(value?: string | null): boolean {
  if (!value) return false
  return value.startsWith("/categorias/") || value.includes("/categorias/")
}

export function getCategoryIconSrc(name?: string | null, storedIcon?: string | null): string | null {
  const fromName = CATEGORY_ICON_FILES[normalizeSearchText(name || "")]
  if (fromName) return fromName
  if (isCategoryImagePath(storedIcon)) {
    const path = storedIcon as string
    const idx = path.indexOf("/categorias/")
    return idx >= 0 ? path.slice(idx) : path
  }
  if (storedIcon) {
    const file = storedIcon.replace(/\\/g, "/").split("/").pop() || ""
    const match = Object.values(CATEGORY_ICON_FILES).find((src) => src.endsWith(`/${file}`) || src.endsWith(file))
    if (match) return match
  }
  return null
}

export function categorySelectLabel(name: string, icon?: string | null): string {
  if (isCategoryImagePath(icon) || getCategoryIconSrc(name, icon)) return name
  return icon ? `${icon} ${name}` : name
}
