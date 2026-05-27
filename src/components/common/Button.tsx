import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-slate-900 hover:bg-slate-800 text-white border border-transparent',
  secondary:
    'bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-900',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-xs font-semibold rounded-md',
  md: 'px-6 py-2.5 text-sm font-semibold rounded-lg',
  lg: 'px-6 py-3 text-sm font-semibold rounded-lg',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        transition-colors cursor-pointer
        disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed disabled:border-transparent
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
