import { AlertCircle } from 'lucide-react'

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">{message || 'Something went wrong.'}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-red-100"
            >
              Try Again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
