import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, id, ...props }: Props) {
  const inputId = id ?? label?.replace(/\s/g, '-').toLowerCase()
  return (
    <div>
      {label && <label htmlFor={inputId}>{label}</label>}
      <input id={inputId} {...props} />
      {error && <p>{error}</p>}
    </div>
  )
}
