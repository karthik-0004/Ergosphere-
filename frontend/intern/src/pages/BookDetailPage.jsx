import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Share2,
  Sparkles,
  Star,
  UserRound,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

import { bookApi } from '../api/bookApi'
import BookCard from '../components/BookCard'
import ErrorMessage from '../components/ErrorMessage'
import InsightCard from '../components/InsightCard'
import LoadingSpinner from '../components/LoadingSpinner'

const insightSteps = [
  'Step 1: Analyzing book content...',
  'Step 2: Classifying genre...',
  'Step 3: Generating summary...',
  'Step 4: Analyzing sentiment...',
]

export default function BookDetailPage() {
  const { id } = useParams()
  const [book, setBook] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [recoLoading, setRecoLoading] = useState(true)
  const [error, setError] = useState('')
  const [insightLoading, setInsightLoading] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [visibleSteps, setVisibleSteps] = useState([])

  const loadBook = async () => {
    try {
      const { data } = await bookApi.getBookDetail(id)
      setBook(data)
      setError('')
    } catch {
      setError('Failed to fetch book details.')
    }
  }

  const loadRecommendations = async () => {
    setRecoLoading(true)
    try {
      const { data } = await bookApi.getRecommendations(id)
      setRecommendations(data.recommendations || [])
    } catch {
      setRecommendations([])
    } finally {
      setRecoLoading(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      await Promise.all([loadBook(), loadRecommendations()])
      setLoading(false)
    }
    fetchData()
  }, [id])

  useEffect(() => {
    if (!insightLoading) {
      setVisibleSteps([])
      return
    }

    let index = 0
    const timer = setInterval(() => {
      index += 1
      setVisibleSteps(insightSteps.slice(0, Math.min(index, insightSteps.length)))
      if (index >= insightSteps.length) {
        clearInterval(timer)
      }
    }, 1500)

    return () => clearInterval(timer)
  }, [insightLoading])

  const rating = Number(book?.rating || 0)
  const description = book?.description || 'No description available.'
  const shortDescription = description.slice(0, 300)
  const availability = (book?.availability || '').toLowerCase()
  const hasInsights = !!book?.insights?.is_processed

  const handleGenerateInsights = async () => {
    setInsightLoading(true)
    try {
      await bookApi.generateInsights(id)
      toast.success('Insights generated successfully.')
      await Promise.all([loadBook(), loadRecommendations()])
    } catch {
      toast.error('Failed to generate insights.')
    } finally {
      setInsightLoading(false)
    }
  }

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied!')
    } catch {
      toast.error('Could not copy link.')
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="h-6 w-44 animate-pulse rounded bg-slate-200" />
        <HeroSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <ErrorMessage message={error} onRetry={loadBook} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <section className="grid grid-cols-1 gap-8 rounded-3xl bg-white p-6 shadow-soft lg:grid-cols-[320px,1fr]">
        <div className="overflow-hidden rounded-2xl bg-slate-100 shadow-2xl">
          {book?.cover_image_url && !imgError ? (
            <img
              src={book.cover_image_url}
              alt={book.title}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-[420px] items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-5xl font-black text-white">
              {(book?.title || 'Book').slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h1 className="font-display text-3xl font-black text-slate-900">{book?.title}</h1>
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <UserRound className="h-4 w-4" /> {book?.author || 'Unknown Author'}
          </p>
          <div className="flex items-center gap-1 text-amber-500">
            {Array.from({ length: Math.floor(rating || 0) }).map((_, index) => (
              <Star key={index} className="h-5 w-5 fill-current" />
            ))}
            <span className="ml-2 text-sm font-semibold text-slate-600">
              {rating.toFixed(1)}/5
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              {book?.price || 'N/A'}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                availability.includes('in stock')
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {book?.availability || 'Unknown'}
            </span>
            {book?.genre ? (
              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                {book.genre}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {book?.book_url ? (
              <a
                href={book.book_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                View on Store <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}

            <button
              type="button"
              onClick={handleCopyShare}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>

          <div>
            <button
              type="button"
              disabled={hasInsights || insightLoading}
              onClick={handleGenerateInsights}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {insightLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              ✨ Generate AI Insights
            </button>
          </div>

          {insightLoading ? (
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm text-violet-700">
              <p className="mb-2 font-semibold">Generating insights...</p>
              <ul className="space-y-1">
                {visibleSteps.map((step) => (
                  <li key={step} className="animate-pulse">
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      <section>
        <InsightCard
          insights={book?.insights}
          loading={insightLoading}
          onGenerate={handleGenerateInsights}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-black text-slate-900">You might also like...</h2>
        {recoLoading ? (
          <LoadingSpinner text="Loading recommendations..." size="small" />
        ) : recommendations.length === 0 ? (
          <p className="text-sm text-slate-500">No recommendations available.</p>
        ) : (
          <div className="grid auto-cols-[250px] grid-flow-col gap-4 overflow-x-auto pb-2">
            {recommendations.map((bookItem) => (
              <BookCard key={bookItem.id} book={bookItem} compact />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-xl font-black text-slate-900">Description</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
          {showFullDescription ? description : shortDescription}
          {description.length > 300 && !showFullDescription ? '...' : ''}
        </p>
        {description.length > 300 ? (
          <button
            type="button"
            onClick={() => setShowFullDescription((v) => !v)}
            className="mt-3 text-sm font-semibold text-blue-700 hover:text-blue-600"
          >
            {showFullDescription ? 'Read less' : 'Read more'}
          </button>
        ) : null}
      </section>
    </div>
  )
}

function HeroSkeleton() {
  return (
    <section className="grid grid-cols-1 gap-8 rounded-3xl bg-white p-6 shadow-soft lg:grid-cols-[320px,1fr]">
      <div className="h-[420px] animate-pulse rounded-2xl bg-slate-200" />
      <div className="space-y-4">
        <div className="h-10 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-5 w-1/2 animate-pulse rounded bg-slate-200" />
        <div className="h-5 w-2/5 animate-pulse rounded bg-slate-200" />
        <div className="h-8 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="h-10 w-44 animate-pulse rounded bg-slate-200" />
      </div>
    </section>
  )
}
