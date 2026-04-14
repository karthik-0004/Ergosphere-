const SIZE_MAP = {
  small: 'w-6 h-6',
  medium: 'w-10 h-10',
  large: 'w-16 h-16',
}

export default function LoadingSpinner({
  text = 'Loading...',
  fullPage = false,
  size = 'medium',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${
        fullPage ? 'min-h-[60vh]' : 'py-8'
      }`}
    >
      <div
        className={`${SIZE_MAP[size] || SIZE_MAP.medium} animate-spin rounded-full border-4 border-blue-200 border-t-blue-500`}
      />
      {text ? <p className="text-sm font-medium text-slate-600">{text}</p> : null}
    </div>
  )
}
