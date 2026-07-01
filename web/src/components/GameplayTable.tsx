type GameplayTableProps = {
  latestEventText?: string
}

export function GameplayTable({
  latestEventText,
}: GameplayTableProps) {
  return (
    <section className="panel gameplay-table">
      <h2>Игровой стол</h2>

      {latestEventText && (
        <div className="gameplay-latest-event">
          {latestEventText}
        </div>
      )}

      <div className="gameplay-table-center">
        <p>Игроки и игровые зоны появятся здесь.</p>
      </div>
    </section>
  )
}
