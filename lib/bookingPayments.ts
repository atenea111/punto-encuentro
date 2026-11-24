import { formatMoney } from '@/lib/formatMoney'

export type PaymentMethod = 'cash' | 'mercadopago' | 'transfer' | 'later'
export type PaymentStatus = 'pending' | 'paid' | 'refunded'

export function isUnpaidBooking(booking: {
  paymentStatus?: string
  status?: string
  price?: number
} | null | undefined) {
  if (!booking) return false
  if (booking.status === 'cancelled') return false
  if (booking.paymentStatus === 'paid' || booking.paymentStatus === 'refunded') return false
  const price = Number(booking.price || 0)
  return price > 0
}

export function paymentStatusLabel(status?: string) {
  switch (status) {
    case 'paid':
      return 'Pagado'
    case 'refunded':
      return 'Reembolsado'
    case 'pending':
    default:
      return 'Sin pagar'
  }
}

export function paymentMethodLabel(method?: string) {
  switch (method) {
    case 'mercadopago':
      return 'Mercado Pago'
    case 'transfer':
      return 'Transferencia'
    case 'cash':
      return 'Efectivo'
    case 'later':
      return 'Pagar después'
    default:
      return method || 'Sin definir'
  }
}

export function unpaidSummary(bookings: Array<{ price?: number; paymentStatus?: string; status?: string }>) {
  const unpaid = bookings.filter(isUnpaidBooking)
  const total = unpaid.reduce((sum, booking) => sum + (Number(booking.price) || 0), 0)
  return {
    unpaid,
    count: unpaid.length,
    total,
    totalLabel: formatMoney(total),
  }
}
