import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:pointer-events-none disabled:opacity-55'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-accent)] px-5 py-2.5 text-white shadow-sm hover:bg-[var(--color-accent-hover)] active:translate-y-px',
  secondary:
    'bg-[var(--color-accent-soft)] px-5 py-2.5 text-[var(--color-ink)] ring-1 ring-inset ring-emerald-900/10 hover:bg-[var(--color-accent-soft-hover)] active:translate-y-px',
  ghost:
    'px-3 py-2 text-[var(--color-muted)] hover:bg-emerald-900/5 hover:text-[var(--color-ink)]',
}

export function buttonClass(variant: ButtonVariant = 'primary', className = '') {
  return [base, variants[variant], className].filter(Boolean).join(' ')
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

export function Button({ variant = 'primary', className = '', type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />
}
