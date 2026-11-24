/**
 * Scans a file for identifiers called as functions that look like hook/lib exports
 * but are not imported. Heuristic only — local function defs are skipped if "function name" exists.
 */
import fs from "fs"

const file = process.argv[2] || "app/page.tsx"
const src = fs.readFileSync(file, "utf8")

const importNames = new Set()
for (const m of src.matchAll(/import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"][^'"]+['"]/g)) {
  for (const part of m[1].split(",")) {
    const name = part.trim().split(/\s+as\s+/)[0].trim()
    if (name) importNames.add(name)
  }
}
for (const m of src.matchAll(/import\s+(\w+)\s+from\s+['"][^'"]+['"]/g)) {
  importNames.add(m[1])
}

const localFns = new Set()
for (const m of src.matchAll(/function\s+(\w+)/g)) localFns.add(m[1])
for (const m of src.matchAll(/const\s+(\w+)\s*=\s*(?:async\s*)?\(/g)) localFns.add(m[1])

const candidates = [
  "updateBooking",
  "cancelBooking",
  "createBooking",
  "getBookingsByProvider",
  "getBookingsByClient",
  "markChatRead",
  "sendChatMessage",
  "deleteService",
  "updateService",
  "createService",
  "logAdminAction",
  "downloadCsv",
  "ensureUserProfile",
  "uploadFile",
  "isServiceActive",
  "isServiceReported",
  "serviceMatchesAdminFilter",
]

const missing = []
for (const name of candidates) {
  const used = new RegExp(`\\b${name}\\s*\\(`).test(src)
  if (!used) continue
  if (localFns.has(name)) continue
  if (importNames.has(name)) continue
  // used inside nested function that gets it from hook - check if ANY use is outside scope is hard
  // flag if not imported at all
  missing.push(name)
}

console.log("File:", file)
console.log("Possibly missing imports (used, not imported, not top-level local fn):", missing.join(", ") || "none")

// Per-component: find function ProviderDashboard and check if updateBooking is in scope
const compRegex = /function\s+(ProviderDashboard)\([^)]*\)\s*\{/g
let match
while ((match = compRegex.exec(src))) {
  const start = match.index
  const slice = src.slice(start, start + 15000)
  const usesUpdate = /\bupdateBooking\s*\(/.test(slice)
  const hasHook = /useBookings\s*\(\)/.test(slice.slice(0, 8000))
  if (usesUpdate && !hasHook) {
    console.log("BUG:", match[1], "uses updateBooking but no useBookings() in first 8k chars")
  }
}
