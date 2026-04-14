import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[75vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
      <div className="text-7xl font-black tracking-tight text-transparent bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 bg-clip-text sm:text-9xl">
        404
      </div>
      <p className="mt-4 text-2xl font-bold text-slate-900">Oops! This page doesn’t exist</p>
      <p className="mt-3 text-slate-600">
        📖🧭 We checked every shelf, but this page is not in our library.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
      >
        📚 Back to Books
      </Link>
    </div>
  )
}
