import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ variant: _variant, loading, size: _size, children, disabled, ...props }: Props) {
  return (
    <button {...props} disabled={disabled || loading}>
      {loading && <span>...</span>}
      {children}
    </button>
  )
}
