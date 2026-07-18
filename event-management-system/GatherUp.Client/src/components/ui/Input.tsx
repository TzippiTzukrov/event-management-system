import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, id, className = '', ...props }: InputProps) {
  const inputId = id ?? label?.replace(/\s/g, '-').toLowerCase()
  return (
    <div className={`form-group ${className}`.trim()}>
      {label && <label htmlFor={inputId} className="form-label">{label}</label>}
      <input id={inputId} className="form-input" {...props} />
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, id, className = '', rows = 3, ...props }: TextareaProps) {
  const inputId = id ?? label?.replace(/\s/g, '-').toLowerCase()
  return (
    <div className={`form-group ${className}`.trim()}>
      {label && <label htmlFor={inputId} className="form-label">{label}</label>}
      <textarea id={inputId} className="form-textarea" rows={rows} {...props} />
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  children: ReactNode
}

export function Select({ label, error, id, className = '', children, ...props }: SelectProps) {
  const inputId = id ?? label?.replace(/\s/g, '-').toLowerCase()
  return (
    <div className={`form-group ${className}`.trim()}>
      {label && <label htmlFor={inputId} className="form-label">{label}</label>}
      <select id={inputId} className="form-select" {...props}>{children}</select>
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}
