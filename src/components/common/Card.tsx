import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  padding?: 'sm' | 'md' | 'lg'
}

const paddingClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export default function Card({
  children,
  className = '',
  hover = false,
  padding = 'md',
  ...props
}: CardProps) {
  return (
    <div
      className={`
        bg-white border border-slate-200 rounded-lg
        ${paddingClasses[padding]}
        ${hover ? 'hover:border-slate-300 transition-colors' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}
