import type { PublicGameState } from '../types'

type GameplayTableProps = {
  gameState: PublicGameState | null
  currentTurnPlayerID: string
  latestEventTexts: string[]
  onPlayerClick?: (playerID: string) => void
}

export function GameplayTable({
  gameState,
  currentTurnPlayerID: currentPlayerID,
  latestEventTexts,
  onPlayerClick,
}: GameplayTableProps) {
  if (!gameState) {
    return null
  }

  const completedQuartets = Object.entries(gameState.completed).flatMap(
    ([playerID, quartetIDs]) =>
      quartetIDs.map((quartetID) => ({
        playerID,
        playerName:
          gameState.players.find((player) => player.id === playerID)?.name ??
          playerID,
        quartetID,
      })),
  )

  const currentPlayerName =
    gameState.players.find((player) => player.id === currentPlayerID)?.name ??
    'неизвестно'

  return (
    <section className="panel gameplay-table">
      <h2>Игровой стол</h2>

      {latestEventTexts.length > 0 && (
        <div className="gameplay-latest-events">
          {latestEventTexts.map((eventText) => (
            <div className="gameplay-latest-event" key={eventText}>
              {eventText}
            </div>
          ))}
        </div>
      )}

      <div className={`gameplay-table-center table-player-count-${gameState.players.length}`}>
        <div className="table-surface">
          <div className="table-core">
            <span className="table-core-label">Текущий ход</span>
            <strong>{currentPlayerName}</strong>
          </div>

          {completedQuartets.length > 0 && (
            <div className="table-completed-quartets">
              {completedQuartets.map((quartet) => (
                <div
                  className="completed-quartet-chip"
                  key={`${quartet.playerID}-${quartet.quartetID}`}
                >
                  {quartet.playerName}: {quartet.quartetID}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`player-seats player-seats-count-${gameState.players.length}`}>
          {gameState.players.map((player, index) => (
            <button
              className={
                player.id === currentPlayerID
                  ? `player-seat player-seat-current player-seat-${index}`
                  : `player-seat player-seat-${index}`
              }
              key={player.id}
              type="button"
              title={player.name}
              onClick={() => onPlayerClick?.(player.id)}
            >
              <div className="player-seat-avatar">
                {player.name.charAt(0).toUpperCase()}
              </div>

              <strong className="player-seat-name">{player.name}</strong>

              <div className="player-card-backs" aria-label={`${player.card_count} карт`}>
                {Array.from({ length: Math.min(player.card_count, 6) }).map((_, cardIndex) => (
                  <span className="player-card-back" key={cardIndex} />
                ))}

                {player.card_count > 6 && (
                  <span className="player-card-count">+{player.card_count - 6}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
