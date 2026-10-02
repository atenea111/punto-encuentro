export function parseMoney(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }
  if (value == null || value === "") return null
  const raw = String(value).trim()
  if (!raw || /^(nan|undefined|null)$/i.test(raw)) return null
  const cleaned = raw.replace(/[^0-9.,-]/g, "").replace(",", ".")
  if (!cleaned || cleaned === "-" || cleaned === "." || cleaned === "-.") return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

export function formatMoney(value: unknown): string {
  const n = parseMoney(value)
  if (n == null) return "Sin precio"
  return `$${n.toLocaleString("es-AR")}`
}
