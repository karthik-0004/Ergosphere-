import {
  ArrowUp,
  BookOpen,
  Brain,
  Plus,
  RefreshCcw,
  Search,
  Sparkles,
  Star,
  UploadCloud,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { bookApi } from '../api/bookApi'
import BookCard from '../components/BookCard'
import BookUploadModal from '../components/BookUploadModal'
import ErrorMessage from '../components/ErrorMessage'

const BOOKS_PER_PAGE = 12

export default function DashboardPage() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [genreFilter, setGenreFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)
  const [scrapePages, setScrapePages] = useState(2)
  const [showScrapePanel, setShowScrapePanel] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [actionLoading, setActionLoading] = useState({
    scrape: false,
    ingest: false,
    generateAll: false,
  })

  const loadBooks = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const { data } = await bookApi.getAllBooks()
      const list = data.books || []
      setBooks(list)
      toast.success(`✅ Loaded ${list.length} books`)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load books.')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadBooks()
    const timer = setTimeout(() => setMounted(true), 80)
    const onScroll = () => setShowScrollTop(window.scrollY > 300)
    window.addEventListener('scroll', onScroll)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const genres = useMemo(() => {
    const unique = new Set(books.map((book) => book.genre).filter(Boolean))
    return ['all', ...Array.from(unique).sort()]
  }, [books])

  const stats = useMemo(() => {
    const insightsCount = books.filter((book) => !!book.insights).length
    const ratings = books
      .map((book) => Number(book.rating))
      .filter((v) => Number.isFinite(v))
    const avgRating = ratings.length
      ? (ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(2)
      : '0.00'

    return {
      total: books.length,
      insightsCount,
      avgRating,
    }
  }, [books])

  const filteredBooks = useMemo(() => {
    let result = [...books]

    if (search.trim()) {
      const term = search.toLowerCase()
      result = result.filter(
        (book) =>
          book.title?.toLowerCase().includes(term) ||
          book.author?.toLowerCase().includes(term),
      )
    }

    if (genreFilter !== 'all') {
      result = result.filter((book) => book.genre === genreFilter)
    }

    if (sortBy === 'rating') {
      result.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
    } else if (sortBy === 'title') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    } else {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }

    return result
  }, [books, search, genreFilter, sortBy])

  const pageCount = Math.max(1, Math.ceil(filteredBooks.length / BOOKS_PER_PAGE))
  const paginatedBooks = filteredBooks.slice(
    (page - 1) * BOOKS_PER_PAGE,
    page * BOOKS_PER_PAGE,
  )

  useEffect(() => {
    setPage(1)
  }, [search, genreFilter, sortBy])

  const handleScrape = async () => {
    setActionLoading((prev) => ({ ...prev, scrape: true }))
    try {
      const { data } = await bookApi.scrapeBooks(scrapePages)
      toast.success(`Scraping complete. Added ${data.books_scraped ?? 0} books.`)
      await loadBooks({ silent: true })
    } catch {
      toast.error('Scraping failed. Please check backend logs.')
    } finally {
      setActionLoading((prev) => ({ ...prev, scrape: false }))
    }
  }

  const handleIngest = async () => {
    setActionLoading((prev) => ({ ...prev, ingest: true }))
    try {
      const { data } = await bookApi.ingestAllBooks()
      toast.success(`Ingestion complete: ${data.books_ingested} books.`)
    } catch {
      toast.error('Ingestion failed.')
    } finally {
      setActionLoading((prev) => ({ ...prev, ingest: false }))
    }
  }

  const handleGenerateAllInsights = async () => {
    const targets = books.filter((book) => !book.insights?.is_processed)
    if (!targets.length) {
      toast.success('All books already have insights.')
      return
    }

    setActionLoading((prev) => ({ ...prev, generateAll: true }))
    let completed = 0

    for (const book of targets) {
      try {
        await bookApi.generateInsights(book.id)
        completed += 1
      } catch {
        // Continue processing other books
      }
    }

    setActionLoading((prev) => ({ ...prev, generateAll: false }))
    toast.success(`Generated insights for ${completed}/${targets.length} books.`)
    await loadBooks({ silent: true })
  }

  return (
    <div
      className={`mx-auto max-w-7xl space-y-8 px-4 py-6 transition-all duration-700 sm:px-6 lg:px-8 ${
        mounted ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
      }`}
    >
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-violet-900 p-6 text-white shadow-soft sm:p-8">
        <h1 className="font-display text-3xl font-black sm:text-4xl">
          Book Intelligence Platform
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-blue-100 sm:text-base">
          Discover, analyze, and explore books with AI.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowScrapePanel((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
          >
            <UploadCloud className="h-4 w-4" /> 🔍 Scrape New Books
          </button>
          <button
            type="button"
            onClick={handleIngest}
            disabled={actionLoading.ingest}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-300 bg-blue-700/40 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700/60 disabled:opacity-60"
          >
            <Brain className="h-4 w-4" /> 🧠 Ingest to AI
          </button>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            <Plus className="h-4 w-4" /> ➕ Add Book Manually
          </button>
        </div>

        {showScrapePanel ? (
          <div className="mt-4 max-w-md rounded-xl bg-white/10 p-4 backdrop-blur">
            <label htmlFor="scrape-pages" className="text-sm font-medium text-blue-100">
              Pages to scrape (1-10)
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                id="scrape-pages"
                type="number"
                min={1}
                max={10}
                value={scrapePages}
                onChange={(e) =>
                  setScrapePages(
                    Math.min(10, Math.max(1, Number(e.target.value) || 1)),
                  )
                }
                className="w-28 rounded-lg border border-blue-200/40 bg-white px-3 py-2 text-slate-900 outline-none ring-blue-300 focus:ring"
              />
              <button
                type="button"
                onClick={handleScrape}
                disabled={actionLoading.scrape}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-60"
              >
                {actionLoading.scrape ? (
                  <RefreshCcw className="h-4 w-4 animate-spin" />
                ) : null}
                Start Scraping
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-3">
        <StatCard icon={BookOpen} label="Total Books" value={stats.total} />
        <StatCard
          icon={Sparkles}
          label="Books with AI Insights"
          value={stats.insightsCount}
        />
        <StatCard icon={Star} label="Average Rating" value={stats.avgRating} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title or author"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none ring-blue-300 focus:ring"
            />
          </label>

          <select
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-300 focus:ring"
          >
            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre === 'all' ? 'All Genres' : genre}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-300 focus:ring"
          >
            <option value="newest">Newest First</option>
            <option value="rating">Highest Rated</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleGenerateAllInsights}
            disabled={actionLoading.generateAll}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
          >
            {actionLoading.generateAll ? (
              <RefreshCcw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate All Insights
          </button>
        </div>
      </section>

      {loading ? (
        <SkeletonGrid />
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadBooks} />
      ) : paginatedBooks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-lg font-semibold text-slate-700">No books found</p>
          <p className="mt-2 text-sm text-slate-500">
            Try changing your search, filter, or scrape new books.
          </p>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {paginatedBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </section>

          <section className="flex items-center justify-center gap-4 py-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => prev - 1)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm font-semibold text-slate-600">
              Page {page} of {pageCount}
            </span>
            <button
              type="button"
              disabled={page >= pageCount}
              onClick={() => setPage((prev) => prev + 1)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
            >
              Next
            </button>
          </section>
        </>
      )}

      {showScrollTop ? (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-lg hover:bg-slate-800"
        >
          <ArrowUp className="h-4 w-4" /> Top
        </button>
      ) : null}

      <BookUploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => loadBooks({ silent: true })}
      />
    </div>
  )
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 inline-flex rounded-lg bg-slate-100 p-2 text-slate-600">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-3xl font-black text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  )
}

function SkeletonGrid() {
  return (
    <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, idx) => (
        <div
          key={idx}
          className="animate-pulse overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          <div className="h-56 bg-slate-200" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-3/4 rounded bg-slate-200" />
            <div className="h-3 w-1/2 rounded bg-slate-200" />
            <div className="h-3 w-2/3 rounded bg-slate-200" />
            <div className="h-8 rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </section>
  )
}
