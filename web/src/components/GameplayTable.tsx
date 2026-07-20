import type { PublicGameState } from '../types'
import { GameplayPlayerCard } from './GameplayPlayerCard'

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
            <div
              className={`player-seat player-seat-${index}`}
              key={player.id}
            >
              <GameplayPlayerCard
                playerID={player.id}
                name={player.name}
                cardCount={player.card_count}
                completedQuartetsCount={
                  gameState.completed[player.id]?.length ?? 0
                }
                isCurrentTurn={player.id === currentPlayerID}
                onClick={onPlayerClick}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
