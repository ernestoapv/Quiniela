// Logo propio de la quiniela: un balón estilizado dentro de un escudo redondeado.
export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="Hay que revolverle"
    >
      <rect width="32" height="32" rx="9" className="fill-pitch" />
      <circle cx="16" cy="16" r="9" className="fill-white/95" />
      <path
        d="M16 9.2l3.1 2.25-1.18 3.65h-3.84L12.9 11.45 16 9.2z"
        className="fill-pitchDark"
      />
      <path
        d="M11.2 17.1l1.5 4.5 3.3 0.0M20.8 17.1l-1.5 4.5-3.3 0.0M9.4 13.2l1.2 3.4M22.6 13.2l-1.2 3.4"
        className="stroke-pitchDark"
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function Logo({ withText = true }: { withText?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <LogoMark className="h-7 w-7" />
      {withText && (
        <span className="font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Hay que revolverle
        </span>
      )}
    </span>
  );
}
