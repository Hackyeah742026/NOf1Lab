import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'warning'

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold whitespace-nowrap transition duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:pointer-events-none disabled:opacity-55'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-accent)] px-5 py-2.5 text-white shadow-[0_1px_2px_rgba(18,38,29,0.2),inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-[var(--color-accent-hover)] active:translate-y-px',
  secondary:
    'bg-white px-5 py-2.5 text-[var(--color-ink)] shadow-sm ring-1 ring-inset ring-[var(--color-line-strong)] hover:bg-[var(--color-surface-muted)] hover:ring-emerald-900/25 active:translate-y-px',
  ghost:
    'px-3 py-2 text-[var(--color-muted)] hover:bg-emerald-900/5 hover:text-[var(--color-ink)]',
  warning:
    'bg-amber-700 px-5 py-2.5 text-white shadow-sm hover:bg-amber-800 active:translate-y-px focus-visible:outline-amber-700',
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
