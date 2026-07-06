import type { ReactNode } from 'react'

type GameplayLayoutProps = {
  children: ReactNode
}

export function GameplayLayout({ children }: GameplayLayoutProps) {
  return <div className="gameplay-layout">{children}</div>
}
