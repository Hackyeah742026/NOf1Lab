export function Disclaimer({ className = '' }: { className?: string }) {
  return (
    <p className={`flex items-start gap-2 text-xs leading-relaxed text-[var(--color-subtle)] ${className}`}>
      <svg viewBox="0 0 16 16" className="mt-px h-3.5 w-3.5 shrink-0" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 7.2v3.6M8 5.2v.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span>
        Self-experimentation and coaching only — not medical advice, diagnosis, or treatment.
      </span>
    </p>
  )
}
