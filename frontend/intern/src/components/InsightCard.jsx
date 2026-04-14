import { BookOpenText, BrainCircuit, Loader2, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const sentimentMap = {
  positive: '😊',
  negative: '😢',
  neutral: '😐',
  mixed: '🤔',
}

export default function InsightCard({ insights, loading = false, onGenerate }) {
  if (!insights) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        <div className="bg-gradient-to-r from-violet-500 to-blue-500 px-5 py-4 text-white">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <Sparkles className="h-5 w-5" /> AI Insights
          </h3>
        </div>
        <div className="space-y-4 p-5">
          <p className="text-sm text-slate-600">No insights yet for this book.</p>
          <button
            type="button"
            disabled={loading}
            onClick={onGenerate}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate Insights
          </button>
        </div>
      </div>
    )
  }

  if (!insights.is_processed) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        <div className="bg-gradient-to-r from-violet-500 to-blue-500 px-5 py-4 text-white">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <Sparkles className="h-5 w-5" /> AI Insights
          </h3>
        </div>
        <div className="flex items-center gap-2 p-5 text-slate-700">
          <Loader2 className="h-4 w-4 animate-spin" /> Processing...
        </div>
      </div>
    )
  }

  const score = Math.max(0, Math.min(1, Number(insights.sentiment_score || 0)))
  const sentiment = (insights.sentiment || 'neutral').toLowerCase()

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
      <div className="bg-gradient-to-r from-violet-500 to-blue-500 px-5 py-4 text-white">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <Sparkles className="h-5 w-5" /> AI Insights
        </h3>
      </div>

      <div className="space-y-6 p-5">
        <section>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            <BookOpenText className="h-4 w-4" /> Summary
          </h4>
          <p className="text-sm leading-relaxed text-slate-700">{insights.summary || 'No summary available.'}</p>
        </section>

        <section className="flex flex-wrap items-center gap-3">
          <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">🎭 Genre Prediction</h4>
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">
            {insights.genre_prediction || 'Unknown'}
          </span>
        </section>

        <section>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            <BrainCircuit className="h-4 w-4" /> Sentiment
          </h4>
          <p className="mb-2 text-sm font-medium text-slate-700">
            {sentimentMap[sentiment] || '😐'} {sentiment} ({score.toFixed(2)})
          </p>
          <div className="h-2 w-full rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
              style={{ width: `${score * 100}%` }}
            />
          </div>
        </section>

        <section>
          <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">📚 Recommendations</h4>
          <div className="flex flex-wrap gap-2">
            {(insights.recommendations || []).length > 0 ? (
              insights.recommendations.map((rec) =>
                rec.id ? (
                  <Link
                    key={rec.id}
                    to={`/books/${rec.id}`}
                    className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    {rec.title}
                  </Link>
                ) : (
                  <span
                    key={rec.title}
                    className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                  >
                    {rec.title}
                  </span>
                ),
              )
            ) : (
              <p className="text-sm text-slate-500">No recommendations generated yet.</p>
            )}
          </div>
        </section>

        {!insights.is_processed ? (
          <button
            type="button"
            disabled={loading}
            onClick={onGenerate}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate Insights
          </button>
        ) : null}
      </div>
    </div>
  )
}
