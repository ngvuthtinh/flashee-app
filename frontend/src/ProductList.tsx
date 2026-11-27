import { useEffect, useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { api, describeError, type ProductListItem } from './api'
import { formatPrice } from './format'

function Tile({ product, order }: { product: ProductListItem; order: number }) {
  return (
    <Link
      to={`/product/${product.id}`}
      style={{ '--i': order } as CSSProperties}
      className="reveal flex min-h-[340px] flex-col justify-between rounded-[28px] bg-white p-7 transition-transform duration-300 ease-out hover:scale-[1.015] active:scale-[0.985] motion-reduce:transition-none sm:p-8"
    >
      <div>
        <h2 className="text-[28px] leading-[1.1] font-semibold tracking-[-0.025em] text-balance">{product.name}</h2>
        {product.description && (
          <p className="mt-3 line-clamp-2 text-[17px] leading-snug text-muted">{product.description}</p>
        )}
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-[17px] tabular-nums">From {formatPrice(product.price_from)}</span>
        {product.in_stock ? (
          <span className="text-[17px] text-brand">Details</span>
        ) : (
          <span className="text-[17px] text-muted">Sold out</span>
        )}
      </div>
    </Link>
  )
}

const PLACEHOLDERS = Array.from({ length: 6 }, (_, i) => i)
const PAGE_SIZE = 9 // matches api.listProducts' default limit

export default function ProductList() {
  const [items, setItems] = useState<ProductListItem[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  // First page. `attempt` lets "Try again" re-run the effect.
  useEffect(() => {
    let cancelled = false
    api
      .listProducts(null)
      .then((page) => {
        if (cancelled) return
        setItems(page.items)
        setCursor(page.pagination.next_cursor)
        setHasMore(page.pagination.has_more)
        setStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setError(describeError(err))
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  async function showMore() {
    setLoadingMore(true)
    setError('')
    try {
      const page = await api.listProducts(cursor)
      setItems((current) => [...current, ...page.items])
      setCursor(page.pagination.next_cursor)
      setHasMore(page.pagination.has_more)
    } catch (err) {
      setError(describeError(err))
    } finally {
      setLoadingMore(false)
    }
  }

  function retry() {
    setStatus('loading')
    setError('')
    setAttempt((n) => n + 1)
  }

  return (
    <main className="mx-auto w-full max-w-[1120px] px-5 pb-20 sm:px-8">
      <h1 className="reveal pt-14 pb-10 text-5xl leading-[1.05] font-semibold tracking-[-0.035em] sm:pt-20 sm:text-[72px]">
        Shop all.
      </h1>

      {status === 'loading' && (
        <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]" aria-busy="true">
          {PLACEHOLDERS.map((n) => (
            <div key={n} className="min-h-[340px] rounded-[28px] bg-[#ebebed]" />
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-start gap-4 rounded-[28px] bg-white p-8">
          <h2 className="text-2xl font-semibold tracking-tight">Products did not load</h2>
          <p className="max-w-[48ch] text-[17px] leading-snug text-muted">
            {error} Check that the backend is running, then try again.
          </p>
          <button
            type="button"
            onClick={retry}
            className="h-11 cursor-pointer rounded-full bg-brand px-6 text-[15px] font-medium text-white hover:bg-brand-hover"
          >
            Try again
          </button>
        </div>
      )}

      {status === 'ready' && (
        <>
          <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
            {/* order restarts at 0 for every page of 9, so tiles added by "Show more" stagger from their own start */}
            {items.map((product, index) => (
              <Tile key={product.id} product={product} order={(index % PAGE_SIZE) + 1} />
            ))}
          </div>

          {items.length === 0 && <p className="text-[17px] text-muted">No products are on sale right now.</p>}

          {error && (
            <p role="alert" className="mt-8 text-center text-[15px] text-danger">
              {error}
            </p>
          )}

          {hasMore && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={showMore}
                disabled={loadingMore}
                className="h-12 cursor-pointer rounded-full bg-white px-8 text-[17px] font-medium hover:bg-[#fbfbfd] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingMore ? 'Loading…' : 'Show more'}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  )
}
