import { useEffect, useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router'
import { api, ApiError, describeError, type ProductDetail } from './api'
import { formatPrice, toneFor } from './format'

type State =
  | { status: 'loading' }
  | { status: 'error'; notFound: boolean; message: string }
  | { status: 'ready'; product: ProductDetail }

// Distinct non-null values, in the order the variants arrive.
function unique(values: (string | null)[]): string[] {
  return [...new Set(values.filter((value): value is string => value !== null))]
}

function Detail({ product }: { product: ProductDetail }) {
  const { variants } = product
  const colors = unique(variants.map((v) => v.color))
  const sizes = unique(variants.map((v) => v.size))

  // Start on the first colour that still has stock, so the page never opens on a sold-out colour by accident.
  const defaultColor = colors.find((c) => variants.some((v) => v.color === c && v.in_stock)) ?? colors[0] ?? null
  const [pickedColor, setPickedColor] = useState<string | null>(null)
  const [pickedSize, setPickedSize] = useState<string | null>(null)
  const color = pickedColor ?? defaultColor

  const find = (c: string | null, s: string | null) => variants.find((v) => v.color === c && v.size === s)

  function chooseColor(next: string) {
    setPickedColor(next)
    // Keep the chosen size only if this colour comes in it and it is in stock.
    if (pickedSize && !find(next, pickedSize)?.in_stock) setPickedSize(null)
  }

  const needsSize = sizes.length > 0
  const variant = needsSize ? (pickedSize ? find(color, pickedSize) : undefined) : find(color, null)
  const colorHasStock = variants.some((v) => v.color === color && v.in_stock)

  let status = 'In stock'
  let statusClass = 'text-muted'
  if (!colorHasStock || (variant && !variant.in_stock)) {
    status = 'Sold out'
    statusClass = 'text-danger'
  } else if (needsSize && !pickedSize) {
    status = 'Select a size'
  }

  const prices = variants.map((v) => Number(v.price))
  const lowest = Math.min(...prices)
  const priceText = variant
    ? formatPrice(variant.price)
    : prices.every((p) => p === lowest)
      ? formatPrice(lowest)
      : `From ${formatPrice(lowest)}`

  const tone = toneFor(color)

  return (
    <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
      <div
        className="reveal flex aspect-[4/3] items-end rounded-[28px] p-7 transition-colors duration-500 motion-reduce:transition-none sm:p-10 lg:sticky lg:top-[72px] lg:aspect-[5/6] lg:self-start"
        style={{ backgroundColor: tone.bg, color: tone.fg }}
      >
        <h1 className="max-w-[12ch] text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.02] font-semibold tracking-[-0.04em] text-balance">
          {product.name}
        </h1>
      </div>

      <div style={{ '--i': 2 } as CSSProperties} className="reveal flex flex-col gap-8 lg:pt-4">
        {product.description && <p className="max-w-[44ch] text-xl leading-snug text-muted">{product.description}</p>}

        {colors.length > 0 && (
          <section aria-labelledby="color-label" className="flex flex-col gap-3">
            <h2 id="color-label" className="text-[17px] font-semibold">
              Color <span className="font-normal text-muted">{color}</span>
            </h2>
            <div className="flex flex-wrap gap-3">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  aria-pressed={c === color}
                  onClick={() => chooseColor(c)}
                  style={{ backgroundColor: toneFor(c).bg }}
                  className={`h-9 w-9 cursor-pointer rounded-full ring-1 ring-black/15 transition-transform duration-200 hover:scale-110 active:scale-95 motion-reduce:transition-none ${
                    c === color ? 'ring-2 ring-brand ring-offset-2 ring-offset-canvas' : ''
                  }`}
                />
              ))}
            </div>
          </section>
        )}

        {needsSize && (
          <section aria-labelledby="size-label" className="flex flex-col gap-3">
            <h2 id="size-label" className="text-[17px] font-semibold">
              Size
            </h2>
            <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(72px,1fr))]">
              {sizes.map((s) => {
                const available = find(color, s)?.in_stock ?? false
                const selected = s === pickedSize
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={!available}
                    aria-pressed={selected}
                    onClick={() => setPickedSize(s)}
                    className={`h-12 cursor-pointer rounded-xl border bg-white text-[17px] font-medium disabled:cursor-not-allowed disabled:text-muted/60 disabled:line-through ${
                      selected ? 'border-2 border-brand' : 'border-line hover:border-ink'
                    }`}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </section>
        )}

        <div className="flex flex-col gap-1 border-t border-line pt-6">
          <span className="text-[32px] leading-tight font-semibold tracking-tight tabular-nums">{priceText}</span>
          <span aria-live="polite" className={`text-[17px] ${statusClass}`}>
            {status}
          </span>
        </div>
      </div>
    </div>
  )
}

// Route element for /product/:id. The key remounts the loader per product, so it always starts from 'loading'.
export default function ProductView() {
  const { id = '' } = useParams()
  return <ProductLoader key={id} id={id} />
}

function ProductLoader({ id }: { id: string }) {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    api
      .getProduct(id)
      .then((product) => {
        if (!cancelled) setState({ status: 'ready', product })
      })
      .catch((err) => {
        if (!cancelled) setState({ status: 'error', notFound: err instanceof ApiError && err.status === 404, message: describeError(err) })
      })
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <main className="mx-auto w-full max-w-[1120px] px-5 pb-20 sm:px-8">
      <Link to="/" className="inline-flex items-center gap-1 py-6 text-[17px] text-brand">
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none" aria-hidden="true">
          <path d="M7 1 1 7l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        All products
      </Link>

      {state.status === 'loading' && (
        <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-14" aria-busy="true">
          <div className="aspect-[4/3] rounded-[28px] bg-[#ebebed] lg:aspect-[5/6]" />
        </div>
      )}

      {state.status === 'error' && (
        <div className="flex flex-col items-start gap-3 rounded-[28px] bg-white p-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            {state.notFound ? 'This product is not available' : 'Product did not load'}
          </h1>
          <p className="max-w-[48ch] text-[17px] leading-snug text-muted">
            {state.notFound ? 'It may have been removed or is no longer on sale.' : state.message}
          </p>
        </div>
      )}

      {state.status === 'ready' && <Detail product={state.product} />}
    </main>
  )
}
