import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'outline-accent'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const variantClass: Record<Variant, string> = {
  primary: 'btn--primary',
  secondary: 'btn--secondary',
  danger: 'btn--danger',
  ghost: 'btn--ghost',
  success: 'btn--success',
  'outline-accent': 'btn--outline-accent',
}

export function Button({
  variant = 'primary',
  loading,
  size = 'md',
  fullWidth,
  children,
  disabled,
  className = '',
  ...props
}: Props) {
  const classes = [
    'btn',
    variantClass[variant],
    `btn--${size}`,
    fullWidth ? 'btn--full' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button {...props} className={classes} disabled={disabled || loading}>
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      {children}
    </button>
  )
}
