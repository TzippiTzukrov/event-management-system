import type { ReactNode, HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  interactive?: boolean
  highlight?: boolean
  muted?: boolean
}

export function Card({ children, interactive, highlight, muted, className = '', ...props }: CardProps) {
  const classes = [
    'card',
    interactive ? 'card--interactive' : '',
    highlight ? 'card--highlight' : '',
    muted ? 'card--muted' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div {...props} className={classes}>
      {children}
    </div>
  )
}
