import { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: React.ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand text-ink-inverse hover:bg-brand-hover active:bg-brand-active',
  secondary: 'bg-surface-card border border-surface-border text-ink-body hover:bg-surface-hover',
  ghost: 'bg-transparent text-ink-body hover:bg-surface-hover',
  danger: 'bg-danger text-ink-inverse hover:bg-danger-hover',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={[
          'rounded font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1',
          variantClasses[variant],
          sizeClasses[size],
          disabled && 'opacity-50 cursor-not-allowed',
          className,
        ].join(' ')}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
export type { Variant as ButtonVariant, Size as ButtonSize }
