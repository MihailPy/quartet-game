import type { PublicGameState } from '../types'

type GameplayTableProps = {
  gameState: PublicGameState | null
  currentPlayerID: string
  latestEventText?: string
}

export function GameplayTable({
  gameState,
  currentPlayerID,
  latestEventText,
}: GameplayTableProps) {
  if (!gameState) {
    return null
  }

  return (
    <section className="panel gameplay-table">
      <h2>Игровой стол</h2>

      {latestEventText && (
        <div className="gameplay-latest-event">
          {latestEventText}
        </div>
      )}

      <div className="gameplay-table-center">
        <div className={`player-seats player-seats-count-${gameState.players.length}`}>
          {gameState.players.map((player, index) => (
            <div
              className={
                player.id === currentPlayerID
                  ? `player-seat player-seat-current player-seat-${index}`
                  : `player-seat player-seat-${index}`
              }
              key={player.id}
            >
              <div className="player-seat-avatar">
                {player.name.charAt(0).toUpperCase()}
              </div>

              <strong>{player.name}</strong>

              <span>{player.card_count} карт</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
