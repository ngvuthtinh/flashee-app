const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })

// The API returns Postgres DECIMAL as a string ("4500000.00"), so convert before formatting.
export function formatPrice(value: string | number): string {
  return vnd.format(Number(value))
}

// The product detail stage takes the colour of the selected variant. The API only sends a colour name,
// so each name maps to a flat background plus a text colour that stays readable on it.
export interface Tone {
  bg: string
  fg: string
}

const NEUTRAL: Tone = { bg: '#e8e8ed', fg: '#1d1d1f' }

const TONES: Record<string, Tone> = {
  black: { bg: '#1d1d1f', fg: '#f5f5f7' },
  white: { bg: '#ffffff', fg: '#1d1d1f' },
  grey: { bg: '#a1a1a6', fg: '#1d1d1f' },
  blue: { bg: '#2c5aa0', fg: '#ffffff' },
  navy: { bg: '#1b2a49', fg: '#ffffff' },
}

export function toneFor(color: string | null): Tone {
  if (!color) return NEUTRAL
  return TONES[color.toLowerCase()] ?? NEUTRAL
}
