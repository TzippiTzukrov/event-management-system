import type { ReactNode, HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
  glass?: boolean
}

export function Card({ children, className = '', glass = false, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border transition-all duration-200
        ${glass
          ? 'bg-white/70 backdrop-blur-sm border-white/50 shadow-xl'
          : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
        } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
