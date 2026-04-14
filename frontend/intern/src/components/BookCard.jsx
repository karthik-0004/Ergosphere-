import { CheckCircle2, Sparkles, Star, StarHalf, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

function getInitials(text = '') {
  return text
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
}

function RatingStars({ rating }) {
  const safe = Number.isFinite(Number(rating)) ? Number(rating) : 0
  const full = Math.floor(safe)
  const hasHalf = safe - full >= 0.5
  const empty = Math.max(0, 5 - full - (hasHalf ? 1 : 0))

  return (
    <div className="flex items-center gap-1 text-amber-500">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f-${i}`} className="h-4 w-4 fill-current" />
      ))}
      {hasHalf ? <StarHalf className="h-4 w-4 fill-current" /> : null}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e-${i}`} className="h-4 w-4 text-slate-300" />
      ))}
      <span className="ml-1 text-xs font-semibold text-slate-600">{safe.toFixed(1)}</span>
    </div>
  )
}

export default function BookCard({ book, compact = false }) {
  const [imgError, setImgError] = useState(false)
  const availability = (book?.availability || '').toLowerCase()
  const inStock = availability.includes('in stock')
  const initials = useMemo(() => getInitials(book?.title), [book?.title])

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      {book?.insights?.is_processed ? (
        <div className="absolute right-3 top-3 z-20 rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-700">
          <span className="inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> AI</span>
        </div>
      ) : null}

      <div className={`${compact ? 'h-44' : 'h-56'} relative bg-slate-100`}>
        {book?.cover_image_url && !imgError ? (
          <img
            src={book.cover_image_url}
            alt={book.title}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl font-black text-white">
            {initials || 'BK'}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3
          className="line-clamp-2 min-h-[3.25rem] text-base font-bold text-slate-900"
          title={book?.title}
        >
          {book?.title}
        </h3>
        <p className="text-sm text-slate-500">{book?.author || 'Unknown Author'}</p>
        <RatingStars rating={book?.rating} />

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            {book?.price || 'N/A'}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              inStock
                ? 'bg-green-100 text-green-700'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {inStock ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {book?.availability || 'Unknown'}
          </span>
          {book?.genre ? (
            <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
              {book.genre}
            </span>
          ) : null}
        </div>

        <div className="mt-auto pt-2">
          <Link
            to={`/books/${book?.id}`}
            className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  )
}
