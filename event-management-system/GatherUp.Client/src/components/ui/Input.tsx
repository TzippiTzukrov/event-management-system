import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', id, ...props }: Props) {
  const inputId = id ?? label?.replace(/\s/g, '-').toLowerCase()
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={`border rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200
          focus:ring-2 focus:ring-violet-500 focus:border-violet-400 bg-white
          placeholder:text-gray-400
          ${error ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}
          ${className}`}
      />
      {error && <p className="text-xs text-red-500 flex items-center gap-1">⚠ {error}</p>}
    </div>
  )
}
