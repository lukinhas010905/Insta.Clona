// linguagem: TypeScript/TSX, arquivo: src/flow/IconsFeed.tsx
// Icones do feed falso. Os paths sao copiados do bundle original para o
// desenho bater com o Instagram de verdade.

interface P {
  className?: string
  strokeWidth?: number
}

export function IconCoracao({ className = 'w-[26px] h-[26px]', strokeWidth = 1.5 }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

export function IconMessenger({ className = 'w-[26px] h-[26px]' }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12.003 2.001a9.705 9.705 0 1 1 0 19.4 10.876 10.876 0 0 1-2.895-.384.798.798 0 0 0-.533.04l-1.984.876a.801.801 0 0 1-1.123-.708l-.054-1.78a.806.806 0 0 0-.27-.569 9.49 9.49 0 0 1-3.14-7.175 9.65 9.65 0 0 1 10-9.7z" />
      <path
        d="M17.79 10.132a.659.659 0 0 0-.962-.873l-2.556 2.05a.63.63 0 0 1-.758.002L11.06 9.47a1.576 1.576 0 0 0-2.277.42l-2.567 3.98a.659.659 0 0 0 .961.875l2.556-2.049a.63.63 0 0 1 .759-.002l2.452 1.84a1.576 1.576 0 0 0 2.278-.42z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  )
}

export function IconComentar({ className = 'w-[26px] h-[26px]', strokeWidth = 1.5 }: P) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} scale-x-[-1]`}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}

export function IconCompartilhar({ className = 'w-[26px] h-[26px]' }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22 3 9.218 10.083M11.698 20.334 22 3.001H2l7.218 7.083 2.48 10.25Z" strokeLinejoin="round" />
    </svg>
  )
}

export function IconSalvar({ className = 'w-[26px] h-[26px]', strokeWidth = 1.5 }: P) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} rotate-[-20deg]`}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

export function IconMenuPost({ className = 'w-5 h-5' }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  )
}

/* --------------------------- navegacao inferior --------------------------- */

export function IconCasa({ className = 'w-[26px] h-[26px]' }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M9.005 16.545a2.997 2.997 0 0 1 2.997-2.997h0A2.997 2.997 0 0 1 15 16.545V22h7V11.543L12 2 2 11.543V22h7.005z" />
    </svg>
  )
}

export function IconBusca({ className = 'w-[26px] h-[26px]', strokeWidth = 1.5 }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  )
}

export function IconCriar({ className = 'w-[26px] h-[26px]', strokeWidth = 1.5 }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  )
}

export function IconReels({ className = 'w-[26px] h-[26px]', strokeWidth = 1.5 }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconPilha({ className = 'w-[26px] h-[26px]', strokeWidth = 1.5 }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
      <path d="M12 2 2 7l10 5 10-5-10-5Z" />
      <path d="m2 17 10 5 10-5" />
      <path d="m2 12 10 5 10-5" />
    </svg>
  )
}

export function IconMais({ className = 'w-3.5 h-3.5' }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  )
}
