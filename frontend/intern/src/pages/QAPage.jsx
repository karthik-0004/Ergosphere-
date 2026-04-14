import { Bot, Copy, PanelLeft, Send, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

import { bookApi } from '../api/bookApi'
import LoadingSpinner from '../components/LoadingSpinner'

const suggestedQuestions = [
  'What are the best mystery books?',
  'Recommend me a romance novel',
  'Which books have the highest ratings?',
  'Tell me about science fiction books',
  'What fantasy books are available?',
]

function nowTimestamp() {
  return new Date().toISOString()
}

export default function QAPage() {
  const [books, setBooks] = useState([])
  const [selectedBookId, setSelectedBookId] = useState('')
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('bookiq_qa_messages')
    return saved ? JSON.parse(saved) : []
  })
  const [loading, setLoading] = useState(false)
  const [loadingBooks, setLoadingBooks] = useState(true)
  const [showControlsOnMobile, setShowControlsOnMobile] = useState(false)

  const bottomRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('bookiq_qa_messages', JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    const loadBooks = async () => {
      setLoadingBooks(true)
      try {
        const { data } = await bookApi.getAllBooks()
        setBooks(data.books || [])
      } catch {
        toast.error('Failed to load books for question filter.')
      } finally {
        setLoadingBooks(false)
      }
    }
    loadBooks()
  }, [])

  const handleAsk = async () => {
    if (!question.trim() || loading) return

    const payloadQuestion = question.trim()
    const userMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: payloadQuestion,
      timestamp: nowTimestamp(),
    }

    setMessages((prev) => [...prev, userMessage])
    setQuestion('')
    setLoading(true)

    try {
      const { data } = await bookApi.askQuestion(
        payloadQuestion,
        selectedBookId ? Number(selectedBookId) : null,
      )

      const aiMessage = {
        id: `a-${Date.now()}`,
        role: 'ai',
        text: data.answer || 'No response.',
        sources: data.sources || [],
        timestamp: nowTimestamp(),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch {
      toast.error('Failed to get answer from AI.')
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleAsk()
    }
  }

  const clearConversation = () => {
    setMessages([])
    localStorage.removeItem('bookiq_qa_messages')
  }

  const copyAnswer = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Answer copied!')
    } catch {
      toast.error('Could not copy answer.')
    }
  }

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(280px,40%),1fr] lg:px-8">
      <aside
        className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${
          showControlsOnMobile ? 'block' : 'hidden lg:block'
        }`}
      >
        <h1 className="font-display text-2xl font-black text-slate-900">🤖 Ask AI About Books</h1>
        <p className="mt-2 text-sm text-slate-600">
          Ask about genres, recommendations, summaries, and availability using your
          book database.
        </p>

        <div className="mt-5 space-y-2">
          <label className="text-sm font-semibold text-slate-700">
            Filter by Book (optional)
          </label>
          {loadingBooks ? (
            <LoadingSpinner size="small" text="Loading books..." />
          ) : (
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-300 focus:ring"
            >
              <option value="">All Books</option>
              {books.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="mt-6">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            Suggested Questions
          </h2>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setQuestion(item)}
                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="flex min-h-[70vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Conversation
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowControlsOnMobile((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 lg:hidden"
            >
              <PanelLeft className="h-3.5 w-3.5" /> Controls
            </button>
            <button
              type="button"
              onClick={clearConversation}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4">
          {messages.length === 0 ? (
            <p className="text-sm text-slate-500">
              No messages yet. Ask your first question.
            </p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {message.role === 'ai' ? (
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                        <Bot className="h-3.5 w-3.5" /> AI Assistant
                      </div>
                      <button
                        type="button"
                        onClick={() => copyAnswer(message.text)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-50"
                      >
                        <Copy className="h-3 w-3" /> Copy answer
                      </button>
                    </div>
                  ) : null}
                  <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                  {message.role === 'ai' && message.sources?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.sources.map((source) => (
                        <Link
                          key={`${message.id}-${source.book_id}`}
                          to={`/books/${source.book_id}`}
                          className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-200"
                        >
                          {source.title}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                  <p className="mt-2 text-[11px] opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="inline-flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
              </span>
              AI is typing...
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-200 bg-white p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={question}
              maxLength={1000}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
              disabled={loading}
              placeholder="Ask something about your books..."
              className="min-h-[64px] flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-300 focus:ring disabled:bg-slate-100"
            />
            <button
              type="button"
              onClick={handleAsk}
              disabled={loading || !question.trim()}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              <Send className="h-4 w-4" /> Ask
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span>{question.length}/1000</span>
          </div>
        </div>
      </section>
    </div>
  )
}
