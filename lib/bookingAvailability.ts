export const DEFAULT_BOOKING_SLOTS = ["10:00", "11:30", "15:00", "16:30", "18:00"]

function todayIso() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

function nowHm() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
}

export function occupiedTimes(
  bookings: Array<{ date?: string; time?: string; status?: string; serviceId?: string; providerId?: string }>,
  date: string,
  serviceId?: string,
  providerId?: string
) {
  return bookings
    .filter((booking) => {
      if (booking.status === "cancelled") return false
      if (String(booking.date || "") !== date) return false
      if (serviceId && booking.serviceId !== serviceId) return false
      if (providerId && booking.providerId !== providerId) return false
      return Boolean(booking.time)
    })
    .map((booking) => String(booking.time))
}

export function getAvailableSlots(
  date: string,
  bookings: Array<{ date?: string; time?: string; status?: string; serviceId?: string; providerId?: string }>,
  serviceId?: string,
  providerId?: string,
  slots: string[] = DEFAULT_BOOKING_SLOTS
) {
  if (!date) return []
  if (date < todayIso()) return []
  const taken = new Set(occupiedTimes(bookings, date, serviceId, providerId))
  const isToday = date === todayIso()
  const current = nowHm()
  return slots.filter((time) => {
    if (taken.has(time)) return false
    if (isToday && time <= current) return false
    return true
  })
}
