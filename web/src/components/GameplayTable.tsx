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

  const completedQuartetsCount = completedQuartets.length

  const currentPlayerName =
    gameState.players.find((player) => player.id === currentPlayerID)?.name ??
    'неизвестно'

  return (
    <section className="panel gameplay-table">
      <h2>Игровой стол</h2>

      <div className={`gameplay-table-center table-player-count-${gameState.players.length}`}>
        <div className="table-surface">
          <div className="table-core">
            <span className="table-core-label">Текущий ход</span>
            <strong>{currentPlayerName}</strong>

            <div className="table-core-meta">
              <span>{gameState.players.length} игроков</span>
              <span>{completedQuartetsCount} квартетов</span>
            </div>
          </div>

          {latestEventTexts.length > 0 && (
            <div className="table-event-strip">
              {latestEventTexts.map((eventText) => (
                <span className="table-event-chip" key={eventText}>
                  {eventText}
                </span>
              ))}
            </div>
          )}

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

              <div className="player-seat-hand" aria-label={`${player.card_count} карт`}>
                <div className="player-card-backs">
                  {Array.from({ length: Math.min(player.card_count, 4) }).map((_, cardIndex) => (
                    <span className="player-card-back" key={cardIndex} />
                  ))}
                </div>

                <span className="player-seat-card-count">
                  {player.card_count} карт
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
