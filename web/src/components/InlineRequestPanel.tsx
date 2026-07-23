import type {
  Player,
  PublicGamePlayer,
  RequestableCard,
} from '../types'

type InlineRequestPanelProps = {
  selectedCard: RequestableCard
  players: PublicGamePlayer[]
  roomPlayers: Player[]
  currentPlayerID: string
  targetPlayerID: string
  onSelectTargetPlayer: (playerID: string) => void
  onClearCard: () => void
}

export function InlineRequestPanel({
  selectedCard,
  players,
  roomPlayers,
  currentPlayerID,
  targetPlayerID,
  onSelectTargetPlayer,
  onClearCard,
}: InlineRequestPanelProps) {
  const targetPlayers = players.filter(
    (player) =>
      player.id !== currentPlayerID &&
      player.card_count > 0,
  )

  const connectionByPlayerID = new Map(
    roomPlayers.map((player) => [
      player.id,
      player.is_connected,
    ]),
  )

  return (
    <section className="turn-action-panel inline-request-panel">
      <div className="turn-action-copy">
        <span className="turn-action-kicker">
          Запрос карты
        </span>

        <strong>{selectedCard.title}</strong>

        <p className="form-hint">
          Квартет: {selectedCard.quartet_title}
        </p>

        <button
          className="secondary-button"
          type="button"
          onClick={onClearCard}
        >
          Выбрать другую карту
        </button>
      </div>

      <div
        className="request-flow-players-grid"
        role="group"
        aria-label="Выбор игрока для запроса карты"
      >
        {targetPlayers.map((targetPlayer) => {
          const isSelected =
            targetPlayer.id === targetPlayerID

          const isConnected =
            connectionByPlayerID.get(targetPlayer.id) ?? false

          return (
            <button
              className={
                isSelected
                  ? 'request-flow-player request-flow-player-selected'
                  : 'request-flow-player'
              }
              key={targetPlayer.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() =>
                onSelectTargetPlayer(targetPlayer.id)
              }
            >
              <div className="player-seat-avatar">
                {targetPlayer.name.charAt(0).toUpperCase()}
              </div>

              <strong>{targetPlayer.name}</strong>

              <span>
                {targetPlayer.card_count} карт
                {' · '}
                {isConnected ? 'В сети' : 'Не в сети'}
              </span>
            </button>
          )
        })}

        {targetPlayers.length === 0 && (
          <p className="form-hint">
            Сейчас нет доступных игроков для запроса.
          </p>
        )}
      </div>
    </section>
  )
}
