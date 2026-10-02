/**
 * Utilidades de búsqueda de servicios (texto, equivalencias, localidad).
 */

export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

/** Raíz aproximada para equivalentes tipo plomero/plomería, electricista/electricidad. */
export function stemSearchToken(value: string): string {
  let token = normalizeSearchText(value)
  if (token.length < 4) return token

  const suffixes = [
    "imientos",
    "imiento",
    "aciones",
    "acion",
    "ciones",
    "cion",
    "siones",
    "sion",
    "erias",
    "eria",
    "istas",
    "ista",
    "adores",
    "adoras",
    "ador",
    "adora",
    "eros",
    "eras",
    "ero",
    "era",
    "ores",
    "oras",
    "or",
    "ora",
    "antes",
    "ante",
    "entes",
    "ente",
    "ados",
    "adas",
    "ado",
    "ada",
    "ibles",
    "ible",
    "ajes",
    "aje",
    "ias",
    "ia",
  ]

  for (const suffix of suffixes) {
    // Evitar raíces demasiado cortas (plomería → plom).
    if (token.endsWith(suffix) && token.length - suffix.length >= 5) {
      token = token.slice(0, -suffix.length)
      break
    }
  }

  // Plural simple residual.
  if (token.endsWith("es") && token.length > 6) token = token.slice(0, -2)
  else if (token.endsWith("s") && token.length > 5) token = token.slice(0, -1)

  return token
}

/** Grupos de términos equivalentes (oficios / rubros frecuentes). */
const EQUIVALENCE_GROUPS: string[][] = [
  ["plomero", "plomera", "plomeria", "plomerias", "caneria", "canerias", "sanitario", "sanitaria", "destapaciones"],
  ["electricista", "electricistas", "electricidad", "electrico", "electrica", "electricos"],
  ["gasista", "gasistas", "gas", "matriz"],
  ["pintor", "pintora", "pintores", "pintura", "pinturas"],
  ["albanil", "albaniles", "albanileria", "construccion", "obra"],
  ["carpintero", "carpintera", "carpinteria", "muebles"],
  ["jardinero", "jardinera", "jardineria", "jardin", "parque", "poda"],
  ["limpieza", "limpiador", "limpiadora", "mucama", "aseo", "higienizacion"],
  ["mecanico", "mecanica", "taller mecanico", "auto", "autos", "automotor"],
  ["peluquero", "peluquera", "peluqueria", "barbero", "barberia", "corte"],
  ["manicura", "manicuras", "unas", "nail"],
  ["medico", "medica", "medicos", "medicas", "medicina", "doctor", "doctora", "consulta"],
  ["psicologo", "psicologa", "psicologia", "terapeuta"],
  ["abogado", "abogada", "abogados", "estudio juridico", "juridico"],
  ["contador", "contadora", "contabilidad", "impuestos"],
  ["profesor", "profesora", "profesor particular", "clases", "tutor", "tutoria", "refuerzo"],
  ["restaurant", "restaurante", "restaurantes", "comida", "gastronomia", "cocina", "delivery", "catering"],
  ["panaderia", "panadero", "panadera", "pan"],
  ["pizzeria", "pizza", "pizzero"],
  ["gimnasio", "gym", "entrenamiento", "personal trainer", "crossfit"],
  ["veterinario", "veterinaria", "mascotas", "perro", "gato"],
  ["cerrajero", "cerrajeria", "llaves", "cerradura"],
  ["techista", "techistas", "techos", "goteras"],
  ["refrigeracion", "aire acondicionado", "aires", "climatizacion", "heladera"],
]

const CATEGORY_ALIASES: Record<string, string> = {
  aprendizaje: "educacion",
  deporte: "deportes",
}

/** Localidades frecuentes (AR) para separar “servicio + ubicación”. */
const LOCATION_HINTS = new Set(
  [
    "rosario",
    "cordoba",
    "cordoba capital",
    "buenos aires",
    "caba",
    "capital federal",
    "la plata",
    "mar del plata",
    "mendoza",
    "tucuman",
    "salta",
    "santa fe",
    "parana",
    "neuquen",
    "bahia blanca",
    "san juan",
    "san luis",
    "resistencia",
    "corrientes",
    "posadas",
    "formosa",
    "jujuy",
    "rawson",
    "ushuaia",
    "rio cuarto",
    "villa maria",
    "san nicolas",
    "campana",
    "zarate",
    "pilar",
    "tigre",
    "san isidro",
    "vicente lopez",
    "avellaneda",
    "lanus",
    "lomas de zamora",
    "quilmes",
    "berazategui",
    "moreno",
    "moron",
    "merlo",
    "ituzaingo",
    "hurlingham",
    "tres de febrero",
    "san martin",
    "carmen de areco",
    "san antonio de areco",
    "chacabuco",
    "junin",
    "pergamino",
    "venado tuerto",
    "rafaela",
    "reconquista",
    "gualeguaychu",
    "concordia",
    "villa carlos paz",
    "alta gracia",
    "jesus maria",
    "rio tercero",
    "godoy cruz",
    "guaymallen",
    "las heras",
    "maipu",
  ].map(normalizeSearchText)
)

function getServiceContentFields(service: Record<string, unknown>): string[] {
  return [
    service.name,
    service.description,
    service.category,
    service.providerName,
    service.businessName,
  ]
    .filter(Boolean)
    .map((field) => String(field))
}

function getLocationFields(service: Record<string, unknown>): string[] {
  return [service.city, service.address, service.location]
    .filter(Boolean)
    .map((field) => String(field))
}

function canonicalCategoryKey(name: string): string {
  const normalized = normalizeSearchText(name)
  return CATEGORY_ALIASES[normalized] || normalized
}

function buildEquivalenceIndex(): Map<string, string[]> {
  const index = new Map<string, string[]>()
  for (const group of EQUIVALENCE_GROUPS) {
    const normalized = group.map(normalizeSearchText)
    const stems = normalized.map(stemSearchToken)
    const all = Array.from(new Set([...normalized, ...stems]))
    for (const key of all) {
      index.set(key, all)
    }
  }
  return index
}

const EQUIVALENCE_INDEX = buildEquivalenceIndex()

/** Expande un token a equivalentes + raíz (plomero → plomeria, plomer…). */
export function expandSearchToken(token: string): string[] {
  const normalized = normalizeSearchText(token)
  if (!normalized) return []
  const stem = stemSearchToken(normalized)
  const fromGroup = EQUIVALENCE_INDEX.get(normalized) || EQUIVALENCE_INDEX.get(stem) || []
  return Array.from(new Set([normalized, stem, ...fromGroup].filter((t) => t.length >= 2)))
}

function tokenizeQuery(term: string): string[] {
  return normalizeSearchText(term)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2)
}

function isLocationToken(token: string): boolean {
  const normalized = normalizeSearchText(token)
  if (LOCATION_HINTS.has(normalized)) return true
  // Frases multi-palabra ya vienen tokenizadas; chequear si el token es parte de un hint.
  for (const hint of LOCATION_HINTS) {
    if (hint.includes(normalized) && normalized.length >= 4) return true
  }
  return false
}

export type ParsedSearchQuery = {
  raw: string
  tokens: string[]
  serviceTokens: string[]
  locationTokens: string[]
}

/**
 * Separa “plomero rosario” en servicio + ubicación.
 * Si hay un solo token y es localidad, todo es ubicación.
 * @param knownCities ciudades presentes en los servicios (mejora detección de ubicaciones locales)
 */
export function parseSearchQuery(term: string, knownCities: string[] = []): ParsedSearchQuery {
  const raw = term.trim()
  const tokens = tokenizeQuery(raw)
  if (tokens.length === 0) {
    return { raw, tokens: [], serviceTokens: [], locationTokens: [] }
  }

  const cityHints = new Set<string>([
    ...LOCATION_HINTS,
    ...knownCities.map(normalizeSearchText).filter(Boolean),
  ])

  // Frases de localidad multi-token al final (ej. "carmen de areco").
  const joined = tokens.join(" ")
  for (const hint of cityHints) {
    if (hint.includes(" ") && (joined === hint || joined.endsWith(` ${hint}`))) {
      const locParts = hint.split(/\s+/).filter(Boolean)
      const serviceTokens = tokens.slice(0, Math.max(0, tokens.length - locParts.length))
      return {
        raw,
        tokens,
        serviceTokens,
        locationTokens: locParts,
      }
    }
  }

  const locationTokens: string[] = []
  const serviceTokens: string[] = []
  for (const token of tokens) {
    if (cityHints.has(token) || isLocationToken(token)) locationTokens.push(token)
    else serviceTokens.push(token)
  }

  // Un solo token localidad → búsqueda solo por lugar.
  if (serviceTokens.length === 0 && locationTokens.length > 0) {
    return { raw, tokens, serviceTokens: [], locationTokens }
  }

  // Último token = ciudad conocida del catálogo (no adivinar ciudades arbitrarias).
  if (locationTokens.length === 0 && serviceTokens.length >= 2) {
    const maybeCity = serviceTokens[serviceTokens.length - 1]
    const cityHit = [...cityHints].some(
      (city) => city === maybeCity || city.split(/\s+/).includes(maybeCity)
    )
    if (cityHit) {
      return {
        raw,
        tokens,
        serviceTokens: serviceTokens.slice(0, -1),
        locationTokens: [maybeCity],
      }
    }
  }

  return { raw, tokens, serviceTokens, locationTokens }
}

function fieldMatchesToken(fieldNormalized: string, token: string): boolean {
  const expansions = expandSearchToken(token)
  if (expansions.some((exp) => fieldNormalized.includes(exp))) return true

  const words = fieldNormalized.split(/[^a-z0-9]+/).filter(Boolean)
  const stem = stemSearchToken(token)
  return words.some((word) => {
    if (word.length < 3) return false
    const wordStem = stemSearchToken(word)
    if (wordStem === stem) return true
    if (stem.length >= 4 && (wordStem.startsWith(stem) || stem.startsWith(wordStem))) return true
    return expansions.some((exp) => word === exp || wordStem === stemSearchToken(exp))
  })
}

function contentMatchesToken(service: Record<string, unknown>, token: string): boolean {
  const fields = getServiceContentFields(service).map(normalizeSearchText)
  return fields.some((field) => fieldMatchesToken(field, token))
}

function locationMatchesToken(service: Record<string, unknown>, token: string): boolean {
  const fields = getLocationFields(service).map(normalizeSearchText)
  const expansions = expandSearchToken(token)
  return fields.some((field) => expansions.some((exp) => field.includes(exp)))
}

function locationMatchesAll(service: Record<string, unknown>, locationTokens: string[]): boolean {
  if (locationTokens.length === 0) return true
  const joined = getLocationFields(service).map(normalizeSearchText).join(" ")
  if (!joined) return false
  return locationTokens.every((token) => {
    const expansions = expandSearchToken(token)
    return expansions.some((exp) => joined.includes(exp))
  })
}

export type ServiceSearchScore = {
  matches: boolean
  score: number
  reasons: string[]
}

/**
 * Puntúa relevancia: nombre/rubro > descripción > ubicación.
 * Evita el falso positivo de meter todos los sinónimos de una categoría en el haystack.
 */
export function scoreServiceSearch(
  service: Record<string, unknown>,
  term: string,
  knownCities: string[] = []
): ServiceSearchScore {
  const parsed = parseSearchQuery(term, knownCities)
  if (parsed.tokens.length === 0) {
    return { matches: true, score: 0, reasons: [] }
  }

  if (!locationMatchesAll(service, parsed.locationTokens)) {
    return { matches: false, score: 0, reasons: [] }
  }

  const name = normalizeSearchText(String(service.name || ""))
  const business = normalizeSearchText(String(service.businessName || ""))
  const category = normalizeSearchText(String(service.category || ""))
  const description = normalizeSearchText(String(service.description || ""))
  const provider = normalizeSearchText(String(service.providerName || ""))

  // Solo ubicación (ej. "rosario").
  if (parsed.serviceTokens.length === 0) {
    let score = 40
    if (parsed.locationTokens.some((t) => fieldMatchesToken(normalizeSearchText(String(service.city || "")), t))) {
      score += 20
    }
    return { matches: true, score, reasons: ["location"] }
  }

  let score = 0
  const reasons: string[] = []

  for (const token of parsed.serviceTokens) {
    let tokenHit = false

    if (fieldMatchesToken(name, token)) {
      score += 100
      reasons.push("name")
      tokenHit = true
    } else if (fieldMatchesToken(business, token)) {
      score += 90
      reasons.push("business")
      tokenHit = true
    } else if (fieldMatchesToken(category, token)) {
      score += 80
      reasons.push("category")
      tokenHit = true
    } else if (fieldMatchesToken(provider, token)) {
      score += 55
      reasons.push("provider")
      tokenHit = true
    } else if (fieldMatchesToken(description, token)) {
      score += 35
      reasons.push("description")
      tokenHit = true
    } else if (contentMatchesToken(service, token)) {
      score += 25
      reasons.push("content")
      tokenHit = true
    }

    if (!tokenHit) {
      return { matches: false, score: 0, reasons: [] }
    }
  }

  if (parsed.locationTokens.length > 0) {
    score += 25
    reasons.push("location")
  }

  // Bonus categoría exacta al término completo.
  if (serviceMatchesCategory(service, term)) score += 30

  return { matches: score > 0, score, reasons }
}

/** Coincide con nombre, descripción, categoría, comercio o equivalencias (plomero/plomería). */
export function serviceMatchesSearch(
  service: Record<string, unknown>,
  term: string,
  knownCities: string[] = []
): boolean {
  return scoreServiceSearch(service, term, knownCities).matches
}

/** Coincide solo con ciudad o dirección (búsqueda por localidad). */
export function serviceMatchesLocationSearch(
  service: Record<string, unknown>,
  term: string,
  knownCities: string[] = []
): boolean {
  const parsed = parseSearchQuery(term, knownCities)
  if (parsed.locationTokens.length > 0 && parsed.serviceTokens.length === 0) {
    return locationMatchesAll(service, parsed.locationTokens)
  }

  const normalizedTerm = normalizeSearchText(term)
  if (!normalizedTerm) return false

  return getLocationFields(service).some((field) => normalizeSearchText(field).includes(normalizedTerm))
}

/** Compara categoría ignorando mayúsculas, acentos y espacios. */
export function serviceMatchesCategory(service: Record<string, unknown>, categoryName: string): boolean {
  const serviceCategory = canonicalCategoryKey(String(service.category || ""))
  const target = canonicalCategoryKey(categoryName)
  if (!serviceCategory || !target) return false
  return serviceCategory === target
}

export function findOfficialCategoryName(
  raw: string | undefined | null,
  categoryNames: string[]
): string | null {
  const normalized = canonicalCategoryKey(String(raw || ""))
  if (!normalized) return null
  return categoryNames.find((name) => canonicalCategoryKey(name) === normalized) || null
}

export function isUncategorizedService(
  service: Record<string, unknown>,
  categoryNames: string[]
): boolean {
  return !findOfficialCategoryName(String(service.category || ""), categoryNames)
}

export function getServiceCoordinates(service: Record<string, unknown>): { lat: number; lng: number } | null {
  const lat = Number(service.latitude ?? service.lat)
  const lng = Number(service.longitude ?? service.lng)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

type RankableService = Record<string, unknown> & {
  id?: string
  providerId?: string
  rating?: number
}

/** Deduplica por proveedor (queda el mejor puntuado / más relevante). */
export function dedupeServicesByProvider<T extends RankableService>(
  services: T[],
  scoreOf?: (service: T) => number
): T[] {
  const best = new Map<string, T>()
  for (const service of services) {
    const key = String(service.providerId || service.id || "")
    if (!key) continue
    const prev = best.get(key)
    if (!prev) {
      best.set(key, service)
      continue
    }
    const prevScore = scoreOf ? scoreOf(prev) : Number(prev.rating || 0)
    const nextScore = scoreOf ? scoreOf(service) : Number(service.rating || 0)
    if (nextScore > prevScore) best.set(key, service)
  }
  return Array.from(best.values())
}

/** Filtra, puntúa, deduplica y ordena resultados de búsqueda. */
export function rankServicesForSearch<T extends RankableService>(services: T[], term: string): T[] {
  const trimmed = term.trim()
  if (!trimmed) return []

  const knownCities = Array.from(
    new Set(
      services
        .map((service) => normalizeSearchText(String(service.city || "")))
        .filter((city) => city.length >= 3)
    )
  )

  const scored = services
    .map((service) => ({ service, meta: scoreServiceSearch(service, trimmed, knownCities) }))
    .filter((row) => row.meta.matches)

  const scoreMap = new Map(scored.map((row) => [row.service, row.meta.score]))

  const deduped = dedupeServicesByProvider(
    scored.map((row) => row.service),
    (service) => (scoreMap.get(service) || 0) * 10 + Number(service.rating || 0)
  )

  return deduped.sort((a, b) => {
    const scoreA = scoreMap.get(a) || 0
    const scoreB = scoreMap.get(b) || 0
    if (scoreA !== scoreB) return scoreB - scoreA
    return Number(b.rating || 0) - Number(a.rating || 0)
  })
}
