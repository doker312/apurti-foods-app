export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending:          'bg-yellow-100 text-yellow-800',
    accepted:         'bg-blue-100 text-blue-800',
    picked:           'bg-purple-100 text-purple-800',
    out_for_delivery: 'bg-orange-100 text-orange-800',
    delivered:        'bg-green-100 text-green-800',
    cancelled:        'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending:          'Pending',
    accepted:         'Accepted',
    picked:           'Picked Up',
    out_for_delivery: 'Out for Delivery',
    delivered:        'Delivered',
    cancelled:        'Cancelled',
  }
  return labels[status] || status
}

export function calculateMargin(buyPrice: number, retailPrice: number): number {
  if (buyPrice >= retailPrice) return 0
  return Math.round(((retailPrice - buyPrice) / retailPrice) * 100)
}

export function calculateSavings(originalPrice: number, customPrice: number, quantity: number): number {
  return Math.max(0, (originalPrice - customPrice) * quantity)
}
