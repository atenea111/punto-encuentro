const PLACEHOLDER_MARKERS = ["placeholder.svg", "placeholder"]

export function hasValidProfilePhoto(value?: string | null): boolean {
  if (!value || typeof value !== "string") return false
  const trimmed = value.trim()
  if (!trimmed) return false
  const lower = trimmed.toLowerCase()
  return !PLACEHOLDER_MARKERS.some((marker) => lower.includes(marker))
}

export function validateProfilePhotoFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Seleccioná una imagen válida"
  }
  if (file.size > 5 * 1024 * 1024) {
    return "La imagen es demasiado grande. Máximo 5 MB"
  }
  return null
}
