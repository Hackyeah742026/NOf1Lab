export function Disclaimer({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs leading-relaxed text-[var(--color-muted)] ${className}`}>
      Self-experimentation and coaching only — not medical advice, diagnosis, or
      treatment.
    </p>
  )
}
