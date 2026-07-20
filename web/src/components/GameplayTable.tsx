import type { PublicGameState } from '../types'
import { GameplayPlayerCard } from './GameplayPlayerCard'

type GameplayTableProps = {
  gameState: PublicGameState | null
  currentTurnPlayerID: string
  latestEventTexts: string[]
  onPlayerClick?: (playerID: string) => void
}

type TableSeat = 'top' | 'left' | 'right' | 'bottom'

const seatsByPlayerCount: Record<number, TableSeat[]> = {
  2: ['bottom', 'top'],
  3: ['bottom', 'left', 'right'],
  4: ['bottom', 'left', 'top', 'right'],
}

function getTableSeat(
  playerCount: number,
  playerIndex: number,
): TableSeat | null {
  return seatsByPlayerCount[playerCount]?.[playerIndex] ?? null
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

  const isStandardTable =
    gameState.players.length >= 2 &&
    gameState.players.length <= 4

  const isCompactTable =
    gameState.players.length >= 5

  return (
    <section className="panel gameplay-table">
      <h2>Игровой стол</h2>

      <div
        className={[
          'gameplay-table-center',
          `table-player-count-${gameState.players.length}`,
          isStandardTable
            ? 'gameplay-table-center--standard'
            : '',
          isCompactTable
            ? 'gameplay-table-center--compact'
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
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
          {gameState.players.map((player, index) => {
            const seat = getTableSeat(
              gameState.players.length,
              index,
            )

            return (
              <div
                className={
                  isCompactTable
                    ? 'player-seat player-seat--compact'
                    : seat
                      ? `player-seat player-seat--${seat}`
                      : `player-seat player-seat-${index}`
                }
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
                  density={isCompactTable ? 'compact' : 'standard'}
                  onClick={onPlayerClick}
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
