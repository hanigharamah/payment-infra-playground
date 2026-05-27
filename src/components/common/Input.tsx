import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export default function Input({ label, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-0">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-4 py-2.5 border border-slate-300 rounded-lg
          text-slate-900 placeholder-slate-400
          focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent
          disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed
          transition-colors text-sm
          ${className}
        `}
        {...props}
      />
    </div>
  )
}
