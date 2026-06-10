import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variantClasses = {
  primary: 'bg-mando-blue text-white hover:bg-blue-600',
  secondary: 'bg-mando-gold/20 text-mando-gold border border-mando-gold/40 hover:bg-mando-gold/30',
  ghost: 'bg-transparent text-mando-silver hover:bg-white/10',
  danger: 'bg-imperial-red/20 text-imperial-red border border-imperial-red/40 hover:bg-imperial-red/30',
}

const sizeClasses = {
  sm: 'min-h-11 min-w-11 px-3 py-1.5 text-sm',
  md: 'min-h-11 min-w-11 px-4 py-2',
  lg: 'px-6 py-3 text-lg',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`rounded-md font-medium transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}
