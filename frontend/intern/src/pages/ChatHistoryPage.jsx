import { ChevronDown, ChevronUp, MessageSquareText, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { bookApi } from '../api/bookApi'
import ErrorMessage from '../components/ErrorMessage'
import LoadingSpinner from '../components/LoadingSpinner'

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function getDateLabel(dateString) {
  const date = new Date(dateString)
  const today = startOfDay(new Date())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const target = startOfDay(date)

  if (target.getTime() === today.getTime()) return 'Today'
  if (target.getTime() === yesterday.getTime()) return 'Yesterday'
  return date.toLocaleDateString()
}

export default function ChatHistoryPage() {
  const [history, setHistory] = useState([])
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadHistory = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await bookApi.getChatHistory()
      setHistory(data.history || [])
    } catch {
      setError('Failed to load chat history.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim()
    if (!term) return history
    return history.filter((item) => item.question?.toLowerCase().includes(term))
  }, [history, search])

  const grouped = useMemo(() => {
    return filtered.reduce((acc, item) => {
      const label = getDateLabel(item.created_at)
      if (!acc[label]) acc[label] = []
      acc[label].push(item)
      return acc
    }, {})
  }, [filtered])

  const toggleExpanded = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading) return <LoadingSpinner fullPage text="Loading chat history..." />
  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <ErrorMessage message={error} onRetry={loadHistory} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-2xl bg-white p-5 shadow-sm">
        <h1 className="font-display text-2xl font-black text-slate-900">💬 Chat History</h1>
        <p className="mt-1 text-sm text-slate-600">Showing {filtered.length} conversations</p>
        <div className="relative mt-4 max-w-lg">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by question"
            className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none ring-blue-300 focus:ring"
          />
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-lg font-semibold text-slate-700">No chat history found</p>
        </div>
      ) : (
        Object.entries(grouped).map(([label, items]) => (
          <section key={label} className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">{label}</h2>
            {items.map((item) => {
              const isOpen = expanded.has(item.id)
              return (
                <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(item.id)}
                    className="flex w-full items-start justify-between gap-3 text-left"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{item.question}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="h-5 w-5 text-slate-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-500" />
                    )}
                  </button>

                  {isOpen ? (
                    <div className="mt-3 border-t border-slate-200 pt-3">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{item.answer}</p>
                      {(item.source_books || []).length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.source_books.map((source, idx) => (
                            <Link
                              key={`${item.id}-${source.book_id || idx}`}
                              to={source.book_id ? `/books/${source.book_id}` : '#'}
                              className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-200"
                            >
                              <MessageSquareText className="h-3.5 w-3.5" />
                              {source.title || source.book_id || 'Source'}
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              )
            })}
          </section>
        ))
      )}
    </div>
  )
}
