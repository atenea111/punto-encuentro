/**
 * Utilidades de ubicación y cálculo de distancia.
 */

/**
 * Calcula la distancia en kilómetros entre dos puntos geográficos
 * usando la fórmula de Haversine.
 */
export function calcularDistanciaKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const RADIO_TIERRA_KM = 6371

  const toRad = (grados: number) => (grados * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return RADIO_TIERRA_KM * c
}

/**
 * Formatea la distancia en un texto amigable.
 * Ej: "a 0.3 km" o "a 12 km"
 */
export function formatearDistancia(distanciaKm: number): string {
  if (distanciaKm < 1) {
    // Mostrar en metros si es menos de 1 km
    const metros = Math.round(distanciaKm * 1000)
    return `a ${metros} m de ti`
  }
  return `a ${distanciaKm.toFixed(1)} km de ti`
}
