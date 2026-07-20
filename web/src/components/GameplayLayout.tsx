import type { ReactNode } from 'react'

type GameplayLayoutProps = {
  statusBar: ReactNode
  table: ReactNode
  centralStatus: ReactNode
  action: ReactNode
  hand: ReactNode
}

export function GameplayLayout({
  statusBar,
  table,
  centralStatus,
  action,
  hand,
}: GameplayLayoutProps) {
  return (
    <div className="gameplay-shell">
      <header className="gameplay-shell-status">
        {statusBar}
      </header>

      <main className="gameplay-shell-main">
        <section className="gameplay-shell-table">
          {table}
        </section>

        <section className="gameplay-shell-central-status">
          {centralStatus}
        </section>

        <section className="gameplay-shell-action">
          {action}
        </section>
      </main>

      <footer className="gameplay-shell-hand">
        {hand}
      </footer>
    </div>
  )
}
