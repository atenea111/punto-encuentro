/** Estado activo unificado (Firestore usa `active` e históricamente `isActive`). */
export function isServiceActive(service: Record<string, unknown>): boolean {
  if (service.active === false) return false
  if (service.isActive === false) return false
  if (service.status === "inactive" || service.status === "hidden") return false
  return true
}

export function serviceMatchesAdminFilter(
  service: Record<string, unknown>,
  filter: "all" | "active" | "inactive" | "pending" | "reported"
): boolean {
  if (filter === "all") return true
  if (filter === "active") return isServiceActive(service)
  if (filter === "inactive") return !isServiceActive(service)
  if (filter === "pending") {
    return service.status === "pending" || service.status === "review"
  }
  if (filter === "reported") {
    return service.status === "reported" || service.reported === true
  }
  return true
}

export function isServiceReported(service: Record<string, unknown>): boolean {
  return service.status === "reported" || service.reported === true
}
