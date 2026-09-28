import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  title: string
  subtitle?: string
  back?: boolean
  right?: ReactNode
}

export default function Header({ title, subtitle, back, right }: HeaderProps) {
  const navigate = useNavigate()
  return (
    <header className="safe-top sticky top-0 z-30 border-b border-ink-800 bg-ink-950/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3.5">
        {back && (
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="-ml-1.5 flex h-9 w-9 items-center justify-center rounded-full text-ink-200 active:bg-ink-800"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 5 8 12l7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[17px] font-semibold text-ink-100">{title}</h1>
          {subtitle && <p className="truncate text-xs text-ink-400">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  )
}
