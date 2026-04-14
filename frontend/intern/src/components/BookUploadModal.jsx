import { Loader2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { bookApi } from '../api/bookApi'

const initialForm = {
  title: '',
  author: '',
  rating: '',
  num_reviews: '',
  description: '',
  genre: '',
  book_url: '',
  cover_image_url: '',
  price: '',
  availability: '',
}

function isValidUrl(value) {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

export default function BookUploadModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors])

  if (!open) return null

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const validate = () => {
    const nextErrors = {}

    if (!form.title.trim()) nextErrors.title = 'Title is required.'
    if (!form.author.trim()) nextErrors.author = 'Author is required.'

    if (form.rating !== '') {
      const ratingValue = Number(form.rating)
      if (Number.isNaN(ratingValue) || ratingValue < 0 || ratingValue > 5) {
        nextErrors.rating = 'Rating must be between 0 and 5.'
      }
    }

    if (form.book_url && !isValidUrl(form.book_url)) {
      nextErrors.book_url = 'Book URL must be a valid URL.'
    }

    if (form.cover_image_url && !isValidUrl(form.cover_image_url)) {
      nextErrors.cover_image_url = 'Cover Image URL must be a valid URL.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitError('')

    if (!validate()) return

    const payload = {
      ...form,
      rating: form.rating === '' ? undefined : Number(form.rating),
      num_reviews: form.num_reviews === '' ? undefined : Number(form.num_reviews),
    }

    setLoading(true)
    try {
      await bookApi.uploadBook(payload)
      toast.success('Book added successfully.')
      setForm(initialForm)
      setErrors({})
      onClose()
      if (onSuccess) onSuccess()
    } catch (error) {
      setSubmitError(
        error?.response?.data?.error ||
          error?.response?.data?.detail ||
          'Failed to upload book. Please check inputs.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-xl font-black text-slate-900">Add New Book</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Title*" value={form.title} error={errors.title} onChange={(v) => updateField('title', v)} />
            <Field label="Author*" value={form.author} error={errors.author} onChange={(v) => updateField('author', v)} />
            <Field label="Rating" type="number" step="0.1" min="0" max="5" value={form.rating} error={errors.rating} onChange={(v) => updateField('rating', v)} />
            <Field label="Number of Reviews" type="number" value={form.num_reviews} onChange={(v) => updateField('num_reviews', v)} />
            <Field label="Genre" value={form.genre} onChange={(v) => updateField('genre', v)} />
            <Field label="Price" value={form.price} onChange={(v) => updateField('price', v)} />
            <Field label="Availability" value={form.availability} onChange={(v) => updateField('availability', v)} />
            <Field label="Book URL" type="url" value={form.book_url} error={errors.book_url} onChange={(v) => updateField('book_url', v)} />
            <Field label="Cover Image URL" type="url" value={form.cover_image_url} error={errors.cover_image_url} onChange={(v) => updateField('cover_image_url', v)} />
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Description</span>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-300 focus:ring"
            />
          </label>

          {submitError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p>
          ) : null}

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || hasErrors}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Add Book
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, error, onChange, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        {...props}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-300 focus:ring"
      />
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  )
}
